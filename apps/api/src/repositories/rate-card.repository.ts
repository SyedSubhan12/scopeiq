import { db, rateCardItems, writeAuditLog, eq, and, isNull, desc } from "@novabots/db";
import type { NewRateCardItem } from "@novabots/db";

export const rateCardRepository = {
  async list(workspaceId: string) {
    return db
      .select()
      .from(rateCardItems)
      .where(and(eq(rateCardItems.workspaceId, workspaceId), isNull(rateCardItems.deletedAt)))
      .orderBy(desc(rateCardItems.createdAt));
  },

  async create(data: NewRateCardItem) {
    return db.transaction(async (trx) => {
      const [item] = await trx.insert(rateCardItems).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "rate_card_item",
        entityId: item!.id,
        action: "create",
        metadata: { name: data.name },
      });
      return item!;
    });
  },

  async update(workspaceId: string, itemId: string, data: Partial<NewRateCardItem>) {
    return db.transaction(async (trx) => {
      const [updated] = await trx
        .update(rateCardItems)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(rateCardItems.id, itemId),
            eq(rateCardItems.workspaceId, workspaceId),
            isNull(rateCardItems.deletedAt),
          ),
        )
        .returning();
      if (updated) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "rate_card_item",
          entityId: itemId,
          action: "update",
        });
      }
      return updated ?? null;
    });
  },

  async softDelete(workspaceId: string, itemId: string) {
    return db.transaction(async (trx) => {
      const [deleted] = await trx
        .update(rateCardItems)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(rateCardItems.id, itemId),
            eq(rateCardItems.workspaceId, workspaceId),
            isNull(rateCardItems.deletedAt),
          ),
        )
        .returning();
      if (deleted) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "rate_card_item",
          entityId: itemId,
          action: "delete",
        });
      }
      return deleted ?? null;
    });
  },
};
