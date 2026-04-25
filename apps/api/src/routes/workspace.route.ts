import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { workspaceService } from "../services/workspace.service.js";
import { updateWorkspaceSchema, updateAiPolicySchema } from "./workspace.schemas.js";
import { getUploadUrl, validateMimeType } from "../lib/storage.js";
import { stripUndefined } from "../lib/strip-undefined.js";
import { z } from "zod";
import { db, workspaces, eq } from "@novabots/db";

const onboardingStepSchema = z.object({
  step: z.enum([
    "persona_selected",
    "workspace_configured",
    "pain_point_selected",
    "path_setup_complete",
    "team_invited",
    "setup_complete",
  ]),
  complete: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
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
    const { step, complete, metadata } = c.req.valid("json");
    const workspace = await workspaceService.updateOnboardingStep(
      workspaceId,
      step,
      complete,
      metadata,
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

// ---------------------------------------------------------------------------
// GET /v1/workspaces/me/sandbox-status
// Returns the current sandbox/demo mode status for the workspace.
// ---------------------------------------------------------------------------

interface SandboxSettingsJson {
  sandbox_mode?: boolean;
  demo_client_id?: string;
  demo_project_id?: string;
  sandbox_expires_at?: string;
}

workspaceRouter.get("/me/sandbox-status", async (c) => {
  const workspaceId = c.get("workspaceId");

  const [row] = await db
    .select({ settingsJson: workspaces.settingsJson })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!row) {
    return c.json({
      data: {
        sandbox_mode: false,
        sandbox_expires_at: null,
        demo_project_id: null,
      },
    });
  }

  const settings = (row.settingsJson ?? {}) as SandboxSettingsJson;

  return c.json({
    data: {
      sandbox_mode: settings.sandbox_mode ?? false,
      sandbox_expires_at: settings.sandbox_expires_at ?? null,
      demo_project_id: settings.demo_project_id ?? null,
    },
  });
});
