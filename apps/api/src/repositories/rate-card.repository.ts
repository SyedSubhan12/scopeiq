import { db, rateCardItems, eq, and, isNull, desc } from "@novabots/db";
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
    const [item] = await db.insert(rateCardItems).values(data).returning();
    return item!;
  },

  async update(workspaceId: string, itemId: string, data: Partial<NewRateCardItem>) {
    const [updated] = await db
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
    return updated ?? null;
  },

  async softDelete(workspaceId: string, itemId: string) {
    const [deleted] = await db
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
    return deleted ?? null;
  },
};
