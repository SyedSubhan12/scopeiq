-- Migration 0013: Add clarity_threshold and convert status to enum on brief_templates
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction, so this migration
-- is intentionally NOT wrapped in BEGIN/COMMIT.
-- Run this migration against a quiescent database (no concurrent writes to brief_templates).

-- Add clarity_threshold column
ALTER TABLE brief_templates ADD COLUMN IF NOT EXISTS clarity_threshold INTEGER NOT NULL DEFAULT 70;

-- Add the new enum-typed column (type was created in migration 0011)
ALTER TABLE brief_templates ADD COLUMN IF NOT EXISTS status_new brief_template_status_enum NOT NULL DEFAULT 'draft';

-- Copy data from old varchar status column
UPDATE brief_templates SET status_new = status::brief_template_status_enum
  WHERE status IN ('draft', 'published', 'archived');

-- Drop the old varchar column
ALTER TABLE brief_templates DROP COLUMN IF EXISTS status;

-- Rename new column to status
ALTER TABLE brief_templates RENAME COLUMN status_new TO status;

-- Add check constraint
ALTER TABLE brief_templates ADD CONSTRAINT brief_templates_status_check
  CHECK (status IN ('draft', 'published', 'archived'));
