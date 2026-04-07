import { feedbackRepository } from "../repositories/feedback.repository.js";
import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog } from "@novabots/db";
import { dispatchSummarizeFeedbackJob } from "../jobs/summarize-feedback.job.js";
import { dispatchScopeCheckJob } from "../jobs/scope-check.job.js";

export const feedbackService = {
  async listByDeliverable(workspaceId: string, deliverableId: string) {
    return feedbackRepository.listByDeliverable(workspaceId, deliverableId);
  },

  async submit(data: {
    workspaceId: string;
    deliverableId: string;
    body: string;
    authorId?: string | undefined;
    authorName?: string | undefined;
    source?: "portal" | "email_forward" | "manual_input" | undefined;
    annotationJson?: {
      xPos: number;
      yPos: number;
      pageNumber?: number | null | undefined;
      pinNumber: number;
    } | undefined;
    pageNumber?: number | null | undefined;
  }) {
    // Verify deliverable belongs to workspace before creating feedback
    const deliverable = await deliverableRepository.getById(data.workspaceId, data.deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", data.deliverableId);
    }

    const item = await db.transaction(async (trx) => {
      const created = await feedbackRepository.create(data.workspaceId, {
        deliverableId: data.deliverableId,
        body: data.body,
        authorId: data.authorId ?? null,
        authorName: data.authorName ?? null,
        source: data.source ?? "portal",
        annotationJson: data.annotationJson ?? null,
        pageNumber: data.pageNumber ?? null,
      }, trx);

      if (!created) {
        throw new NotFoundError("Deliverable", data.deliverableId);
      }

      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: data.authorId ?? null,
        entityType: "feedback",
        entityId: created.id,
        action: "create",
        metadata: { deliverableId: data.deliverableId, source: data.source ?? "portal" },
      });

      return created;
    });

    // Dispatch jobs outside the transaction
    await dispatchSummarizeFeedbackJob(data.deliverableId);

    if (deliverable.projectId) {
      await dispatchScopeCheckJob(deliverable.projectId, data.body, data.authorId);
    }

    return item;
  },

  async resolve(workspaceId: string, feedbackId: string, actorId: string | null, resolved: boolean) {
    const existing = await feedbackRepository.getById(workspaceId, feedbackId);
    if (!existing) {
      throw new NotFoundError("FeedbackItem", feedbackId);
    }

    return db.transaction(async (trx) => {
      const item = await feedbackRepository.setResolved(workspaceId, feedbackId, resolved, trx as never);
      if (!item) {
        throw new NotFoundError("FeedbackItem", feedbackId);
      }

      await writeAuditLog(trx as never, {
        workspaceId,
        actorId,
        entityType: "feedback",
        entityId: feedbackId,
        action: "update",
        metadata: {
          deliverableId: existing.deliverableId,
          resolved,
        },
      });

      return item;
    });
  },

  async delete(feedbackId: string, workspaceId: string, actorId: string | null) {
    const existing = await feedbackRepository.getById(workspaceId, feedbackId);
    if (!existing) {
      throw new NotFoundError("FeedbackItem", feedbackId);
    }

    return db.transaction(async (trx) => {
      const item = await feedbackRepository.delete(feedbackId, workspaceId, trx as never);
      if (!item) {
        throw new NotFoundError("FeedbackItem", feedbackId);
      }

      await writeAuditLog(trx as never, {
        workspaceId,
        actorId,
        entityType: "feedback",
        entityId: feedbackId,
        action: "delete",
        metadata: {
          deliverableId: existing.deliverableId,
        },
      });

      return item;
    });
  },
};
