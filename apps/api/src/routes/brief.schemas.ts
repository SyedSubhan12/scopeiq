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

export const submitBriefSchema = z.object({
  template_id: z.string().uuid(),
  project_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  responses: z.record(z.unknown()),
});

// Agency-side brief creation (authenticated, within dashboard)
export const createBriefSchema = z.object({
  projectId: z.string().uuid(),
  templateId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  responses: z.record(z.unknown()).default({}),
});
