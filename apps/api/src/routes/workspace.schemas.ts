import { z } from "zod";

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
  settingsJson: z.record(z.unknown()).optional(),
});
