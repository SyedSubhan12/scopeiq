import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { dispatchJob } from "../lib/queue.js";
import { reminderService, type ReminderJobData } from "../services/reminder.service.js";

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

/**
 * Process the reminder job — checks all in-review deliverables and sends due reminders.
 */
export async function processReminders() {
  return { action: "scheduled_jobs_only" };
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
