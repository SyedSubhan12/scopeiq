import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "parse-sow";
const JOB_NAME = "parse-sow";

/**
 * Dispatches a SOW parsing job to the AI service.
 * The AI worker will call Claude to extract structured clauses and write them to sow_clauses.
 */
export async function dispatchParseSowJob(
    sowId: string,
    projectId: string,
    rawText: string,
): Promise<string> {
    return dispatchJob(QUEUE_NAME, JOB_NAME, {
        sow_id: sowId,
        project_id: projectId,
        raw_text: rawText,
    });
}
