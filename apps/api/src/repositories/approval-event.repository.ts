import { db, approvalEvents, deliverables, eq, and, isNull, desc } from "@novabots/db";
import type { NewApprovalEvent } from "@novabots/db";

export const approvalEventRepository = {
  async listByDeliverable(workspaceId: string, deliverableId: string) {
    return db
      .select()
      .from(approvalEvents)
      .innerJoin(
        deliverables,
        eq(approvalEvents.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(approvalEvents.deliverableId, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .orderBy(desc(approvalEvents.createdAt));
  },

  async create(data: NewApprovalEvent, trx?: unknown) {
    const driver = trx ?? db;
    const [event] = await (driver as typeof db).insert(approvalEvents).values(data).returning();
    return event!;
  },
};
