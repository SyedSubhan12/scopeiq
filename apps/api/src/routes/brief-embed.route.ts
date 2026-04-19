import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { briefEmbedService } from "../services/brief-embed.service.js";

export const briefEmbedRouter = new Hono();

briefEmbedRouter.use("*", authMiddleware);

const formFieldSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "textarea", "select", "multiselect", "email", "url"]),
  required: z.boolean(),
  placeholder: z.string().max(300).optional(),
  helpText: z.string().max(500).optional(),
  options: z.array(z.string().max(200)).max(50).optional(),
});

const formConfigSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  fields: z.array(formFieldSchema).min(1).max(30),
  submitLabel: z.string().max(100).optional(),
});

const createSchema = z.object({
  formConfig: formConfigSchema,
});

const updateSchema = z.object({
  formConfig: formConfigSchema.optional(),
  isActive: z.boolean().optional(),
});

// GET /brief-embeds
briefEmbedRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const data = await briefEmbedService.list(workspaceId);
  return c.json({ data });
});

// GET /brief-embeds/:id
briefEmbedRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");
  const data = await briefEmbedService.getById(workspaceId, id);
  return c.json({ data });
});

// POST /brief-embeds
briefEmbedRouter.post("/", zValidator("json", createSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const { formConfig } = c.req.valid("json");
  const data = await briefEmbedService.create(workspaceId, userId, formConfig);
  return c.json({ data }, 201);
});

// PATCH /brief-embeds/:id
briefEmbedRouter.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const data = await briefEmbedService.update(workspaceId, userId, id, body);
  return c.json({ data });
});

// POST /brief-embeds/:id/rotate-token
briefEmbedRouter.post("/:id/rotate-token", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const data = await briefEmbedService.rotateToken(workspaceId, userId, id);
  return c.json({ data });
});

// DELETE /brief-embeds/:id
briefEmbedRouter.delete("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const data = await briefEmbedService.deactivate(workspaceId, userId, id);
  return c.json({ data });
});
