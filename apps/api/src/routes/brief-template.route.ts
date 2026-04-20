import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { briefTemplateService } from "../services/brief-template.service.js";
import { marketplaceService } from "../services/marketplace.service.js";
import {
  createBriefTemplateSchema,
  restoreBriefTemplateVersionSchema,
  updateBriefTemplateSchema,
} from "./brief-template.schemas.js";

export const briefTemplateRouter = new Hono();

briefTemplateRouter.use("*", authMiddleware);

// Validate UUID in path parameters
const uuidParamSchema = z.object({ id: z.string().uuid() });

briefTemplateRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const templates = await briefTemplateService.listTemplates(workspaceId);
  return c.json({ data: templates });
});

briefTemplateRouter.post(
  "/",
  zValidator("json", createBriefTemplateSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const template = await briefTemplateService.createTemplate(workspaceId, userId, body);
    return c.json({ data: template }, 201);
  },
);

briefTemplateRouter.get("/marketplace/installs", async (c) => {
  const workspaceId = c.get("workspaceId");
  const installedSlugs = await marketplaceService.listInstalls(workspaceId);
  return c.json({ data: { installedSlugs } });
});

briefTemplateRouter.post("/install/:slug", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const result = await marketplaceService.install(workspaceId, userId, slug);
  return c.json({ data: result }, 201);
});

briefTemplateRouter.get("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const templateId = c.req.param("id");
  const template = await briefTemplateService.getTemplate(workspaceId, templateId);
  return c.json({ data: template });
});

briefTemplateRouter.patch(
  "/:id",
  zValidator("param", uuidParamSchema),
  zValidator("json", updateBriefTemplateSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const templateId = c.req.param("id");
    const body = c.req.valid("json");
    const template = await briefTemplateService.updateTemplate(workspaceId, templateId, userId, body);
    return c.json({ data: template });
  },
);

briefTemplateRouter.get("/:id/versions", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const templateId = c.req.param("id");
  const versions = await briefTemplateService.listTemplateVersions(workspaceId, templateId);
  return c.json({ data: versions });
});

briefTemplateRouter.post("/:id/publish", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const templateId = c.req.param("id");
  const result = await briefTemplateService.publishTemplate(workspaceId, templateId, userId);
  return c.json({ data: result });
});

briefTemplateRouter.post(
  "/:id/restore",
  zValidator("param", uuidParamSchema),
  zValidator("json", restoreBriefTemplateVersionSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const templateId = c.req.param("id");
    const body = c.req.valid("json");
    const template = await briefTemplateService.restoreTemplateVersion(
      workspaceId,
      templateId,
      body.versionId,
      userId,
    );
    return c.json({ data: template });
  },
);

briefTemplateRouter.delete("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const templateId = c.req.param("id");
  await briefTemplateService.deleteTemplate(workspaceId, templateId, userId);
  return c.json({ data: { success: true } });
});
