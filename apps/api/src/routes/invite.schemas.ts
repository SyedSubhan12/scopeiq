import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export const acceptInviteSchema = z.object({
  token: z.string().uuid(),
  fullName: z.string().min(1).max(255),
  password: z.string().min(8),
});
