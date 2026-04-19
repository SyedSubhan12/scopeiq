import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "sow-generation";
const JOB_NAME = "generate-sow";

export interface GenerateSowJobPayload {
    workspace_id: string;
    actor_id: string;
    sow_id: string;
    service_type: string;
    deliverables: string;
    revision_rounds: number;
    timeline: string;
    payment_terms: string;
    project_id: string | null;
}

/**
 * Dispatches an AI SOW generation job.
 * The worker calls Claude to produce a structured SOW, then updates the SOW record
 * with parsed clauses and marks it ready.
 */
export async function dispatchGenerateSowJob(
    payload: GenerateSowJobPayload,
): Promise<string> {
    return dispatchJob(
        QUEUE_NAME,
        JOB_NAME,
        payload as unknown as Record<string, unknown>,
    );
}
