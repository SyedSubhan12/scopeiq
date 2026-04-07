import { z } from "zod";

export const changeOrderLineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  hours: z.number().nonnegative(),
  rate: z.number().nonnegative(),
});

export const changeOrderSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid(),
  scopeFlagId: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  lineItemsJson: z.array(changeOrderLineItemSchema),
  revisedTimeline: z.string().nullable(),
  status: z.enum(["draft", "sent", "accepted", "declined", "expired"]),
  sentAt: z.coerce.date().nullable(),
  respondedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createChangeOrderSchema = z.object({
  projectId: z.string().uuid(),
  scopeFlagId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  lineItemsJson: z.array(changeOrderLineItemSchema).optional(),
  revisedTimeline: z.string().optional(),
});

export const updateChangeOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  lineItemsJson: z.array(changeOrderLineItemSchema).optional(),
  revisedTimeline: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "declined", "expired"]).optional(),
});

export const changeOrderResponseSchema = z.object({
  data: changeOrderSchema,
});

type ChangeOrderLineItem = z.infer<typeof changeOrderLineItemSchema>;

function parseLineItems(raw: unknown): ChangeOrderLineItem[] {
  const parsed = z.array(changeOrderLineItemSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

function deriveAmount(lineItems: ChangeOrderLineItem[], rawPricing: unknown): number | null {
  if (lineItems.length > 0) {
    return lineItems.reduce((total, item) => total + item.hours * item.rate, 0);
  }

  if (rawPricing && typeof rawPricing === "object" && !Array.isArray(rawPricing)) {
    const pricing = rawPricing as Record<string, unknown>;
    if (typeof pricing.amount === "number") {
      return pricing.amount;
    }
  }

  return null;
}

export function serializeChangeOrder(raw: Record<string, unknown>) {
  const lineItems = parseLineItems(raw.lineItemsJson);

  return {
    ...raw,
    description: typeof raw.workDescription === "string" ? raw.workDescription : null,
    amount: deriveAmount(lineItems, raw.pricing),
    lineItemsJson: lineItems,
    revisedTimeline: typeof raw.revisedTimeline === "string" ? raw.revisedTimeline : null,
  };
}
