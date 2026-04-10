import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { deliverableService } from "../services/deliverable.service.js";
import { feedbackService } from "../services/feedback.service.js";
import { deliverableRevisionRepository } from "../repositories/deliverable-revision.repository.js";
import {
  listDeliverablesQuerySchema,
  createDeliverableSchema,
  updateDeliverableSchema,
  uploadUrlSchema,
  confirmUploadSchema,
  deliverableResponseSchema,
  deliverableDeleteResponseSchema,
} from "./deliverable.schemas.js";
import { submitFeedbackSchema, feedbackResponseSchema } from "./feedback.schemas.js";

export const deliverableRouter = new Hono();

deliverableRouter.use("*", authMiddleware);

deliverableRouter.get(
  "/",
  zValidator("query", listDeliverablesQuerySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const query = c.req.valid("query");
    const result = await deliverableService.list(workspaceId, query);
    return c.json({ data: result.data, pagination: result.pagination });
  },
);

deliverableRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  const deliverable = await deliverableService.getById(workspaceId, id);
  return c.json({ data: deliverable });
});

deliverableRouter.get("/:id/revisions", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  const revisions = await deliverableRevisionRepository.listByDeliverable(id);
  return c.json({ data: revisions });
});

deliverableRouter.post(
  "/",
  zValidator("json", createDeliverableSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const deliverable = await deliverableService.create(workspaceId, userId, body);
    return c.json(deliverableResponseSchema.parse({ data: deliverable }), 201);
  },
);

deliverableRouter.patch(
  "/:id",
  zValidator("json", updateDeliverableSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const deliverable = await deliverableService.update(workspaceId, id, userId, body);
    return c.json(deliverableResponseSchema.parse({ data: deliverable }));
  },
);

deliverableRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  await deliverableService.delete(workspaceId, id, userId);
  return c.json(deliverableDeleteResponseSchema.parse({ message: "Deliverable deleted" }));
});

deliverableRouter.post(
  "/:id/upload-url",
  zValidator("json", uploadUrlSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const result = await deliverableService.getUploadUrl(workspaceId, id, body);
    return c.json({ data: result });
  },
);

// Generates a fresh signed download URL from the stored fileKey (signed URLs expire in 1h)
deliverableRouter.get("/:id/download-url", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  const url = await deliverableService.getFreshDownloadUrl(workspaceId, id);
  return c.json({ data: { url } });
});

deliverableRouter.post(
  "/:id/confirm-upload",
  zValidator("json", confirmUploadSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const deliverable = await deliverableService.confirmUpload(
      workspaceId,
      id,
      userId,
      {
        objectKey: body.objectKey,
        ...(body.originalName !== undefined && { originalName: body.originalName }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    );
    return c.json(deliverableResponseSchema.parse({ data: deliverable }));
  },
);

deliverableRouter.get("/:id/feedback", async (c) => {
  const workspaceId = c.get("workspaceId");
  const deliverableId = c.req.param("id");
  const items = await feedbackService.listByDeliverable(workspaceId, deliverableId);
  return c.json({ data: items });
});

deliverableRouter.post("/:id/feedback", async (c) => {
  const userId = c.get("userId");
  const deliverableId = c.req.param("id");
  const body = await c.req.json();
  const item = await feedbackService.submit({
    deliverableId,
    body: body.body,
    annotationJson: body.annotationJson,
    authorId: userId,
    source: "manual_input",
  });
  return c.json({ data: item }, 201);
});

deliverableRouter.patch("/:id/approve", authMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const result = await deliverableService.approve(workspaceId, id, userId, "agency");
  return c.json({ data: result });
});

deliverableRouter.patch(
  "/:id/reject",
  authMiddleware,
  zValidator("json", z.object({ feedback: z.string().optional() })),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { feedback } = c.req.valid("json");
    const result = await deliverableService.requestRevision(workspaceId, id, userId, "agency", feedback ?? undefined);
    return c.json({ data: result });
  },
);
