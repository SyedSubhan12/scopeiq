import { z } from "zod";

export const submitFeedbackSchema = z.object({
  deliverableId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  annotationJson: z
    .object({
      x_pos: z.number().min(0).max(100),
      y_pos: z.number().min(0).max(100),
      page_number: z.number().int().min(1).optional(),
      pin_number: z.number().int().min(1),
    })
    .optional(),
});

export const listFeedbackQuerySchema = z.object({
  deliverableId: z.string().uuid(),
});

export const resolveFeedbackSchema = z.object({
  resolved: z.boolean(),
});
