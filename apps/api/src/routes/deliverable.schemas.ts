import { z } from "zod";

export const listDeliverablesQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z
    .enum(["not_started", "in_progress", "in_review", "revision_requested", "approved"])
    .optional(),
  cursor: z.string().datetime().optional(), // ISO timestamp of last item's createdAt
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createDeliverableSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.enum(["file", "figma", "loom", "youtube", "link"]).default("file"),
  externalUrl: z.string().url().optional(),
  maxRevisions: z.number().int().min(1).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateDeliverableSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["not_started", "in_progress", "in_review", "revision_requested", "approved"])
    .optional(),
  externalUrl: z.string().url().optional(),
  maxRevisions: z.number().int().min(1).optional(),
  dueDate: z.string().datetime().optional(),
});

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(500 * 1024 * 1024), // 500MB max
});

export const confirmUploadSchema = z.object({
  objectKey: z.string().min(1),
});
