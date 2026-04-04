import { z } from "zod";

export const createRateCardItemSchema = z.object({
  name: z.string().min(1).max(255),
  rateInCents: z.number().int().positive(),
  unit: z.string().max(50).optional(),
  description: z.string().optional(),
  currency: z.string().length(3).optional(),
});

export const updateRateCardItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  rateInCents: z.number().int().positive().optional(),
  unit: z.string().max(50).optional(),
  description: z.string().optional(),
});
