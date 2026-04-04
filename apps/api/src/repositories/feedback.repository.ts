import { db, feedbackItems, deliverables, eq, and, desc, inArray } from "@novabots/db";
import type { NewFeedbackItem, FeedbackItem } from "@novabots/db";

export const feedbackRepository = {
  async listByDeliverable(deliverableId: string) {
    return db
      .select()
      .from(feedbackItems)
      .where(eq(feedbackItems.deliverableId, deliverableId))
      .orderBy(desc(feedbackItems.createdAt));
  },

  async getById(feedbackId: string) {
    const [item] = await db
      .select()
      .from(feedbackItems)
      .where(eq(feedbackItems.id, feedbackId))
      .limit(1);
    return item ?? null;
  },

  async create(data: NewFeedbackItem) {
    const [item] = await db.insert(feedbackItems).values(data).returning();
    return item!;
  },

  async setResolved(feedbackId: string, resolved: boolean) {
    const [updated] = await db
      .update(feedbackItems)
      .set({ resolvedAt: resolved ? new Date() : null })
      .where(eq(feedbackItems.id, feedbackId))
      .returning();
    return updated ?? null;
  },

  /**
   * Delete a feedback item only if it belongs to a deliverable in the given workspace.
   * This prevents cross-workspace authorization bypass.
   */
  async delete(feedbackId: string, workspaceId: string) {
    // Sub-select deliverable IDs that belong to this workspace
    const workspaceDeliverableIds = db
      .select({ id: deliverables.id })
      .from(deliverables)
      .where(eq(deliverables.workspaceId, workspaceId));

    const [deleted] = await db
      .delete(feedbackItems)
      .where(
        and(
          eq(feedbackItems.id, feedbackId),
          inArray(feedbackItems.deliverableId, workspaceDeliverableIds),
        ),
      )
      .returning();
    return deleted ?? null;
  },
};
