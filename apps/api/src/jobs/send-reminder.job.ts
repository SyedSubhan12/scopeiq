import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { dispatchJob } from "../lib/queue.js";
import { reminderService, getReminderQueue, type ReminderJobData } from "../services/reminder.service.js";
import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { reminderLogRepository } from "../repositories/reminder-log.repository.js";
import { approvalEventRepository } from "../repositories/approval-event.repository.js";

const QUEUE_NAME = "reminders";
const JOB_NAME = "send-reminder";

/**
 * Dispatch a one-off reminder check job.
 */
export async function dispatchSendReminderJob(): Promise<string> {
  return dispatchJob(QUEUE_NAME, JOB_NAME, { triggered_at: new Date().toISOString() });
}

/**
 * Register a BullMQ repeatable job that runs the reminder check every hour.
 * Safe to call multiple times — BullMQ deduplicates by (name + repeat key).
 * Call this once on server startup.
 */
export async function scheduleHourlyReminders(): Promise<void> {
  const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue(QUEUE_NAME, { connection });

  await queue.add(
    JOB_NAME,
    { triggered_at: "scheduled" },
    {
      repeat: { pattern: "0 * * * *" }, // every hour at :00
      jobId: "hourly-reminder-check",    // stable id prevents duplicates
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  );

  await queue.close();
  connection.disconnect();
}

/** Step labels in sequence order — index 0 = first reminder step */
const REMINDER_STEP_ORDER = ["gentle_nudge", "deadline_warning", "silence_approval"] as const;
type ReminderStepLabel = (typeof REMINDER_STEP_ORDER)[number];

/**
 * Process the reminder job — hourly sweep that checks all in-review deliverables.
 *
 * For each deliverable that has not yet received a client response, determine which
 * reminder step is next and enqueue it on the reminders queue if it has not already
 * been dispatched. This is a safety-net alongside the per-step delayed BullMQ jobs
 * scheduled by scheduleReminderSequence: if a delayed job was lost (Redis restart,
 * deploy, etc.) this sweep will recover it within one hour.
 */
export async function processReminders(): Promise<{ action: string; processed: number; skipped: number }> {
  const inReviewSince = new Date(Date.now() - 48 * 60 * 60 * 1000); // older than 48 h
  const deliverables = await deliverableRepository.findInReviewSince(inReviewSince);

  let processed = 0;
  let skipped = 0;

  for (const deliverable of deliverables) {
    // Skip if the client has already responded
    const events = await approvalEventRepository.listByDeliverable(
      deliverable.workspaceId,
      deliverable.id,
    );
    if (events.length > 0) {
      skipped++;
      continue;
    }

    // Determine which steps have already been sent
    const logs = await reminderLogRepository.listByDeliverable(
      deliverable.workspaceId,
      deliverable.id,
    );
    const sentSteps = new Set(logs.map((l) => l.step as ReminderStepLabel));

    // Find the next unsent step
    const nextStepIndex = REMINDER_STEP_ORDER.findIndex((s) => !sentSteps.has(s));
    if (nextStepIndex === -1) {
      // All 3 reminder steps have been sent — auto-approve job should have been scheduled
      // by the per-step worker; nothing more to do in the sweep.
      skipped++;
      continue;
    }

    const stepNumber = nextStepIndex + 1; // 1-indexed
    const jobId = `reminder-${deliverable.id}-${stepNumber}`;

    // Check if a BullMQ delayed job is already waiting for this step to avoid double-dispatch
    const queue = getReminderQueue();
    const existingJob = await queue.getJob(jobId);
    if (existingJob) {
      skipped++;
      continue;
    }

    // Enqueue the step for immediate processing — the worker will handle sending the email
    // and scheduling the next delayed step.
    await reminderService.processReminderStep({
      projectId: deliverable.projectId,
      deliverableId: deliverable.id,
      workspaceId: deliverable.workspaceId,
      step: stepNumber as 1 | 2 | 3,
    });

    processed++;
  }

  return { action: "sweep_complete", processed, skipped };
}

/**
 * Start the BullMQ worker that processes reminder jobs.
 * Call once at server startup so queued jobs are actually consumed.
 */
export async function startReminderWorker(): Promise<Worker> {
  const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (!job || !job.data) throw new Error("Invalid job: no data provided");
      await reminderService.processReminderStep(job.data as ReminderJobData);
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("completed", (job) => {
    console.log(`[ReminderWorker] Job ${job.id} completed`);
  });

  return worker;
}
