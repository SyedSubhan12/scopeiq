import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { projectService } from "../services/project.service.js";
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from "./project.schemas.js";

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

projectRouter.patch("/:id", zValidator("json", updateProjectSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  const body = c.req.valid("json");
  const project = await projectService.updateProject(workspaceId, projectId, userId, body);
  return c.json({ data: project });
});

projectRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const projectId = c.req.param("id");
  await projectService.deleteProject(workspaceId, projectId, userId);
  return c.json({ data: { success: true } });
});
