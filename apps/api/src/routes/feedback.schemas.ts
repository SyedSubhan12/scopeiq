import { z } from "zod";

const feedbackAnnotationSchema = z
  .union([
    z.object({
      xPos: z.number().min(0).max(100),
      yPos: z.number().min(0).max(100),
      pageNumber: z.number().int().min(1).nullable().optional(),
      pinNumber: z.number().int().min(1),
    }),
    z.object({
      x_pos: z.number().min(0).max(100),
      y_pos: z.number().min(0).max(100),
      page_number: z.number().int().min(1).nullable().optional(),
      pin_number: z.number().int().min(1),
    }).transform((value) => ({
      xPos: value.x_pos,
      yPos: value.y_pos,
      pageNumber: value.page_number ?? null,
      pinNumber: value.pin_number,
    })),
  ])
  .transform((value) => ({
    xPos: value.xPos,
    yPos: value.yPos,
    pageNumber: value.pageNumber ?? null,
    pinNumber: value.pinNumber,
  }));

export const feedbackItemSchema = z.object({
  id: z.string().uuid(),
  deliverableId: z.string().uuid(),
  authorId: z.string().uuid().nullable(),
  authorName: z.string().nullable(),
  source: z.enum(["portal", "email_forward", "manual_input"]),
  body: z.string(),
  annotationJson: feedbackAnnotationSchema.nullable(),
  pageNumber: z.number().int().nullable().optional(),
  resolvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const feedbackResponseSchema = z.object({
  data: feedbackItemSchema,
});

export const feedbackDeleteResponseSchema = z.object({
  message: z.string(),
});

export const submitFeedbackSchema = z.object({
  deliverableId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  annotationJson: feedbackAnnotationSchema.optional(),
  pageNumber: z.number().int().min(1).optional().nullable(),
});

export const listFeedbackQuerySchema = z.object({
  deliverableId: z.string().uuid(),
});

export const resolveFeedbackSchema = z.object({
  resolved: z.boolean(),
});

export const submitNpsSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
  surface: z.string().max(100).optional(),
});

export const npsResponseSchema = z.object({
  ok: z.literal(true),
  category: z.enum(["promoter", "passive", "detractor"]),
});
