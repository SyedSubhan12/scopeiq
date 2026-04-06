import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "change-order-generation";
const JOB_NAME = "generate-change-order";

/**
 * Dispatches a change order generation job to the AI worker.
 * The AI worker will generate a change order from a confirmed scope flag.
 */
export async function dispatchGenerateChangeOrderJob(
  scopeFlagId: string,
  workspaceId: string,
): Promise<string> {
  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    scope_flag_id: scopeFlagId,
    workspace_id: workspaceId,
  });
}
