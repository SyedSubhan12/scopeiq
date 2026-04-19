import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "parse-sow";
const JOB_NAME = "parse-sow";

interface DispatchParseSowOptions {
  /** Pre-extracted plain text. When provided the worker uses it directly. */
  rawText?: string;
  /**
   * Object key in the storage bucket. When rawText is absent the worker
   * fetches the PDF bytes from storage and extracts text with PyMuPDF.
   */
  objectKey?: string;
  /**
   * Short-lived signed download URL. Passed alongside objectKey so the
   * worker can fetch the PDF without needing its own storage credentials.
   */
  storageUrl?: string;
}

/**
 * Dispatches a SOW parsing job to the AI service.
 *
 * For text-based SOWs supply rawText. For PDF uploads supply objectKey (and
 * optionally storageUrl). The worker extracts text with PyMuPDF when rawText
 * is absent and a storage reference is present.
 */
export async function dispatchParseSowJob(
    sowId: string,
    projectId: string,
    options: DispatchParseSowOptions,
): Promise<string> {
    return dispatchJob(QUEUE_NAME, JOB_NAME, {
        sow_id: sowId,
        project_id: projectId,
        raw_text: options.rawText ?? "",
        object_key: options.objectKey ?? null,
        storage_url: options.storageUrl ?? null,
    });
}
