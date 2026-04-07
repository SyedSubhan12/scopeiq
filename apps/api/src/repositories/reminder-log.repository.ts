import { db, reminderLogs, projects, deliverables, eq, and, isNull, desc } from "@novabots/db";
import type { NewReminderLog, ReminderStep } from "@novabots/db";

export const reminderLogRepository = {
  async listByDeliverable(workspaceId: string, deliverableId: string) {
    const rows = await db
      .select({
        id: reminderLogs.id,
        projectId: reminderLogs.projectId,
        deliverableId: reminderLogs.deliverableId,
        sequenceStep: reminderLogs.sequenceStep,
        step: reminderLogs.step,
        recipientEmail: reminderLogs.recipientEmail,
        sentAt: reminderLogs.sentAt,
        deliveryStatus: reminderLogs.deliveryStatus,
        openedAt: reminderLogs.openedAt,
      })
      .from(reminderLogs)
      .innerJoin(
        deliverables,
        eq(reminderLogs.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(reminderLogs.deliverableId, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .orderBy(desc(reminderLogs.sentAt));

    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      deliverableId: r.deliverableId,
      sequenceStep: r.sequenceStep,
      step: r.step,
      recipientEmail: r.recipientEmail,
      sentAt: r.sentAt,
      deliveryStatus: r.deliveryStatus,
      openedAt: r.openedAt,
    }));
  },

  async countByDeliverable(workspaceId: string, deliverableId: string) {
    const rows = await db
      .select({ count: reminderLogs.id })
      .from(reminderLogs)
      .innerJoin(
        deliverables,
        eq(reminderLogs.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(reminderLogs.deliverableId, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      );
    return rows.length;
  },

  async hasStep(workspaceId: string, deliverableId: string, step: ReminderStep) {
    const rows = await db
      .select({ step: reminderLogs.step })
      .from(reminderLogs)
      .innerJoin(
        deliverables,
        eq(reminderLogs.deliverableId, deliverables.id),
      )
      .where(
        and(
          eq(reminderLogs.deliverableId, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      );
    return rows.some((r) => r.step === step);
  },

  async create(
    workspaceId: string,
    data: Omit<NewReminderLog, "projectId" | "sequenceStep">,
    trx?: unknown,
  ) {
    const driver = trx ?? db;
    // Verify the deliverable belongs to the workspace before inserting
    const [deliverable] = await (driver as typeof db)
      .select({ id: deliverables.id, projectId: deliverables.projectId })
      .from(deliverables)
      .where(
        and(
          eq(deliverables.id, data.deliverableId as string),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .limit(1);

    if (!deliverable) return null;

    // Auto-generate sequenceStep based on existing logs for this deliverable
    const existingLogs = await (driver as typeof db)
      .select({ id: reminderLogs.id })
      .from(reminderLogs)
      .where(eq(reminderLogs.deliverableId, data.deliverableId as string));

    const sequenceStep = existingLogs.length + 1;

    // Ensure projectId in data matches the deliverable's project
    const [log] = await (driver as typeof db)
      .insert(reminderLogs)
      .values({ ...data, projectId: deliverable.projectId, sequenceStep })
      .returning();
    return log!;
  },
};
