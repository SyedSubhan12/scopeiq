import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../lib/redis.js";
import { scopeFlagRepository } from "../repositories/scope-flag.repository.js";
import { scopeFlagService } from "../services/scope-flag.service.js";

const QUEUE_NAME = "scope-flag-sla";
const JOB_NAME = "sla-sweep";
/** Stable job id prevents duplicate repeating jobs across restarts */
const REPEAT_JOB_ID = "scope-flag-sla-sweep-15min";

let slaQueue: Queue | null = null;

function getSlaQueue(): Queue {
    if (!slaQueue) {
        slaQueue = new Queue(QUEUE_NAME, { connection: getRedisConnection() });
    }
    return slaQueue;
}

/**
 * Register the repeating cron job on the SLA queue.
 * Safe to call on every boot — BullMQ deduplicates by jobId.
 */
export async function scheduleSlaBreachSweep(): Promise<void> {
    const queue = getSlaQueue();
    await queue.add(
        JOB_NAME,
        { triggered_at: "scheduled" },
        {
            repeat: { pattern: "*/15 * * * *" }, // every 15 minutes
            jobId: REPEAT_JOB_ID,
            removeOnComplete: 20,
            removeOnFail: 50,
        },
    );
}

/**
 * Core sweep logic: find all open flags past their SLA deadline and mark them breached.
 * Returns a summary for logging.
 */
export async function processSlaBreachSweep(): Promise<{ breached: number; skipped: number }> {
    const now = new Date();
    const flags = await scopeFlagRepository.listBreachable(now);

    let breached = 0;
    let skipped = 0;

    for (const flag of flags) {
        try {
            await scopeFlagService.markBreached(flag.id, flag.workspaceId);
            breached++;
        } catch (err) {
            console.error(
                `[SlaBreachSweep] Failed to mark flag ${flag.id} as breached:`,
                err instanceof Error ? err.message : String(err),
            );
            skipped++;
        }
    }

    return { breached, skipped };
}

/**
 * Start the BullMQ worker that processes SLA sweep jobs.
 * Call once at server startup.
 */
export function startSlaBreachWorker(): Worker {
    const worker = new Worker(
        QUEUE_NAME,
        async (_job) => {
            const result = await processSlaBreachSweep();
            console.log(`[SlaBreachSweep] Done — breached: ${result.breached}, skipped: ${result.skipped}`);
            return result;
        },
        {
            connection: getRedisConnection(),
            concurrency: 1,
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 200 },
        },
    );

    worker.on("completed", (job) => {
        console.log(`[SlaBreachWorker] Job ${job.id} completed: ${JSON.stringify(job.returnvalue)}`);
    });
    worker.on("failed", (job, err) => {
        console.error(`[SlaBreachWorker] Job ${job?.id} failed: ${err.message}`);
    });

    return worker;
}
