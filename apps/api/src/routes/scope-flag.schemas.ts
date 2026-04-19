import { z } from "zod";

export const updateScopeFlagSchema = z.object({
  status: z.enum(["confirmed", "dismissed", "snoozed", "change_order_sent", "resolved"]),
  reason: z.string().optional(),
});

export const scopeFlagSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid(),
  sowClauseId: z.string().uuid().nullable(),
  messageText: z.string(),
  confidence: z.number(),
  severity: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "confirmed", "dismissed", "snoozed", "change_order_sent", "resolved"]),
  title: z.string(),
  description: z.string().nullable(),
  suggestedResponse: z.string().nullable(),
  aiReasoning: z.string().nullable(),
  matchingClausesJson: z.array(z.unknown()).nullable().optional(),
  evidence: z.record(z.unknown()).nullable().optional(),
  flaggedBy: z.string().uuid().nullable(),
  resolvedBy: z.string().uuid().nullable(),
  resolvedAt: z.coerce.date().nullable(),
  snoozedUntil: z.coerce.date().nullable(),
  slaDeadline: z.coerce.date().nullable(),
  slaBreached: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const scopeFlagResponseSchema = z.object({
  data: scopeFlagSchema,
});
