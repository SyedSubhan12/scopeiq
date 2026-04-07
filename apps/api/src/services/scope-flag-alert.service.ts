import { Queue, Worker } from "bullmq";
import { db, scopeFlags, projects, clients, workspaces, eq, and, isNull } from "@novabots/db";
import { sendScopeFlagAlertEmail } from "../lib/resend.js";
import { getRedisConnection } from "../lib/redis.js";

const QUEUE_NAME = "scope-flag-alerts";

let scopeFlagAlertQueue: Queue | null = null;

export function getScopeFlagAlertQueue(): Queue {
  if (!scopeFlagAlertQueue) {
    scopeFlagAlertQueue = new Queue(QUEUE_NAME, { connection: getRedisConnection() });
  }
  return scopeFlagAlertQueue;
}

interface ScopeFlagAlertJobData {
  flag_id: string;
  workspace_id: string;
  project_id: string;
}

export const scopeFlagAlertService = {
  /**
   * Process a scope flag alert job — checks if flag is still pending and sends email.
   */
  async processAlert(data: ScopeFlagAlertJobData): Promise<{ action: string; flagId?: string }> {
    const { flag_id, workspace_id, project_id } = data;

    // Check if the flag still exists and is still pending
    const [flag] = await db
      .select()
      .from(scopeFlags)
      .where(and(eq(scopeFlags.id, flag_id), eq(scopeFlags.workspaceId, workspace_id)))
      .limit(1);

    if (!flag) {
      return { action: "skipped_flag_not_found" };
    }

    if (flag.status !== "pending") {
      return { action: `skipped_flag_status_changed_${flag.status}` };
    }

    // Get project and client info for email
    const [row] = await db
      .select({
        contactEmail: clients.contactEmail,
        contactName: clients.contactName,
        projectName: projects.name,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(and(eq(projects.id, project_id), isNull(projects.deletedAt)))
      .limit(1);

    const email = row?.contactEmail;
    if (!email) {
      return { action: "skipped_no_contact_email" };
    }

    try {
      await sendScopeFlagAlertEmail({
        to: email,
        recipientName: row.contactName ?? "there",
        flagTitle: flag.title,
        flagSeverity: flag.severity as "low" | "medium" | "high",
        flagConfidence: flag.confidence,
        flagDescription: flag.description,
        projectName: row.projectName ?? "your project",
        flagId: flag.id,
      });
    } catch (error) {
      return { action: `email_failed: ${error instanceof Error ? error.message : String(error)}` };
    }

    return { action: "sent", flagId: flag_id };
  },
};

/**
 * Start the BullMQ worker for scope flag alert jobs.
 */
export function startScopeFlagAlertWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const data = job.data as ScopeFlagAlertJobData;
      return scopeFlagAlertService.processAlert(data);
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[ScopeFlagAlertWorker] Job ${job.id} completed: ${JSON.stringify(job.returnvalue)}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[ScopeFlagAlertWorker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
