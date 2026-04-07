import { z } from "zod";

export const listBriefsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z
    .enum(["pending_score", "scored", "clarification_needed", "approved", "rejected"])
    .optional(),
});

export const overrideBriefSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z
    .enum(["pending_score", "scored", "clarification_needed", "approved", "rejected"])
    .optional(),
  scopeScore: z.number().int().min(0).max(100).optional(),
  scoringResultJson: z.record(z.unknown()).optional(),
});

export const reviewBriefSchema = z.object({
  action: z.enum(["approve", "clarify", "hold", "override"]),
  status: z.enum(["clarification_needed", "approved", "rejected"]),
  note: z.string().trim().min(1).max(2000).optional(),
});

export const assignBriefReviewerSchema = z.object({
  reviewerId: z.string().uuid().nullable(),
});

export const createClarificationRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
  items: z
    .array(
      z.object({
        fieldKey: z.string().min(1).max(100),
        fieldLabel: z.string().min(1).max(255),
        prompt: z.string().trim().min(1).max(2000),
        severity: z.enum(["low", "medium", "high"]).default("medium"),
        sourceFlagId: z.string().min(1).max(100).optional(),
      }),
    )
    .min(1),
});

export const submitBriefSchema = z.object({
  template_id: z.string().uuid(),
  project_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  responses: z.record(z.unknown()),
});

export const submitPendingBriefSchema = z.object({
  briefId: z.string().uuid(),
  responses: z.record(z.unknown()),
});

export const savePendingBriefDraftSchema = z.object({
  briefId: z.string().uuid(),
  responses: z.record(z.unknown()),
});

export const submitClarificationResponseSchema = z.object({
  briefId: z.string().uuid(),
  clarificationRequestId: z.string().uuid(),
  responses: z.record(z.unknown()),
});

export const briefAttachmentUploadUrlSchema = z.object({
  briefId: z.string().uuid(),
  fieldKey: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024),
});

export const confirmBriefAttachmentSchema = z.object({
  briefId: z.string().uuid(),
  fieldKey: z.string().min(1).max(100),
  objectKey: z.string().min(1),
  originalName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255).optional(),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024).optional(),
});

// Agency-side brief creation (authenticated, within dashboard)
export const createBriefSchema = z.object({
  projectId: z.string().uuid(),
  templateId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  responses: z.record(z.unknown()).default({}),
});
