import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { deliverableService } from "../services/deliverable.service.js";
import { deliverableRevisionRepository } from "../repositories/deliverable-revision.repository.js";
import { feedbackService } from "../services/feedback.service.js";
import {
  submitFeedbackSchema,
  resolveFeedbackSchema,
  feedbackResponseSchema,
} from "./feedback.schemas.js";
import { z } from "zod";
import { approvalEventResponseSchema } from "./deliverable.schemas.js";

const portalApproveSchema = z.object({
  comment: z.string().max(2000).optional(),
});

const portalRevisionSchema = z.object({
  comment: z.string().min(1).max(2000),
});

export const portalDeliverableRouter = new Hono();

portalDeliverableRouter.use("*", portalAuthMiddleware);

portalDeliverableRouter.get("", async (c) => {
  const workspaceId = c.get("portalWorkspaceId");
  const projectId = c.get("portalProjectId");
  const result = await deliverableService.list(workspaceId, { projectId });
  return c.json({ data: result.data, pagination: result.pagination });
});

portalDeliverableRouter.get("/:id", async (c) => {
  const workspaceId = c.get("portalWorkspaceId");
  const id = c.req.param("id");
  const deliverable = await deliverableService.getById(workspaceId, id);
  return c.json({ data: deliverable });
});

portalDeliverableRouter.get("/:id/revisions", async (c) => {
  const id = c.req.param("id");
  const revisions = await deliverableRevisionRepository.listByDeliverable(id);
  return c.json({ data: revisions });
});

portalDeliverableRouter.post(
  "/:id/feedback",
  zValidator("json", submitFeedbackSchema.omit({ deliverableId: true })),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const deliverableId = c.req.param("id");
    const body = c.req.valid("json");
    const item = await feedbackService.submit({
      workspaceId,
      deliverableId,
      body: body.body,
      authorName: "Client",
      source: "portal",
      annotationJson: body.annotationJson,
      pageNumber: body.pageNumber,
    });
    return c.json(feedbackResponseSchema.parse({ data: item }), 201);
  },
);

portalDeliverableRouter.patch(
  "/:deliverableId/feedback/:feedbackId/resolve",
  zValidator("json", resolveFeedbackSchema),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const feedbackId = c.req.param("feedbackId");
    const { resolved } = c.req.valid("json");
    const item = await feedbackService.resolve(workspaceId, feedbackId, null, resolved);
    return c.json(feedbackResponseSchema.parse({ data: item }));
  },
);

portalDeliverableRouter.post(
  "/:id/approve",
  zValidator("json", portalApproveSchema),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const deliverableId = c.req.param("id");
    const { comment } = c.req.valid("json");
    const event = await deliverableService.approve(
      workspaceId,
      deliverableId,
      null,
      "Client",
      comment,
    );
    return c.json(approvalEventResponseSchema.parse({ data: event }));
  },
);

portalDeliverableRouter.post(
  "/:id/request-revision",
  zValidator("json", portalRevisionSchema),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const deliverableId = c.req.param("id");
    const { comment } = c.req.valid("json");
    const event = await deliverableService.requestRevision(
      workspaceId,
      deliverableId,
      null,
      "Client",
      comment,
    );
    return c.json(approvalEventResponseSchema.parse({ data: event }));
  },
);
