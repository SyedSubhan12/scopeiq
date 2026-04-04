import { dispatchJob } from "../lib/queue.js";

const QUEUE_NAME = "brief-scoring";
const JOB_NAME = "score-brief";

export async function dispatchScoreBriefJob(briefId: string): Promise<string> {
  return dispatchJob(QUEUE_NAME, JOB_NAME, { brief_id: briefId });
}
