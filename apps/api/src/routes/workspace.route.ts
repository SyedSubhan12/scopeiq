import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { workspaceService } from "../services/workspace.service.js";
import { updateWorkspaceSchema, updateAiPolicySchema } from "./workspace.schemas.js";
import { getUploadUrl, validateMimeType } from "../lib/storage.js";
import { stripUndefined } from "../lib/strip-undefined.js";
import { z } from "zod";
import { db, workspaces, projects, eq, and, desc, isNotNull, writeAuditLog } from "@novabots/db";

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
// Slack OAuth routes
// ---------------------------------------------------------------------------

// GET /slack/status
workspaceRouter.get("/slack/status", async (c) => {
  const workspaceId = c.get("workspaceId");
  const [ws] = await db.select({ settingsJson: workspaces.settingsJson }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const settings = (ws?.settingsJson ?? {}) as Record<string, unknown>;
  const connected = !!settings["slackAccessToken"];
  return c.json({ data: { connected, teamName: connected ? settings["slackTeamName"] : null } });
});

// GET /slack/connect — redirect to Slack OAuth
workspaceRouter.get("/slack/connect", async (c) => {
  const clientId = process.env.SLACK_CLIENT_ID ?? "";
  const redirectUri = process.env.SLACK_REDIRECT_URI ?? "";
  const workspaceId = c.get("workspaceId");
  // state = base64(workspaceId) to recover workspaceId in callback
  const state = Buffer.from(workspaceId).toString("base64");
  const scopes = "chat:write,channels:read";
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  return c.redirect(url);
});

// GET /slack/callback — exchange code, store token
workspaceRouter.get("/slack/callback", async (c) => {
  const { code, state, error } = c.req.query();
  if (error || !code || !state) {
    return c.json({ error: "Slack OAuth failed" }, 400);
  }
  const workspaceId = Buffer.from(state, "base64").toString("utf-8");
  const userId = c.get("userId");

  // Exchange code for token
  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID ?? "",
      client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI ?? "",
    }),
  });
  const tokenData = await tokenRes.json() as { ok: boolean; access_token?: string; team?: { id: string; name: string }; error?: string };

  if (!tokenData.ok || !tokenData.access_token) {
    return c.json({ error: `Slack token exchange failed: ${tokenData.error}` }, 400);
  }

  // Get default channel (first public channel, prefer #general)
  let channelId = "general";
  try {
    const chRes = await fetch("https://slack.com/api/conversations.list?limit=5&types=public_channel", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const chData = await chRes.json() as { ok: boolean; channels?: Array<{ id: string; name: string }> };
    const generalChannel = chData.channels?.find((ch) => ch.name === "general") ?? chData.channels?.[0];
    if (generalChannel) channelId = generalChannel.id;
  } catch { /* ignore, use default */ }

  // Update workspace settingsJson
  const [ws] = await db.select({ settingsJson: workspaces.settingsJson }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const existing = (ws?.settingsJson ?? {}) as Record<string, unknown>;
  const updated = {
    ...existing,
    slackAccessToken: tokenData.access_token,
    slackTeamId: tokenData.team?.id ?? "",
    slackTeamName: tokenData.team?.name ?? "",
    slackChannelId: channelId,
  };

  await db.update(workspaces).set({ settingsJson: updated, updatedAt: new Date() }).where(eq(workspaces.id, workspaceId));
  await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
    workspaceId,
    actorId: userId,
    entityType: "workspace",
    entityId: workspaceId,
    action: "update",
    metadata: { action: "slack_connected", teamName: tokenData.team?.name },
  });

  // Redirect back to settings page
  return c.redirect(`${process.env.APP_URL ?? ""}/dashboard/settings?slack=connected`);
});

// DELETE /slack/disconnect
workspaceRouter.delete("/slack/disconnect", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const [ws] = await db.select({ settingsJson: workspaces.settingsJson }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const existing = (ws?.settingsJson ?? {}) as Record<string, unknown>;
  const { slackAccessToken: _sat, slackTeamId: _sti, slackTeamName: _stn, slackChannelId: _sci, ...rest } = existing;

  await db.update(workspaces).set({ settingsJson: rest, updatedAt: new Date() }).where(eq(workspaces.id, workspaceId));
  await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
    workspaceId,
    actorId: userId,
    entityType: "workspace",
    entityId: workspaceId,
    action: "update",
    metadata: { action: "slack_disconnected" },
  });

  return c.json({ data: { disconnected: true } });
});

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

// ---------------------------------------------------------------------------
// Public router — no auth required (subdomain slug resolution for portal)
// FR-AP-001: {slug}.scopeiq.com → resolve portalToken → portal redirect
// ---------------------------------------------------------------------------

export const workspacePublicRouter = new Hono();

workspacePublicRouter.get("/by-slug/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [workspace] = await db
    .select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!workspace) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace not found" } }, 404);
  }

  const [project] = await db
    .select({ id: projects.id, portalToken: projects.portalToken, status: projects.status })
    .from(projects)
    .where(and(eq(projects.workspaceId, workspace.id), isNotNull(projects.portalToken)))
    .orderBy(desc(projects.createdAt))
    .limit(1);

  if (!project?.portalToken) {
    return c.json({
      error: { code: "NOT_FOUND", message: "No active portal found for this workspace" },
    }, 404);
  }

  return c.json({
    data: { workspaceSlug: workspace.slug, workspaceName: workspace.name, portalToken: project.portalToken },
  });
});
