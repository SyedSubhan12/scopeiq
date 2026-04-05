import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "scope-check";
const JOB_NAME = "scope-check";

/**
 * Dispatches a scope check job to the AI service.
 * @param projectId The project ID to check against.
 * @param text The text input (e.g. client comment, brief update).
 * @param authorId The user or client ID who sent the text.
 */
export async function dispatchScopeCheckJob(
    projectId: string,
    text: string,
    authorId?: string | null
): Promise<string> {
    return dispatchJob(QUEUE_NAME, JOB_NAME, {
        project_id: projectId,
        text,
        author_id: authorId ?? null
    });
}
