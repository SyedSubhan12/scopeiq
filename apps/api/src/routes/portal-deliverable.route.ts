import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { deliverableService } from "../services/deliverable.service.js";
import { feedbackService } from "../services/feedback.service.js";
import { submitFeedbackSchema } from "./feedback.schemas.js";
import { z } from "zod";

const portalApproveSchema = z.object({
  comment: z.string().max(2000).optional(),
});

const portalRevisionSchema = z.object({
  comment: z.string().min(1).max(2000),
});

export const portalDeliverableRouter = new Hono();

portalDeliverableRouter.use("*", portalAuthMiddleware);

portalDeliverableRouter.get("/", async (c) => {
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

portalDeliverableRouter.post(
  "/:id/feedback",
  zValidator("json", submitFeedbackSchema.omit({ deliverableId: true })),
  async (c) => {
    const deliverableId = c.req.param("id");
    const body = c.req.valid("json");
    const item = await feedbackService.submit({
      deliverableId,
      body: body.body,
      authorName: "Client",
      source: "portal",
      annotationJson: body.annotationJson,
    });
    return c.json({ data: item }, 201);
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
    return c.json({ data: event });
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
    return c.json({ data: event });
  },
);
