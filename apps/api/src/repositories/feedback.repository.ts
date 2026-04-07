import { db, feedbackItems, deliverables, eq, and, desc, inArray, isNull } from "@novabots/db";
import type { NewFeedbackItem, FeedbackItem } from "@novabots/db";

export const feedbackRepository = {
  async listByDeliverable(workspaceId: string, deliverableId: string) {
    return db
      .select({
        id: feedbackItems.id,
        deliverableId: feedbackItems.deliverableId,
        authorId: feedbackItems.authorId,
        authorName: feedbackItems.authorName,
        source: feedbackItems.source,
        body: feedbackItems.body,
        annotationJson: feedbackItems.annotationJson,
        resolvedAt: feedbackItems.resolvedAt,
        createdAt: feedbackItems.createdAt,
      })
      .from(feedbackItems)
      .innerJoin(
        deliverables,
        eq(feedbackItems.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(feedbackItems.deliverableId, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .orderBy(desc(feedbackItems.createdAt));
  },

  async getById(workspaceId: string, feedbackId: string) {
    const [item] = await db
      .select({
        id: feedbackItems.id,
        deliverableId: feedbackItems.deliverableId,
        authorId: feedbackItems.authorId,
        authorName: feedbackItems.authorName,
        source: feedbackItems.source,
        body: feedbackItems.body,
        annotationJson: feedbackItems.annotationJson,
        resolvedAt: feedbackItems.resolvedAt,
        createdAt: feedbackItems.createdAt,
      })
      .from(feedbackItems)
      .innerJoin(
        deliverables,
        eq(feedbackItems.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(feedbackItems.id, feedbackId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .limit(1);
    return item ?? null;
  },

  async create(workspaceId: string, data: NewFeedbackItem, trx?: unknown) {
    const driver = trx ?? db;
    const [deliverable] = await (driver as typeof db)
      .select({ id: deliverables.id })
      .from(deliverables)
      .where(
        and(
          eq(deliverables.id, data.deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .limit(1);

    if (!deliverable) return null;

    const [item] = await (driver as typeof db).insert(feedbackItems).values(data).returning();
    return item!;
  },

  async setResolved(workspaceId: string, feedbackId: string, resolved: boolean, trx?: unknown) {
    const driver = trx ?? db;
    const workspaceDeliverableIds = (driver as typeof db)
      .select({ id: deliverables.id })
      .from(deliverables)
      .where(
        and(
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      );

    const [updated] = await (driver as typeof db)
      .update(feedbackItems)
      .set({ resolvedAt: resolved ? new Date() : null })
      .where(
        and(
          eq(feedbackItems.id, feedbackId),
          inArray(feedbackItems.deliverableId, workspaceDeliverableIds),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async delete(feedbackId: string, workspaceId: string, trx?: unknown) {
    const driver = trx ?? db;
    const workspaceDeliverableIds = (driver as typeof db)
      .select({ id: deliverables.id })
      .from(deliverables)
      .where(
        and(
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      );

    const [deleted] = await (driver as typeof db)
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
