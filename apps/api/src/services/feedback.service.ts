import { feedbackRepository } from "../repositories/feedback.repository.js";
import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { NotFoundError } from "@novabots/types";
import { dispatchSummarizeFeedbackJob } from "../jobs/summarize-feedback.job.js";

export const feedbackService = {
  async listByDeliverable(deliverableId: string) {
    return feedbackRepository.listByDeliverable(deliverableId);
  },

  async submit(data: {
    deliverableId: string;
    body: string;
    authorId?: string;
    authorName?: string;
    source?: "portal" | "email_forward" | "manual_input";
    annotationJson?: {
      x_pos: number;
      y_pos: number;
      page_number?: number;
      pin_number: number;
    };
  }) {
    const item = await feedbackRepository.create({
      deliverableId: data.deliverableId,
      body: data.body,
      authorId: data.authorId ?? null,
      authorName: data.authorName ?? null,
      source: data.source ?? "portal",
      annotationJson: data.annotationJson ?? null,
    });

    // Dispatch AI summarization job after new feedback
    await dispatchSummarizeFeedbackJob(data.deliverableId);

    return item;
  },

  async resolve(feedbackId: string, resolved: boolean) {
    const item = await feedbackRepository.setResolved(feedbackId, resolved);
    if (!item) {
      throw new NotFoundError("FeedbackItem", feedbackId);
    }
    return item;
  },

  async delete(feedbackId: string, workspaceId: string) {
    const item = await feedbackRepository.delete(feedbackId, workspaceId);
    if (!item) {
      throw new NotFoundError("FeedbackItem", feedbackId);
    }
    return item;
  },
};
