import { db, approvalEvents, eq, desc } from "@novabots/db";
import type { NewApprovalEvent } from "@novabots/db";

export const approvalEventRepository = {
  async listByDeliverable(deliverableId: string) {
    return db
      .select()
      .from(approvalEvents)
      .where(eq(approvalEvents.deliverableId, deliverableId))
      .orderBy(desc(approvalEvents.createdAt));
  },

  async create(data: NewApprovalEvent) {
    const [event] = await db.insert(approvalEvents).values(data).returning();
    return event!;
  },
};
