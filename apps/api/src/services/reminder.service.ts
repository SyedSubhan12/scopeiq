import { Queue, Worker } from "bullmq";
import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { reminderLogRepository } from "../repositories/reminder-log.repository.js";
import { approvalEventRepository } from "../repositories/approval-event.repository.js";
import { db, projects, clients, workspaces, eq, and, isNull, writeAuditLog } from "@novabots/db";
import { sendReminderEmail } from "../lib/resend.js";
import { generateEmailApprovalToken } from "../routes/email-approval.route.js";
import { getRedisConnection } from "../lib/redis.js";
import type { ReminderStep } from "@novabots/db";

const REMINDER_SCHEDULE: { step: number; reminderStep: ReminderStep; defaultHours: number }[] = [
  { step: 1, reminderStep: "gentle_nudge", defaultHours: 48 },
  { step: 2, reminderStep: "deadline_warning", defaultHours: 72 },
  { step: 3, reminderStep: "silence_approval", defaultHours: 48 },
];

const AUTO_APPROVE_HOURS_AFTER_SILENCE = 48;

let reminderQueue: Queue | null = null;

export function getReminderQueue(): Queue {
  if (!reminderQueue) {
    reminderQueue = new Queue("approval-reminders", { connection: getRedisConnection() });
  }
  return reminderQueue;
}

export interface ReminderJobData {
  projectId: string;
  deliverableId: string;
  workspaceId: string;
  step: number | "auto_approve";
}

async function getWorkspaceSettings(workspaceId: string): Promise<{ step1Hours?: number; step2Hours?: number; step3Hours?: number } | null> {
  const [ws] = await db
    .select({ reminderSettings: workspaces.reminderSettings })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return (ws?.reminderSettings as Record<string, number> | null) ?? {};
}

export const reminderService = {
  /**
   * Schedule the full 3-step reminder sequence when a deliverable enters review.
   */
  async scheduleReminderSequence(projectId: string, deliverableId: string, workspaceId: string): Promise<void> {
    const settings = await getWorkspaceSettings(workspaceId);
    const step1Delay = (settings?.step1Hours ?? REMINDER_SCHEDULE[0]!.defaultHours) * 60 * 60 * 1000;

    await getReminderQueue().add(
      `reminder-${deliverableId}-1`,
      { projectId, deliverableId, workspaceId, step: 1 } satisfies ReminderJobData,
      {
        delay: step1Delay,
        jobId: `reminder-${deliverableId}-1`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  },

  /**
   * Process a single reminder step (called by BullMQ worker).
   */
  async processReminderStep(data: ReminderJobData): Promise<{ action: string }> {
    const { projectId, deliverableId, workspaceId, step } = data;
    if (step === "auto_approve") {
      return this.autoApproveAfterSilence({ projectId, deliverableId, workspaceId });
    }

    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable || deliverable.status !== "in_review") {
      return { action: "skipped_not_in_review" };
    }

    const events = await approvalEventRepository.listByDeliverable(workspaceId, deliverableId);
    if (events.length > 0) {
      return { action: "skipped_already_responded" };
    }

    const [row] = await db
      .select({
        contactEmail: clients.contactEmail,
        contactName: clients.contactName,
        agencyName: workspaces.name,
        projectName: projects.name,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1);

    const email = row?.contactEmail;
    if (!email) return { action: "skipped_no_email" };

    const config = REMINDER_SCHEDULE[step - 1];
    if (!config) return { action: "invalid_step" };

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";
    const reviewUrl = `${portalUrl}/portal/review/${deliverableId}`;
    const { approveUrl, declineUrl } = generateEmailApprovalToken(deliverableId, projectId);

    try {
      await sendReminderEmail({
        to: email,
        deliverableName: deliverable.name,
        recipientName: row.contactName ?? "there",
        step: step as 1 | 2 | 3,
        approvalStep: config.reminderStep,
        reviewUrl,
        deliverableId,
        projectId,
        approveUrl,
        declineUrl,
      });
    } catch (error) {
      return { action: `email_failed: ${error instanceof Error ? error.message : String(error)}` };
    }

    await db.transaction(async (trx) => {
      const reminderLog = await reminderLogRepository.create(
        workspaceId,
        {
          deliverableId,
          step: config.reminderStep,
          recipientEmail: email,
          deliveryStatus: "sent",
          openedAt: null,
          sentAt: new Date(),
        },
        trx as never,
      );

      if (!reminderLog) {
        throw new Error(`Unable to persist reminder log for deliverable ${deliverableId}`);
      }

      await writeAuditLog(trx as never, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "reminder_log",
        entityId: reminderLog.id,
        action: "send",
        metadata: {
          deliverableId,
          projectId,
          reminderStep: config.reminderStep,
          recipientEmail: email,
        },
      });
    });

    // Schedule next step
    const nextConfig = REMINDER_SCHEDULE[step];
    if (nextConfig) {
      const settings = await getWorkspaceSettings(workspaceId);
      const settingsKey =
        nextConfig.step === 1
          ? "step1Hours"
          : nextConfig.step === 2
            ? "step2Hours"
            : "step3Hours";
      const delay = (settings?.[settingsKey] ?? nextConfig.defaultHours) * 60 * 60 * 1000;
      await getReminderQueue().add(
        `reminder-${deliverableId}-${nextConfig.step}`,
        { projectId, deliverableId, workspaceId, step: nextConfig.step } satisfies ReminderJobData,
        {
          delay,
          jobId: `reminder-${deliverableId}-${nextConfig.step}`,
          removeOnComplete: true,
        },
      );
    } else if (config.reminderStep === "silence_approval") {
      // Schedule auto-approve after silence period
      const delay = AUTO_APPROVE_HOURS_AFTER_SILENCE * 60 * 60 * 1000;
      await getReminderQueue().add(
        `auto-approve-${deliverableId}`,
        { projectId, deliverableId, workspaceId, step: "auto_approve" } satisfies ReminderJobData,
        {
          delay,
          jobId: `auto-approve-${deliverableId}`,
          removeOnComplete: true,
        },
      );
    }

    return { action: `sent_${config.reminderStep}` };
  },

  /**
   * Auto-approve deliverable after silence following full reminder sequence.
   */
  async autoApproveAfterSilence(data: { projectId: string; deliverableId: string; workspaceId: string }): Promise<{ action: string }> {
    const { deliverableId, workspaceId } = data;
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable || deliverable.status !== "in_review") {
      return { action: "skipped_not_in_review" };
    }

    await db.transaction(async (trx) => {
      await deliverableRepository.update(
        workspaceId,
        deliverableId,
        { status: "approved" },
        trx as never,
      );

      await approvalEventRepository.create(
        {
          workspaceId,
          deliverableId,
          eventType: "silence_approved",
          actorId: null,
          actorName: "System",
          action: "auto_approved",
          comment: "Auto-approved due to client silence after reminder sequence",
        },
        trx as never,
      );

      await writeAuditLog(trx as never, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "deliverable",
        entityId: deliverableId,
        action: "approve",
        metadata: { reason: "silence_approval" },
      });
    });

    return { action: "auto_approved" };
  },
};

/**
 * Start the BullMQ worker for approval reminder jobs.
 */
export function startReminderWorker(): Worker {
  const worker = new Worker(
    "approval-reminders",
    async (job) => {
      const data = job.data as ReminderJobData;
      return reminderService.processReminderStep(data);
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[ReminderWorker] Job ${job.id} completed: ${JSON.stringify(job.returnvalue)}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
