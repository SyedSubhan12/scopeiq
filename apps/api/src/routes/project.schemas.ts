import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  clientId: z.string().uuid(),
  description: z.string().optional(),
  budget: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
  budget: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const listProjectsQuerySchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
  clientId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
