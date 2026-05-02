import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const stripeProcessedEvents = pgTable("stripe_processed_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  // FIND-004: lifecycle tracking — 'processing' is the claim, 'completed' is
  // success, 'failed' is permanent failure (DLQ). Without this, a handler
  // crash after the idempotency claim left the event invisible to retries.
  status: text("status").notNull().default("processing"),
  attemptCount: integer("attempt_count").notNull().default(1),
  lastError: text("last_error"),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type StripeProcessedEvent = typeof stripeProcessedEvents.$inferSelect;
export type NewStripeProcessedEvent = typeof stripeProcessedEvents.$inferInsert;
