import { db, briefEmbeds, eq, and, isNull } from "@novabots/db";
import type { NewBriefEmbed } from "@novabots/db";

export const briefEmbedRepository = {
  async list(workspaceId: string) {
    return db
      .select()
      .from(briefEmbeds)
      .where(and(eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
      .orderBy(briefEmbeds.createdAt);
  },

  async getById(workspaceId: string, id: string) {
    const [row] = await db
      .select()
      .from(briefEmbeds)
      .where(and(eq(briefEmbeds.id, id), eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async getByToken(token: string) {
    const [row] = await db
      .select()
      .from(briefEmbeds)
      .where(and(eq(briefEmbeds.token, token), isNull(briefEmbeds.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(data: NewBriefEmbed) {
    const [row] = await db.insert(briefEmbeds).values(data).returning();
    return row!;
  },

  async update(workspaceId: string, id: string, data: Partial<NewBriefEmbed>) {
    const [row] = await db
      .update(briefEmbeds)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(briefEmbeds.id, id), eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
      .returning();
    return row ?? null;
  },

  async softDelete(workspaceId: string, id: string) {
    const [row] = await db
      .update(briefEmbeds)
      .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
      .where(and(eq(briefEmbeds.id, id), eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
      .returning();
    return row ?? null;
  },
};
