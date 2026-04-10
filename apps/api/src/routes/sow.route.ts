import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { sowService } from "../services/sow.service.js";
import { getUploadUrl } from "../lib/storage.js";
import type { ClauseType } from "@novabots/db";

export const sowRouter = new Hono();

sowRouter.use("*", authMiddleware);

const createSowSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  rawText: z.string().min(10),
});

const updateClausesSchema = z.object({
  clauses: z.array(
    z.object({
      id: z.string().uuid().optional(),
      clauseType: z.enum(["deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"]),
      originalText: z.string().min(1),
      summary: z.string().optional(),
      sortOrder: z.number().int().default(0),
    }),
  ),
});

const sowUploadSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

const activateClausesSchema = z.object({
  clauses: z.array(
    z.object({
      clauseType: z.enum(["deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"]),
      originalText: z.string().min(1),
      summary: z.string().optional().nullable(),
      sortOrder: z.number().int().optional(),
    }),
  ),
});

// Create a SOW from pasted/typed text for a project
sowRouter.post("/", zValidator("json", createSowSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const { projectId, title, rawText } = c.req.valid("json");

  const result = await sowService.create(workspaceId, userId, { projectId, title, rawText });

  return c.json({ data: result }, 201);
});

// Get SOW with clauses by ID
sowRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const id = c.req.param("id");

  const result = await sowService.getById(workspaceId, id);

  return c.json({ data: result });
});

// Replace all clauses (after agency review / editing)
sowRouter.patch("/:id/clauses", zValidator("json", updateClausesSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const { clauses } = c.req.valid("json");

  const updated = await sowService.updateClauses(
    workspaceId,
    userId,
    id,
    clauses.map((clause) => ({
      clauseType: clause.clauseType as ClauseType,
      originalText: clause.originalText,
      summary: clause.summary ?? null,
      sortOrder: clause.sortOrder,
    })),
  );

  return c.json({ data: updated });
});

// Activate (finalize) a SOW with reviewed clauses
sowRouter.post("/:id/activate", authMiddleware, zValidator("json", activateClausesSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const { clauses } = c.req.valid("json");

  const result = await sowService.activateSow(workspaceId, userId, id, {
    clauses: clauses.map((clause, index) => ({
      clauseType: clause.clauseType as ClauseType,
      originalText: clause.originalText,
      summary: clause.summary ?? null,
      sortOrder: clause.sortOrder ?? index,
    })),
  });

  return c.json({ data: result });
});

// Get presigned upload URL for SOW file
sowRouter.post("/upload", authMiddleware, zValidator("json", sowUploadSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const { projectId, fileName, contentType } = c.req.valid("json");

  const objectKey = `sow/${workspaceId}/${projectId}/${Date.now()}-${fileName}`;
  const uploadUrl = await getUploadUrl(objectKey, contentType);

  return c.json({ data: { uploadUrl, objectKey } });
});
