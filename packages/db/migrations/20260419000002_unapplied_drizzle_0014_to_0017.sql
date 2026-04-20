-- Migration: apply drizzle migrations 0014-0017 that were never registered in the journal
-- These files exist in packages/db/drizzle/ but the _journal.json only tracks through 0013,
-- so they have never been applied to the database.
--
-- Run this file directly against Postgres once to resolve:
--   - column "domain_verification_status" does not exist  (workspaces)
--   - column "sla_deadline" does not exist                (scope_flags)
--
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).

-- ============================================================
-- 0014_sow_status
-- Adds lifecycle status column to statements_of_work
-- ============================================================

ALTER TABLE statements_of_work
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Back-fill: SOWs that have already been parsed should be marked 'parsed'.
UPDATE statements_of_work
  SET status = 'parsed'
  WHERE parsed_at IS NOT NULL
    AND deleted_at IS NULL
    AND status = 'draft';

-- ============================================================
-- 0015_workspace_domain_verification
-- Adds DNS TXT verification workflow columns to workspaces
-- ============================================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS domain_verification_status          text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS domain_verification_token           text,
  ADD COLUMN IF NOT EXISTS domain_verified_at                  timestamptz,
  ADD COLUMN IF NOT EXISTS domain_verification_attempted_at    timestamptz;

-- ============================================================
-- 0016_workspace_ai_policy
-- Adds workspace-level AI/automation policy columns
-- ============================================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS brief_score_threshold       integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS scope_guard_threshold       text    NOT NULL DEFAULT '0.60',
  ADD COLUMN IF NOT EXISTS auto_hold_enabled           boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_approve_after_days     integer NOT NULL DEFAULT 3;

-- ============================================================
-- 0017_scope_flag_sla
-- Adds SLA deadline and breach-tracking columns to scope_flags
-- ============================================================

ALTER TABLE scope_flags
  ADD COLUMN IF NOT EXISTS sla_deadline  timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached  boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_scope_flags_sla_breach
  ON scope_flags (sla_deadline)
  WHERE status IN ('pending', 'confirmed', 'snoozed');
