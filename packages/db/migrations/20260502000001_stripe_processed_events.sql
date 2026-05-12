-- Migration: stripe_processed_events deduplication table
-- Adds the stripe_processed_events table used by the webhook handler to
-- implement event-ID idempotency (FIND-011). The PRIMARY KEY on event_id
-- provides the uniqueness constraint; onConflictDoNothing in the handler
-- detects duplicates without a separate SELECT.

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id    text        PRIMARY KEY,
  event_type  text        NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);
