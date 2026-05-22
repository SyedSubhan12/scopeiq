import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { deliverableService } from "../services/deliverable.service.js";
import { feedbackService } from "../services/feedback.service.js";
import { deliverableRevisionRepository } from "../repositories/deliverable-revision.repository.js";
import { rateCardRepository } from "../repositories/rate-card.repository.js";
import {
  listDeliverablesQuerySchema,
  createDeliverableSchema,
  updateDeliverableSchema,
  uploadUrlSchema,
  confirmUploadSchema,
  deliverableResponseSchema,
  deliverableDeleteResponseSchema,
  approvalEventResponseSchema,
} from "./deliverable.schemas.js";

type CreateDeliverableInput = z.output<typeof createDeliverableSchema>;
type UploadUrlInput = z.output<typeof uploadUrlSchema>;
import { submitFeedbackSchema, feedbackResponseSchema } from "./feedback.schemas.js";

import { gateMiddleware } from "../middleware/gate.js";

export const deliverableRouter = new Hono();

deliverableRouter.use("*", authMiddleware);
deliverableRouter.use("*", gateMiddleware("approval_portal"));

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
  const revisions = await deliverableRevisionRepository.listByDeliverable(workspaceId, id);
  return c.json({ data: revisions });
});

deliverableRouter.post(
  "/",
  zValidator("json", createDeliverableSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateDeliverableInput;
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
    const body = c.req.valid("json") as UploadUrlInput;
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
  const workspaceId = c.get("workspaceId");
  const deliverableId = c.req.param("id");
  const body = await c.req.json();
  const item = await feedbackService.submit({
    workspaceId,
    deliverableId,
    body: body.body,
    annotationJson: body.annotationJson,
    authorId: userId,
    source: "manual_input",
  });
  return c.json({ data: item }, 201);
});

const approveBodySchema = z.object({
  comment: z.string().optional(),
});

const rejectBodySchema = z.object({
  comment: z.string().min(1),
});

deliverableRouter.patch(
  "/:id/approve",
  zValidator("json", approveBodySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { comment } = c.req.valid("json");
    const result = await deliverableService.approve(workspaceId, id, userId, null, comment);
    return c.json(approvalEventResponseSchema.parse({ data: result }));
  },
);

deliverableRouter.patch(
  "/:id/reject",
  zValidator("json", rejectBodySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { comment } = c.req.valid("json");
    const result = await deliverableService.requestRevision(workspaceId, id, userId, null, comment);
    return c.json(approvalEventResponseSchema.parse({ data: result }));
  },
);

// GET /:id/addon-quote — returns a price quote for an additional revision round (FR-AP-003)
deliverableRouter.get("/:id/addon-quote", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");

  const deliverable = await deliverableService.getById(workspaceId, id);

  // Fetch workspace rate card items to derive a daily rate
  const rateCardItems = await rateCardRepository.list(workspaceId);

  const DEFAULT_RESPONSE = {
    price: 500,
    label: "Additional Revision Round",
    description: "Unlock additional revision round(s) for this deliverable.",
  };

  if (rateCardItems.length === 0) {
    return c.json({ data: DEFAULT_RESPONSE });
  }

  // Use the highest daily_rate equivalent from rate card items (unit = "day")
  // Fall back to hourly items converted to a daily rate (8 hours)
  const dayItems = rateCardItems.filter((item) => item.unit === "day");
  const hourItems = rateCardItems.filter((item) => item.unit === "hour");

  let dailyRateCents: number | null = null;

  if (dayItems.length > 0) {
    // Take the first day-rate item
    dailyRateCents = dayItems[0]!.rateInCents;
  } else if (hourItems.length > 0) {
    // Convert hourly to daily (8 hours)
    dailyRateCents = hourItems[0]!.rateInCents * 8;
  }

  if (dailyRateCents === null) {
    return c.json({ data: DEFAULT_RESPONSE });
  }

  // Half-day estimate per extra revision round; round to nearest $50, minimum $250
  const rawDollars = (dailyRateCents / 100) * 0.5;
  const roundedToFifty = Math.round(rawDollars / 50) * 50;
  const price = Math.max(250, roundedToFifty);

  return c.json({
    data: {
      price,
      label: "Additional Revision Round",
      description: `Unlock additional revision round(s) for this deliverable. Estimated at half a day of work based on your rate card.`,
    },
  });
});
