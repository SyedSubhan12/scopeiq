import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { projectService } from "../services/project.service.js";
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from "./project.schemas.js";
import { dispatchScopeCheckJob } from "../jobs/scope-check.job.js";
import { createDeliverableSchema, deliverableResponseSchema } from "./deliverable.schemas.js";
import { reminderLogRepository } from "../repositories/reminder-log.repository.js";
import { db, writeAuditLog, projects, deliverables, eq, and, isNull } from "@novabots/db";
import { reminderService } from "../services/reminder.service.js";

export const projectRouter = new Hono();

projectRouter.use("*", authMiddleware);

// Validate UUID in path parameters for all routes with :id
const uuidParamSchema = z.object({ id: z.string().uuid() });

projectRouter.get("/", zValidator("query", listProjectsQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const query = c.req.valid("query");
  const result = await projectService.listProjects(workspaceId, query);
  return c.json(result);
});

projectRouter.post("/", zValidator("json", createProjectSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const project = await projectService.createProject(workspaceId, userId, body);
  return c.json({ data: project }, 201);
});

projectRouter.get("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const project = await projectService.getProject(workspaceId, projectId);
  return c.json({ data: project });
});

projectRouter.get("/:id/sow", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const sow = await projectService.getProjectSOW(workspaceId, projectId);
  return c.json({ data: sow });
});

projectRouter.patch("/:id", zValidator("param", uuidParamSchema), zValidator("json", updateProjectSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const body = c.req.valid("json");
  const project = await projectService.updateProject(workspaceId, projectId, userId, body);
  return c.json({ data: project });
});

projectRouter.get("/:id/health", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const { analyticsService } = await import("../services/analytics.service.js");
  const health = await analyticsService.getProjectHealth(workspaceId, projectId);
  return c.json({ data: health });
});

projectRouter.get("/:id/briefs", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const briefs = await projectService.getProjectBriefs(workspaceId, projectId);
  return c.json({ data: briefs });
});

projectRouter.get("/:id/deliverables", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const result = await projectService.getProjectDeliverables(workspaceId, projectId);
  return c.json(result);
});

projectRouter.post(
  "/:id/deliverables",
  zValidator("param", uuidParamSchema),
  zValidator("json", createDeliverableSchema.omit({ projectId: true })),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const projectId = c.req.param("id");
    const body = c.req.valid("json");
    const deliverable = await projectService.createProjectDeliverable(workspaceId, projectId, userId, body);
    return c.json(deliverableResponseSchema.parse({ data: deliverable }), 201);
  },
);

projectRouter.delete("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  await projectService.deleteProject(workspaceId, projectId, userId);
  return c.json({ data: { success: true } });
});

// Manual message ingestion for scope checking
const ingestMessageSchema = z.object({
  text: z.string().min(1).max(5000),
});

projectRouter.post(
  "/:id/messages/ingest",
  zValidator("json", ingestMessageSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const projectId = c.req.param("id");
    const { text } = c.req.valid("json");

    // Verify project access
    await projectService.getProject(workspaceId, projectId);

    const jobId = await dispatchScopeCheckJob(projectId, text, userId);
    return c.json({ data: { jobId, status: "queued" } });
  },
);

// ---------------------------------------------------------------------------
// Reminder sequence control (FR-AP-004)
// ---------------------------------------------------------------------------

// PATCH /:id/reminders/pause — pause reminder sequence for a project
projectRouter.patch("/:id/reminders/pause", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");

  // Verify project exists and belongs to workspace
  const project = await projectService.getProject(workspaceId, projectId);

  const existingSettings = (project.settingsJson as Record<string, unknown> | null) ?? {};
  const updatedSettings = { ...existingSettings, remindersPaused: true };

  await db
    .update(projects)
    .set({ settingsJson: updatedSettings, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)));

  await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
    workspaceId,
    actorId: userId,
    entityType: "project",
    entityId: projectId,
    action: "update",
    metadata: { action: "reminders_paused" },
  });

  return c.json({ data: { projectId, remindersPaused: true } });
});

// PATCH /:id/reminders/reset — reset reminder state and re-queue first step if deliverable is in_review
projectRouter.patch("/:id/reminders/reset", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");

  // Verify project exists and belongs to workspace
  const project = await projectService.getProject(workspaceId, projectId);

  const existingSettings = (project.settingsJson as Record<string, unknown> | null) ?? {};
  const updatedSettings = { ...existingSettings, remindersPaused: false };

  await db
    .update(projects)
    .set({ settingsJson: updatedSettings, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)));

  await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
    workspaceId,
    actorId: userId,
    entityType: "project",
    entityId: projectId,
    action: "update",
    metadata: { action: "reminders_reset" },
  });

  // Re-queue first reminder step for any deliverable currently in_review
  const inReviewDeliverables = await db
    .select({ id: deliverables.id })
    .from(deliverables)
    .where(
      and(
        eq(deliverables.projectId, projectId),
        eq(deliverables.workspaceId, workspaceId),
        eq(deliverables.status, "in_review"),
        isNull(deliverables.deletedAt),
      ),
    );

  for (const d of inReviewDeliverables) {
    await reminderService.scheduleReminderSequence(projectId, d.id, workspaceId).catch((err) => {
      console.error(`[Reminders] Failed to re-queue reminder for deliverable ${d.id}:`, err);
    });
  }

  return c.json({ data: { projectId, remindersPaused: false, requeued: inReviewDeliverables.length } });
});

// ---------------------------------------------------------------------------
// Reminder logs (FR-AP-004)
// ---------------------------------------------------------------------------

// GET /:id/reminder-logs — list reminder logs for a project
projectRouter.get("/:id/reminder-logs", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");

  // Verify project exists and belongs to workspace
  await projectService.getProject(workspaceId, projectId);

  const logs = await reminderLogRepository.listByProject(workspaceId, projectId);
  return c.json({ data: logs });
});
