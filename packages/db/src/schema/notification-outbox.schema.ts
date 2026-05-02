import { pgTable, uuid, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

/**
 * Transactional outbox for notifications (Slack, BullMQ alert dispatches,
 * Resend emails). Per FIND-012, prior code dispatched these as fire-and-forget
 * after the originating DB transaction; transient failures (Redis blip,
 * Slack 5xx) silently dropped the notification with no retry.
 *
 * Producers INSERT a row inside the originating trx. A poller worker drains
 * `status='pending'` rows with at-least-once semantics and marks them
 * 'sent' / 'failed'. The unique (idempotency_key, target) constraint lets
 * producers deduplicate retries trivially.
 */
export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    /** "slack_scope_flag" | "bullmq_scope_flag_alert" | "email_clarification" | … */
    target: text("target").notNull(),
    /** Caller-supplied dedup key, e.g. `scope_flag_alert:<flagId>` */
    idempotencyKey: text("idempotency_key").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => ({
    statusNextIdx: index("idx_notification_outbox_status_next").on(
      table.status,
      table.nextAttemptAt,
    ),
    targetKeyIdx: index("idx_notification_outbox_target_key").on(
      table.target,
      table.idempotencyKey,
    ),
  }),
);

export type NotificationOutbox = typeof notificationOutbox.$inferSelect;
export type NewNotificationOutbox = typeof notificationOutbox.$inferInsert;
