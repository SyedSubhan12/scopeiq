-- Migration 0012: Add version column and index to briefs table
-- Additive only migration

BEGIN;

-- Add version column to briefs
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create index on (project_id, version DESC) for efficient latest-brief lookups
CREATE INDEX IF NOT EXISTS idx_briefs_project_version ON briefs (project_id, version DESC);

COMMIT;
