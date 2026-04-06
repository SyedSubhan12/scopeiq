import { z } from "zod";

export const createCheckoutSchema = z.object({
  planTier: z.enum(["solo", "studio", "agency"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const createPortalSchema = z.object({
  returnUrl: z.string().url(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
