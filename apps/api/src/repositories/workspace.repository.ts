import { db, workspaces, writeAuditLog, eq, and, isNull } from "@novabots/db";

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
    return db.transaction(async (trx) => {
      const [inserted] = await trx.insert(workspaces).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: inserted!.id,
        actorId: null,
        actorType: "system",
        entityType: "workspace",
        entityId: inserted!.id,
        action: "create",
        metadata: { name: data.name },
      });
      return inserted ?? null;
    });
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

  async listAll() {
    return db
      .select()
      .from(workspaces)
      .where(isNull(workspaces.deletedAt));
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
