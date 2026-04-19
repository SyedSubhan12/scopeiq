-- Migration: add workspace AI policy columns
-- Lane K: workspace admins configure AI behavior per workspace

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS brief_score_threshold  integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS scope_guard_threshold  text    NOT NULL DEFAULT '0.60',
  ADD COLUMN IF NOT EXISTS auto_hold_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_approve_after_days integer NOT NULL DEFAULT 3;
