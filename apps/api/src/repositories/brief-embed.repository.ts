import { db, briefEmbeds, writeAuditLog, eq, and, isNull } from "@novabots/db";
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
    return db.transaction(async (trx) => {
      const [row] = await trx.insert(briefEmbeds).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_embed",
        entityId: row!.id,
        action: "create",
        metadata: { token: data.token },
      });
      return row!;
    });
  },

  async update(workspaceId: string, id: string, data: Partial<NewBriefEmbed>) {
    return db.transaction(async (trx) => {
      const [row] = await trx
        .update(briefEmbeds)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(briefEmbeds.id, id), eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
        .returning();
      if (row) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "brief_embed",
          entityId: id,
          action: "update",
        });
      }
      return row ?? null;
    });
  },

  async softDelete(workspaceId: string, id: string) {
    return db.transaction(async (trx) => {
      const [row] = await trx
        .update(briefEmbeds)
        .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
        .where(and(eq(briefEmbeds.id, id), eq(briefEmbeds.workspaceId, workspaceId), isNull(briefEmbeds.deletedAt)))
        .returning();
      if (row) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "brief_embed",
          entityId: id,
          action: "delete",
        });
      }
      return row ?? null;
    });
  },
};
