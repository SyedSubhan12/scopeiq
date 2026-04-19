import { db, workspaces, eq, and, isNull } from "@novabots/db";

export const workspaceRepository = {
  async getById(workspaceId: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    return workspace ?? null;
  },

  async update(workspaceId: string, data: Partial<typeof workspaces.$inferInsert>) {
    const [updated] = await db
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    return updated ?? null;
  },

  async create(data: typeof workspaces.$inferInsert) {
    const [inserted] = await db.insert(workspaces).values(data).returning();
    return inserted ?? null;
  },

  async getByIdWithDomain(workspaceId: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, workspaceId),
          isNull(workspaces.deletedAt),
        ),
      )
      .limit(1);
    return workspace ?? null;
  },

  async updateAiPolicy(
    workspaceId: string,
    data: Partial<
      Pick<
        typeof workspaces.$inferInsert,
        | "briefScoreThreshold"
        | "scopeGuardThreshold"
        | "autoHoldEnabled"
        | "autoApproveAfterDays"
      >
    >,
    trx: typeof db = db,
  ) {
    const [updated] = await trx
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)))
      .returning();
    return updated ?? null;
  },

  async updateDomainVerification(
    workspaceId: string,
    data: Pick<
      typeof workspaces.$inferInsert,
      | "domainVerificationStatus"
      | "domainVerificationToken"
      | "domainVerifiedAt"
      | "domainVerificationAttemptedAt"
    >,
    trx: typeof db = db,
  ) {
    const [updated] = await trx
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    return updated ?? null;
  },
};
