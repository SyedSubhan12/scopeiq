/**
 * Transactional notification outbox (FIND-012).
 *
 * Producer side: inside the originating DB transaction, call enqueue() to
 * persist a row in notification_outbox. The row commits atomically with the
 * domain change (scope_flag insert, change_order insert, …). If the trx rolls
 * back, the notification is also rolled back — no split-brain.
 *
 * Consumer side: drainOnce() is invoked by a BullMQ scheduler (every 10s)
 * and processes a small batch of pending rows with at-least-once semantics.
 * Permanent failures land in status='failed' (DLQ).
 */
import {
  db,
  notificationOutbox,
  eq,
  and,
  sql,
} from "@novabots/db";
import type { NewNotificationOutbox } from "@novabots/db";

type Driver = typeof db;

const MAX_ATTEMPTS = 5;

export const notificationOutboxService = {
  async enqueue(
    tx: Driver,
    row: Omit<NewNotificationOutbox, "id" | "status" | "attemptCount">,
  ): Promise<void> {
    await tx
      .insert(notificationOutbox)
      .values({
        ...row,
        status: "pending",
        attemptCount: 0,
      })
      .onConflictDoNothing();
  },

  async drainOnce(
    handler: (target: string, payload: unknown) => Promise<void>,
    batchSize = 25,
  ): Promise<{ processed: number; failed: number }> {
    // Lock + claim a small batch with FOR UPDATE SKIP LOCKED so multiple
    // workers can drain in parallel without stepping on each other.
    const claimed = await db.execute<{ id: string; target: string; payload: unknown; attempt_count: number }>(sql`
      WITH cte AS (
        SELECT id
        FROM notification_outbox
        WHERE status = 'pending'
          AND next_attempt_at <= NOW()
        ORDER BY next_attempt_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      UPDATE notification_outbox o
      SET status = 'in_flight',
          attempt_count = o.attempt_count + 1
      FROM cte
      WHERE o.id = cte.id
      RETURNING o.id, o.target, o.payload, o.attempt_count
    `);

    let processed = 0;
    let failed = 0;
    const rows = (claimed as unknown as { rows?: { id: string; target: string; payload: unknown; attempt_count: number }[] }).rows
      ?? (claimed as unknown as { id: string; target: string; payload: unknown; attempt_count: number }[]);

    for (const row of rows ?? []) {
      try {
        await handler(row.target, row.payload);
        await db
          .update(notificationOutbox)
          .set({ status: "sent", sentAt: new Date(), lastError: null })
          .where(eq(notificationOutbox.id, row.id));
        processed++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        const exceeded = row.attempt_count >= MAX_ATTEMPTS;
        const backoffSec = Math.min(60 * 60, 30 * 2 ** row.attempt_count);
        await db
          .update(notificationOutbox)
          .set({
            status: exceeded ? "failed" : "pending",
            lastError: message,
            nextAttemptAt: exceeded
              ? new Date()
              : new Date(Date.now() + backoffSec * 1000),
          })
          .where(and(eq(notificationOutbox.id, row.id), eq(notificationOutbox.status, "in_flight")));
      }
    }

    return { processed, failed };
  },
};
