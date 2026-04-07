import { dispatchJob } from "../lib/queue.js";
import { db, feedbackItems, eq } from "@novabots/db";

const QUEUE_NAME = "feedback-summarization";
const JOB_NAME = "summarize-feedback";

export async function dispatchSummarizeFeedbackJob(deliverableId: string): Promise<string> {
  // Pre-fetch feedback items so the worker doesn't need DB access
  const feedbackItemsList = await db
    .select({
      id: feedbackItems.id,
      body: feedbackItems.body,
      annotationJson: feedbackItems.annotationJson,
      source: feedbackItems.source,
      authorName: feedbackItems.authorName,
      createdAt: feedbackItems.createdAt,
    })
    .from(feedbackItems)
    .where(eq(feedbackItems.deliverableId, deliverableId))
    .orderBy(feedbackItems.createdAt);

  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    deliverable_id: deliverableId,
    feedback_items: feedbackItemsList.map((item) => ({
      id: item.id,
      body: item.body,
      annotation_json: item.annotationJson,
      source: item.source,
      author_name: item.authorName,
      created_at: item.createdAt,
    })),
  });
}
