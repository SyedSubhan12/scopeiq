import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { reminderLogRepository } from "../repositories/reminder-log.repository.js";
import { approvalEventRepository } from "../repositories/approval-event.repository.js";
import { db, projects, clients, eq } from "@novabots/db";
import type { ReminderStep } from "@novabots/db";

const REMINDER_SCHEDULE: { step: ReminderStep; hoursAfterReview: number }[] = [
  { step: "gentle_nudge", hoursAfterReview: 48 },
  { step: "deadline_warning", hoursAfterReview: 96 },
  { step: "silence_approval", hoursAfterReview: 168 },
];

const AUTO_APPROVE_HOURS_AFTER_SILENCE = 48;

async function resolveClientEmail(projectId: string): Promise<string | null> {
  const [row] = await db
    .select({ contactEmail: clients.contactEmail })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  return row?.contactEmail ?? null;
}

export const reminderService = {
  /**
   * Check all in_review deliverables and dispatch appropriate reminders.
   * Called by the cron-triggered send-reminder job.
   */
  async processReminders() {
    const now = new Date();
    const deliverables = await deliverableRepository.findInReviewSince(new Date(0));
    const results: { deliverableId: string; action: string }[] = [];

    for (const deliverable of deliverables) {
      // Use reviewStartedAt (set when upload confirmed); fall back to updatedAt
      const reviewStartedAt = deliverable.reviewStartedAt ?? deliverable.updatedAt;
      const hoursSinceReview =
        (now.getTime() - reviewStartedAt.getTime()) / (1000 * 60 * 60);

      // Check if auto-approve should trigger (silence_approval sent + 48h passed)
      const hasSilenceReminder = await reminderLogRepository.hasStep(
        deliverable.id,
        "silence_approval",
      );

      if (hasSilenceReminder) {
        const silenceThreshold =
          REMINDER_SCHEDULE[2]!.hoursAfterReview + AUTO_APPROVE_HOURS_AFTER_SILENCE;
        if (hoursSinceReview >= silenceThreshold) {
          await deliverableRepository.update(
            deliverable.workspaceId,
            deliverable.id,
            { status: "approved" },
          );
          await approvalEventRepository.create({
            deliverableId: deliverable.id,
            actorId: null,
            actorName: "System",
            action: "auto_approved",
            comment: "Auto-approved due to client silence after reminder sequence",
          });
          results.push({ deliverableId: deliverable.id, action: "auto_approved" });
          continue;
        }
      }

      // Send the next pending reminder step
      for (const { step, hoursAfterReview } of REMINDER_SCHEDULE) {
        if (hoursSinceReview < hoursAfterReview) break;

        const alreadySent = await reminderLogRepository.hasStep(deliverable.id, step);
        if (alreadySent) continue;

        // Resolve client email from project → client relationship
        const clientEmail = await resolveClientEmail(deliverable.projectId);

        // TODO: plug in real email service (Resend, SendGrid, etc.)
        await reminderLogRepository.create({
          deliverableId: deliverable.id,
          step,
          recipientEmail: clientEmail ?? "unknown@unknown.com",
        });

        results.push({ deliverableId: deliverable.id, action: `sent_${step}` });
        break; // Only send one step per cycle
      }
    }

    return results;
  },
};
