-- FIND-004: Stripe webhook event lifecycle tracking.
-- The previous schema had only a PK on event_id. The handler claimed the
-- event before processing and returned 200 on permanent failures, so a crash
-- after the claim made the event invisible on Stripe retries. Add status
-- columns so a sweeper can re-process stuck rows and so DLQ rows are visible.

ALTER TABLE stripe_processed_events
  ADD COLUMN IF NOT EXISTS status        text                       NOT NULL DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS attempt_count integer                    NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error    text,
  ADD COLUMN IF NOT EXISTS completed_at  timestamp with time zone;

-- Backfill existing rows as completed; they were already processed under the
-- old code path (returned 200 implies no exception was raised).
UPDATE stripe_processed_events
SET status = 'completed', completed_at = processed_at
WHERE status = 'processing' AND completed_at IS NULL;

-- Index for the sweeper job: find stuck or failed rows quickly.
CREATE INDEX IF NOT EXISTS idx_stripe_events_status_processed_at
  ON stripe_processed_events (status, processed_at)
  WHERE status IN ('processing', 'failed');
