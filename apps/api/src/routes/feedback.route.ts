import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { feedbackService } from "../services/feedback.service.js";
import {
  submitFeedbackSchema,
  listFeedbackQuerySchema,
  resolveFeedbackSchema,
} from "./feedback.schemas.js";

export const feedbackRouter = new Hono();

feedbackRouter.use("*", authMiddleware);

feedbackRouter.get(
  "/",
  zValidator("query", listFeedbackQuerySchema),
  async (c) => {
    const { deliverableId } = c.req.valid("query");
    const items = await feedbackService.listByDeliverable(deliverableId);
    return c.json({ data: items });
  },
);

feedbackRouter.post(
  "/",
  zValidator("json", submitFeedbackSchema),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const item = await feedbackService.submit({
      deliverableId: body.deliverableId,
      body: body.body,
      annotationJson: body.annotationJson ?? undefined,
      authorId: userId,
      source: "manual_input",
    });
    return c.json({ data: item }, 201);
  },
);

feedbackRouter.patch(
  "/:id/resolve",
  zValidator("json", resolveFeedbackSchema),
  async (c) => {
    const id = c.req.param("id");
    const { resolved } = c.req.valid("json");
    const item = await feedbackService.resolve(id, resolved);
    return c.json({ data: item });
  },
);

feedbackRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  await feedbackService.delete(id, workspaceId);
  return c.json({ message: "Feedback deleted" });
});
