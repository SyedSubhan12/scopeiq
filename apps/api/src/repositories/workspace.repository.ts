import { db, workspaces, eq } from "@novabots/db";

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
};
