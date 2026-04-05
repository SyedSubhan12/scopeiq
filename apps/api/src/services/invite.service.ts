import { createClient } from "@supabase/supabase-js";
import { invitationRepository } from "../repositories/invitation.repository.js";
import { db, users, workspaces, eq } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { env } from "../lib/env.js";
import { sendInviteEmail } from "../lib/email.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const inviteService = {
  async createInvite(
    workspaceId: string,
    invitedBy: string,
    data: { email: string; role: "admin" | "member" },
  ) {
    // Check for existing pending invite
    const existing = await invitationRepository.findPendingByEmail(
      data.email,
      workspaceId,
    );
    if (existing) {
      throw new ValidationError(
        "A pending invitation already exists for this email",
      );
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invitation = await invitationRepository.create({
      workspaceId,
      email: data.email,
      role: data.role,
      invitedBy,
      expiresAt,
    });

    // Resolve inviter name for the email
    const [inviter] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, invitedBy))
      .limit(1);

    // Resolve workspace name for the email
    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${String(invitation.token)}`;

    // Always log in dev — useful when RESEND_API_KEY is not configured
    if (process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY) {
      console.log(`\n[Invite] ✉  Link for ${data.email}:\n  ${inviteUrl}\n`);
    }

    // Send invitation email (fire-and-forget — don't fail the API call if email fails)
    sendInviteEmail({
      to: data.email,
      token: String(invitation.token),
      workspaceName: workspace?.name ?? "your workspace",
      inviterName: inviter?.fullName ?? "your team member",
      role: data.role,
    }).catch((err) => {
      console.error("[Invite] Failed to send email:", err);
    });

    return invitation;
  },

  async listPending(workspaceId: string) {
    return invitationRepository.listPendingByWorkspace(workspaceId);
  },

  async revokeInvite(id: string, workspaceId: string) {
    const deleted = await invitationRepository.delete(id, workspaceId);
    if (!deleted) {
      throw new NotFoundError("Invitation", id);
    }
    return deleted;
  },

  async acceptInvite(data: {
    token: string;
    fullName: string;
    password: string;
  }) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Validate token
    const invitation = await invitationRepository.getByToken(data.token);
    if (!invitation) {
      throw new ValidationError("Invalid or expired invitation");
    }
    if (invitation.acceptedAt) {
      throw new ValidationError("This invitation has already been accepted");
    }
    if (invitation.expiresAt < new Date()) {
      throw new ValidationError("This invitation has expired");
    }

    // 2. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      throw new ValidationError(authError.message);
    }

    try {
      // 3. Create DB user in the invited workspace
      const [user] = await db
        .insert(users)
        .values({
          workspaceId: invitation.workspaceId,
          authUid: authData.user.id,
          email: invitation.email,
          fullName: data.fullName,
          role: invitation.role,
          userType: "agency",
        })
        .returning();

      // 4. Mark invitation as accepted
      await invitationRepository.markAccepted(data.token);

      // 5. Get workspace info for response
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, invitation.workspaceId))
        .limit(1);

      return {
        user: { id: user!.id, email: user!.email, fullName: user!.fullName },
        workspace: { id: workspace!.id, name: workspace!.name, slug: workspace!.slug },
      };
    } catch (err) {
      // Rollback Supabase user on failure
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw err;
    }
  },
};
