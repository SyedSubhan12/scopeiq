import { z } from "zod";

export const createCheckoutSchema = z.object({
  // v3.0: 'free' tier has no checkout (it's $0). Guard is enforced in billingService.
  // 'solo' removed from accepted input — retired tier.
  planTier: z.enum(["studio", "agency"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const createPortalSchema = z.object({
  returnUrl: z.string().url(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
