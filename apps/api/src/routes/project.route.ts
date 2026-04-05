import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { projectService } from "../services/project.service.js";
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from "./project.schemas.js";
import { dispatchScopeCheckJob } from "../jobs/scope-check.job.js";

export const projectRouter = new Hono();

projectRouter.use("*", authMiddleware);

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

projectRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const project = await projectService.getProject(workspaceId, projectId);
  return c.json({ data: project });
});

projectRouter.get("/:id/sow", async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const sow = await projectService.getProjectSOW(workspaceId, projectId);
  return c.json({ data: sow });
});

projectRouter.patch("/:id", zValidator("json", updateProjectSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const body = c.req.valid("json");
  const project = await projectService.updateProject(workspaceId, projectId, userId, body);
  return c.json({ data: project });
});

projectRouter.get("/:id/health", async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const { analyticsService } = await import("../services/analytics.service.js");
  const health = await analyticsService.getProjectHealth(workspaceId, projectId);
  return c.json({ data: health });
});

projectRouter.get("/:id/briefs", async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const briefs = await projectService.getProjectBriefs(workspaceId, projectId);
  return c.json({ data: briefs });
});

projectRouter.get("/:id/deliverables", async (c) => {
  const workspaceId = c.get("workspaceId");
  const projectId = c.req.param("id");
  const result = await projectService.getProjectDeliverables(workspaceId, projectId);
  return c.json(result);
});

projectRouter.post("/:id/deliverables", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const deliverable = await projectService.createProjectDeliverable(workspaceId, projectId, userId, body);
  return c.json({ data: deliverable }, 201);
});

projectRouter.delete("/:id", async (c) => {
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
