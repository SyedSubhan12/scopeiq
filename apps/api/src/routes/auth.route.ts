import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { db, users, workspaces, eq } from "@novabots/db";
import { ValidationError } from "@novabots/types";
import { env } from "../lib/env.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(255),
  workspaceName: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = new Hono();

authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, fullName, workspaceName } = c.req.valid("json");

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Check for orphaned user (exists in Supabase Auth but NOT in our DB)
  const { data: { users: existingAuthUsers } } = await supabase.auth.admin.listUsers();
  const orphanedUser = existingAuthUsers.find(u => u.email === email);

  if (orphanedUser) {
    const [dbUser] = await db.select().from(users).where(eq(users.authUid, orphanedUser.id)).limit(1);
    if (!dbUser) {
      console.log(`[Auth] Detected orphaned Supabase user ${email}. Cleaning up for re-registration.`);
      await supabase.auth.admin.deleteUser(orphanedUser.id);
    } else {
      throw new ValidationError("A user with this email address has already been registered");
    }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new ValidationError(authError.message);
  }

  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug: `${slug}-${Date.now().toString(36)}`,
      })
      .returning();

    if (!workspace) throw new ValidationError("Failed to create workspace");

    const [user] = await db
      .insert(users)
      .values({
        workspaceId: workspace.id,
        authUid: authData.user.id,
        email,
        fullName,
        role: "owner",
      })
      .returning();

    return c.json({
      data: {
        user: { id: user!.id, email: user!.email, fullName: user!.fullName },
        workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      },
    });
  } catch (err) {
    // Rollback: delete the Supabase auth user to prevent orphaned accounts
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw err;
  }
});

authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new ValidationError(error.message);
  }

  return c.json({
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
});
