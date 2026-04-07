import { z } from "zod";

const deliverableStatusSchema = z.enum([
  "draft",
  "delivered",
  "in_review",
  "changes_requested",
  "approved",
]);

export const deliverableSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(["file", "figma", "loom", "youtube", "link"]),
  status: deliverableStatusSchema,
  fileUrl: z.string().nullable(),
  fileKey: z.string().nullable(),
  fileSizeBytes: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  originalName: z.string().nullable(),
  externalUrl: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  revisionRound: z.number().int(),
  maxRevisions: z.number().int(),
  dueDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const deliverableResponseSchema = z.object({
  data: deliverableSchema,
});

export const approvalEventSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  eventType: z.string(),
  actorId: z.string().uuid().nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  comment: z.string().nullable(),
  timestamp: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
});

export const approvalEventResponseSchema = z.object({
  data: approvalEventSchema,
});

export const deliverableDeleteResponseSchema = z.object({
  message: z.string(),
});

export const listDeliverablesQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: deliverableStatusSchema.optional(),
  cursor: z.string().datetime().optional(), // ISO timestamp of last item's createdAt
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createDeliverableSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.enum(["file", "figma", "loom", "youtube", "link"]).default("file"),
  externalUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  maxRevisions: z.number().int().min(1).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateDeliverableSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: deliverableStatusSchema.optional(),
  externalUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
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
  originalName: z.string().min(1).max(255).optional(),
  notes: z.string().max(2000).optional(),
});
