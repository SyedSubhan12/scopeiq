-- Migration: 20260425000004_sow_clause_confidence
-- Adds graduated confidence fields to sow_clauses for multi-pass SOW parsing.

ALTER TABLE sow_clauses
  ADD COLUMN IF NOT EXISTS confidence_score REAL,
  ADD COLUMN IF NOT EXISTS confidence_level TEXT,
  ADD COLUMN IF NOT EXISTS raw_text_source TEXT,
  ADD COLUMN IF NOT EXISTS page_number INTEGER,
  ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sow_clauses_review
  ON sow_clauses(requires_human_review)
  WHERE requires_human_review = TRUE;
