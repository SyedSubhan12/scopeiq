-- Additive migration: add SLA tracking columns to scope_flags
-- sla_deadline: timestamp 48h after flag creation (set by API on insert)
-- sla_breached: set true by the SLA sweep BullMQ job when deadline passes without resolution

ALTER TABLE scope_flags
  ADD COLUMN IF NOT EXISTS sla_deadline  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_breached  BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to accelerate the SLA sweep query (open flags past their deadline)
CREATE INDEX IF NOT EXISTS idx_scope_flags_sla_breach
  ON scope_flags (sla_deadline)
  WHERE status IN ('open', 'pending');
