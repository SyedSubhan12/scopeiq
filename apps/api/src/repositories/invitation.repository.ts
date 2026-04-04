import { db, invitations, eq, and, isNull, gt } from "@novabots/db";
import type { NewInvitation } from "@novabots/db";

export const invitationRepository = {
  async listPendingByWorkspace(workspaceId: string) {
    const now = new Date();
    return db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, workspaceId),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, now),
        ),
      );
  },

  async getByToken(token: string) {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    return invitation ?? null;
  },

  async create(data: NewInvitation) {
    const [invitation] = await db.insert(invitations).values(data).returning();
    return invitation!;
  },

  async markAccepted(token: string) {
    const [updated] = await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.token, token))
      .returning();
    return updated ?? null;
  },

  async delete(id: string, workspaceId: string) {
    const [deleted] = await db
      .delete(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.workspaceId, workspaceId)))
      .returning();
    return deleted ?? null;
  },

  async findPendingByEmail(email: string, workspaceId: string) {
    const now = new Date();
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.workspaceId, workspaceId),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, now),
        ),
      )
      .limit(1);
    return invitation ?? null;
  },
};
