import { db, reminderLogs, eq, desc } from "@novabots/db";
import type { NewReminderLog, ReminderStep } from "@novabots/db";

export const reminderLogRepository = {
  async listByDeliverable(deliverableId: string) {
    return db
      .select()
      .from(reminderLogs)
      .where(eq(reminderLogs.deliverableId, deliverableId))
      .orderBy(desc(reminderLogs.sentAt));
  },

  async countByDeliverable(deliverableId: string) {
    const rows = await db
      .select()
      .from(reminderLogs)
      .where(eq(reminderLogs.deliverableId, deliverableId));
    return rows.length;
  },

  async hasStep(deliverableId: string, step: ReminderStep) {
    const rows = await db
      .select()
      .from(reminderLogs)
      .where(
        eq(reminderLogs.deliverableId, deliverableId),
      );
    return rows.some((r) => r.step === step);
  },

  async create(data: NewReminderLog) {
    const [log] = await db.insert(reminderLogs).values(data).returning();
    return log!;
  },
};
