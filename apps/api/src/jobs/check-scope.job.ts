import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "scope-check";
const JOB_NAME = "scope-check";

/**
 * Dispatches a scope check job to the AI worker when a message is ingested.
 * The AI worker will compare the message against the project's SOW clauses.
 */
export async function dispatchCheckScopeJob(
  messageId: string,
  projectId: string,
  workspaceId: string,
): Promise<string> {
  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    message_id: messageId,
    project_id: projectId,
    workspace_id: workspaceId,
  });
}
