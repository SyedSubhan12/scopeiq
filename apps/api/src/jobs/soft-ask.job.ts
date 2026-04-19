import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "soft-ask";
const JOB_NAME = "generate-soft-ask";

export interface SoftAskJobPayload {
    scope_flag_id: string;
    workspace_id: string;
    flag_title: string;
    flag_description: string | null;
    sow_summary: string;
}

/**
 * Dispatches a soft-ask sentence generation job.
 * The worker calls Claude to generate one warm, professional sentence acknowledging
 * the out-of-scope request and sets expectation that it will be quoted separately.
 * Result is stored on the scope_flag record as `soft_ask_text`.
 */
export async function dispatchSoftAskJob(
    payload: SoftAskJobPayload,
): Promise<string> {
    return dispatchJob(
        QUEUE_NAME,
        JOB_NAME,
        payload as unknown as Record<string, unknown>,
    );
}
