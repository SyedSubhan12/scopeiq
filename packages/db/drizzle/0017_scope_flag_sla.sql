-- Migration: add SLA columns to scope_flags
-- Additive-only — no existing rows are modified, backfilled with NULL/false defaults.

ALTER TABLE "scope_flags"
  ADD COLUMN IF NOT EXISTS "sla_deadline" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sla_breached" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "idx_scope_flags_sla_breach"
  ON "scope_flags" ("sla_deadline")
  WHERE status IN ('pending', 'open');
