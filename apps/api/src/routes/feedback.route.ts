import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { randomUUID } from "node:crypto";
import { db, writeAuditLog } from "@novabots/db";
import { authMiddleware } from "../middleware/auth.js";
import { feedbackService } from "../services/feedback.service.js";
import {
  submitFeedbackSchema,
  listFeedbackQuerySchema,
  resolveFeedbackSchema,
  feedbackResponseSchema,
  feedbackDeleteResponseSchema,
  submitNpsSchema,
  npsResponseSchema,
} from "./feedback.schemas.js";

export const feedbackRouter = new Hono();

feedbackRouter.use("*", authMiddleware);

feedbackRouter.get(
  "/",
  zValidator("query", listFeedbackQuerySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const { deliverableId } = c.req.valid("query");
    const items = await feedbackService.listByDeliverable(workspaceId, deliverableId);
    return c.json({ data: items });
  },
);

feedbackRouter.post(
  "/",
  zValidator("json", submitFeedbackSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const item = await feedbackService.submit({
      workspaceId,
      deliverableId: body.deliverableId,
      body: body.body,
      annotationJson: body.annotationJson ?? undefined,
      authorId: userId,
      source: "manual_input",
    });
    return c.json(feedbackResponseSchema.parse({ data: item }), 201);
  },
);

feedbackRouter.patch(
  "/:id/resolve",
  zValidator("json", resolveFeedbackSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { resolved } = c.req.valid("json");
    const item = await feedbackService.resolve(workspaceId, id, userId, resolved);
    return c.json(feedbackResponseSchema.parse({ data: item }));
  },
);

feedbackRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  await feedbackService.delete(id, workspaceId, userId);
  return c.json(feedbackDeleteResponseSchema.parse({ message: "Feedback deleted" }));
});

/**
 * POST /v1/feedback/nps — Sprint 6 NPS prompt
 * Stores the rating in the audit log (no new table needed) with
 * entityType='nps_feedback' so we can slice it later for NPS >40 target.
 */
feedbackRouter.post(
  "/nps",
  zValidator("json", submitNpsSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const { score, comment, surface } = c.req.valid("json");

    const category =
      score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor";

    await writeAuditLog(db, {
      workspaceId,
      actorId: userId ?? null,
      entityType: "nps_feedback",
      entityId: randomUUID(),
      action: "create",
      metadata: {
        score,
        category,
        comment: comment ?? null,
        surface: surface ?? null,
      },
    });

    return c.json(npsResponseSchema.parse({ ok: true, category }));
  },
);
