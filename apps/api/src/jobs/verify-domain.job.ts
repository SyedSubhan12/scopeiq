import { Worker } from "bullmq";
import { dispatchJob } from "../lib/queue.js";
import { getRedisConnection } from "../lib/redis.js";
import { domainService } from "../services/domain.service.js";

const QUEUE_NAME = "domain-verification";
const JOB_NAME = "verify-domain";

// Exponential back-off sequence (seconds): 60 → 120 → 240 → 480, capped at 900
const BACKOFF_SECONDS = [60, 120, 240, 480, 900];
const MAX_TOTAL_SECONDS = 24 * 60 * 60; // 24 h window

interface VerifyDomainJobData {
  workspaceId: string;
  attemptNumber: number; // 1-based
  startedAt: string;     // ISO — used to enforce 24 h window
}

/**
 * Dispatch a one-shot domain verification job.
 * @param workspaceId  The workspace whose domain should be verified.
 * @param delaySeconds How long BullMQ should wait before running the job.
 * @param attemptNumber Which attempt this is (1-based, defaults to 1).
 * @param startedAt    ISO string of when the first attempt was dispatched.
 */
export async function dispatchVerifyDomainJob(
  workspaceId: string,
  delaySeconds: number = 60,
  attemptNumber: number = 1,
  startedAt: string = new Date().toISOString(),
): Promise<string> {
  return dispatchJob(
    QUEUE_NAME,
    JOB_NAME,
    { workspaceId, attemptNumber, startedAt } satisfies VerifyDomainJobData,
    { delay: delaySeconds * 1000 },
  );
}

let workerInstance: Worker<VerifyDomainJobData> | null = null;

/**
 * Start the BullMQ worker that processes domain verification jobs.
 * Safe to call multiple times — returns the existing instance on subsequent calls.
 *
 * Scheduling logic:
 *  - On "verified" or "failed" (after max attempts): stop rescheduling.
 *  - On "failed" (DNS miss within window): reschedule with exponential back-off.
 *  - Window: give up after MAX_TOTAL_SECONDS (24 h) have elapsed since startedAt.
 */
export function startDomainVerificationWorker(): Worker<VerifyDomainJobData> {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<VerifyDomainJobData>(
    QUEUE_NAME,
    async (job) => {
      const { workspaceId, attemptNumber, startedAt } = job.data;

      console.log(
        `[DomainVerification] Attempt #${attemptNumber} for workspace ${workspaceId} (job ${job.id})`,
      );

      // Enforce 24 h total window
      const elapsedSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000;
      if (elapsedSeconds > MAX_TOTAL_SECONDS) {
        console.warn(
          `[DomainVerification] 24 h window expired for workspace ${workspaceId} — giving up`,
        );
        return { status: "window_expired" };
      }

      // Enforce max attempt count
      if (attemptNumber > domainService.maxVerificationAttempts) {
        console.warn(
          `[DomainVerification] Max attempts (${domainService.maxVerificationAttempts}) reached for workspace ${workspaceId}`,
        );
        return { status: "max_attempts_reached" };
      }

      const { status } = await domainService.verifyDomain(workspaceId, null);

      if (status === "verified") {
        console.log(
          `[DomainVerification] Domain verified for workspace ${workspaceId} on attempt #${attemptNumber}`,
        );
        return { status: "verified" };
      }

      // DNS miss — reschedule with exponential back-off
      const nextAttempt = attemptNumber + 1;
      const backoffIndex = Math.min(attemptNumber - 1, BACKOFF_SECONDS.length - 1);
      const nextDelaySeconds = BACKOFF_SECONDS[backoffIndex] ?? 900;

      const nextElapsed = elapsedSeconds + nextDelaySeconds;
      if (nextElapsed > MAX_TOTAL_SECONDS) {
        console.warn(
          `[DomainVerification] Next attempt would exceed 24 h window for workspace ${workspaceId} — stopping`,
        );
        return { status: "window_would_exceed" };
      }

      await dispatchVerifyDomainJob(workspaceId, nextDelaySeconds, nextAttempt, startedAt);

      console.log(
        `[DomainVerification] Rescheduled attempt #${nextAttempt} for workspace ${workspaceId} in ${nextDelaySeconds}s`,
      );

      return { status: "rescheduled", nextAttempt, nextDelaySeconds };
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  );

  workerInstance.on("completed", (job) => {
    console.log(`[DomainVerification] Job ${job.id} completed`);
  });

  workerInstance.on("failed", (job, err) => {
    console.error(
      `[DomainVerification] Job ${job?.id ?? "unknown"} failed:`,
      err.message,
    );
  });

  workerInstance.on("error", (err) => {
    console.error("[DomainVerification] Worker error:", err.message);
  });

  console.log("[DomainVerification] Worker started");
  return workerInstance;
}
