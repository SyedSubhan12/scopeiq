import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { workspaceService } from "../services/workspace.service.js";
import { updateWorkspaceSchema } from "./workspace.schemas.js";
import { z } from "zod";

const onboardingStepSchema = z.object({
  step: z.enum([
    "workspace_named",
    "first_client",
    "first_project",
    "brief_template",
    "portal_tour",
  ]),
  complete: z.boolean().default(true),
});

export const workspaceRouter = new Hono();

workspaceRouter.use("*", authMiddleware);

workspaceRouter.get("/me", async (c) => {
  const workspaceId = c.get("workspaceId");
  const workspace = await workspaceService.getWorkspace(workspaceId);
  return c.json({ data: workspace });
});

workspaceRouter.patch("/me", zValidator("json", updateWorkspaceSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const workspace = await workspaceService.updateWorkspace(workspaceId, userId, body);
  return c.json({ data: workspace });
});

workspaceRouter.patch(
  "/me/onboarding",
  zValidator("json", onboardingStepSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const { step, complete } = c.req.valid("json");
    const workspace = await workspaceService.updateOnboardingStep(
      workspaceId,
      step,
      complete,
    );
    return c.json({ data: workspace });
  },
);
