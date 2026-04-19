import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { workspaceService } from "../services/workspace.service.js";
import { updateWorkspaceSchema, updateAiPolicySchema } from "./workspace.schemas.js";
import { getUploadUrl, validateMimeType } from "../lib/storage.js";
import { stripUndefined } from "../lib/strip-undefined.js";
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

workspaceRouter.get("/me/users", async (c) => {
  const workspaceId = c.get("workspaceId");
  const users = await workspaceService.listWorkspaceUsers(workspaceId);
  return c.json({ data: users });
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

workspaceRouter.patch(
  "/current/ai-policy",
  zValidator("json", updateAiPolicySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = stripUndefined(c.req.valid("json")) as Parameters<typeof workspaceService.updateAiPolicy>[2];
    const workspace = await workspaceService.updateAiPolicy(workspaceId, userId, body);
    return c.json({ data: workspace });
  },
);

workspaceRouter.post(
  "/logo/upload-url",
  zValidator("json", z.object({ contentType: z.string() })),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const { contentType } = c.req.valid("json");

    // Validate MIME type
    validateMimeType(contentType);

    // Generate object key for workspace logo
    const objectKey = `workspaces/${workspaceId}/logo`;

    // Get presigned upload URL (15 min expiry)
    const uploadUrl = await getUploadUrl(objectKey, contentType, 900);

    // Get public download URL for immediate use
    const publicUrl = `${process.env.STORAGE_ENDPOINT}:${process.env.STORAGE_PORT}/${process.env.STORAGE_BUCKET}/${objectKey}`;

    return c.json({ data: { uploadUrl, objectKey, publicUrl } }, 200);
  },
);
