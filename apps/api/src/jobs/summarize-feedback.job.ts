import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "feedback-summarization";
const JOB_NAME = "summarize-feedback";

export async function dispatchSummarizeFeedbackJob(
  deliverableId: string,
): Promise<string> {
  return dispatchJob(QUEUE_NAME, JOB_NAME, { deliverable_id: deliverableId });
}
