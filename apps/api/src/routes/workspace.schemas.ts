import { z } from "zod";

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
  settingsJson: z.record(z.unknown()).optional(),
});

export const updateAiPolicySchema = z
  .object({
    briefScoreThreshold: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional(),
    scopeGuardThreshold: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a numeric string")
      .refine(
        (v) => {
          const n = parseFloat(v);
          return n >= 0.0 && n <= 1.0;
        },
        { message: "scopeGuardThreshold must be between 0.0 and 1.0" },
      )
      .optional(),
    autoHoldEnabled: z.boolean().optional(),
    autoApproveAfterDays: z.number().int().min(1).max(30).optional(),
  })
  .refine(
    (data) =>
      data.briefScoreThreshold !== undefined ||
      data.scopeGuardThreshold !== undefined ||
      data.autoHoldEnabled !== undefined ||
      data.autoApproveAfterDays !== undefined,
    { message: "At least one AI policy field must be provided" },
  );

export type UpdateAiPolicyInput = z.infer<typeof updateAiPolicySchema>;
