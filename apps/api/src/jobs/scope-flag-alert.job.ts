import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "scope-flag-alerts";
const JOB_NAME = "scope-flag-alert";

/**
 * Dispatches a delayed scope flag alert email job.
 * Default delay is 2 hours from dispatch.
 */
export async function dispatchScopeFlagAlertJob(
  flagId: string,
  workspaceId: string,
  projectId: string,
  options?: { delay?: number },
): Promise<string> {
  const delay = options?.delay ?? 2 * 60 * 60 * 1000; // 2 hours default

  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    flag_id: flagId,
    workspace_id: workspaceId,
    project_id: projectId,
  }, { delay });
}
