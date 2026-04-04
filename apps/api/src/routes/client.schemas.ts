import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contactName: z.string().max(255).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
});
