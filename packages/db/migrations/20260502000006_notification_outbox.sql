-- FIND-012: transactional outbox for fire-and-forget notifications.
-- Producers INSERT inside the originating DB transaction; a poller drains
-- status='pending' rows with at-least-once semantics. Solves silent loss
-- of Slack pushes, scope-flag alerts and clarification emails on Redis
-- or upstream blips.

CREATE TABLE IF NOT EXISTS notification_outbox (
  id              uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid                       NOT NULL REFERENCES workspaces(id),
  target          text                       NOT NULL,
  idempotency_key text                       NOT NULL,
  payload         jsonb                      NOT NULL,
  status          text                       NOT NULL DEFAULT 'pending',
  attempt_count   integer                    NOT NULL DEFAULT 0,
  last_error      text,
  next_attempt_at timestamp with time zone   NOT NULL DEFAULT NOW(),
  created_at      timestamp with time zone   NOT NULL DEFAULT NOW(),
  sent_at         timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_next
  ON notification_outbox (status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_target_key
  ON notification_outbox (target, idempotency_key);
