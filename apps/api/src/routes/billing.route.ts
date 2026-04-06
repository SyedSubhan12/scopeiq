import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { billingService } from "../services/billing.service.js";
import { createCheckoutSchema, createPortalSchema } from "./billing.schemas.js";

export const billingRouter = new Hono();

billingRouter.use("*", authMiddleware);

/**
 * POST /v1/billing/checkout
 * Create a Stripe Checkout session for a new subscription.
 */
billingRouter.post("/checkout", zValidator("json", createCheckoutSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");

  const result = await billingService.createCheckoutSession(workspaceId, userId, body);
  return c.json({ data: result });
});

/**
 * POST /v1/billing/portal
 * Create a Stripe Billing Portal session for managing an existing subscription.
 */
billingRouter.post("/portal", zValidator("json", createPortalSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");

  const result = await billingService.createBillingPortalSession(workspaceId, userId, body);
  return c.json({ data: result });
});

/**
 * GET /v1/billing/status
 * Get current billing status for the workspace.
 */
billingRouter.get("/status", async (c) => {
  const workspaceId = c.get("workspaceId");

  const status = await billingService.getBillingStatus(workspaceId);
  return c.json({ data: status });
});
