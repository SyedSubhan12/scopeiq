import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { rateCardService } from "../services/rate-card.service.js";
import { createRateCardItemSchema, updateRateCardItemSchema } from "./rate-card.schemas.js";

export const rateCardRouter = new Hono();

rateCardRouter.use("*", authMiddleware);

rateCardRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const items = await rateCardService.listRateCard(workspaceId);
  return c.json({ data: items });
});

rateCardRouter.post("/", zValidator("json", createRateCardItemSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const item = await rateCardService.createRateCardItem(workspaceId, userId, body);
  return c.json({ data: item }, 201);
});

rateCardRouter.patch("/:id", zValidator("json", updateRateCardItemSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const itemId = c.req.param("id");
  const body = c.req.valid("json");
  const item = await rateCardService.updateRateCardItem(workspaceId, itemId, userId, body);
  return c.json({ data: item });
});

rateCardRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const itemId = c.req.param("id");
  await rateCardService.deleteRateCardItem(workspaceId, itemId, userId);
  return c.json({ data: { success: true } });
});
