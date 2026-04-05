import { feedbackRepository } from "../repositories/feedback.repository.js";
import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { NotFoundError } from "@novabots/types";
import { dispatchSummarizeFeedbackJob } from "../jobs/summarize-feedback.job.js";
import { dispatchScopeCheckJob } from "../jobs/scope-check.job.js";

export const feedbackService = {
  async listByDeliverable(deliverableId: string) {
    return feedbackRepository.listByDeliverable(deliverableId);
  },

  async submit(data: {
    deliverableId: string;
    body: string;
    authorId?: string | undefined;
    authorName?: string | undefined;
    source?: "portal" | "email_forward" | "manual_input" | undefined;
    annotationJson?: {
      x_pos: number;
      y_pos: number;
      page_number?: number | undefined;
      pin_number: number;
    } | undefined;
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

    // AI Scope Guard Audit: New for Phase 3
    // We need the projectId to check against SOW clauses
    const deliverable = await deliverableRepository.getById("", data.deliverableId); // WorkspaceId not needed here for internal lookup
    if (deliverable && deliverable.projectId) {
      await dispatchScopeCheckJob(deliverable.projectId, data.body, data.authorId);
    }

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
