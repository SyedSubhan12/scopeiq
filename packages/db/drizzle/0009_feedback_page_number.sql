-- Migration 0009: Add page_number column to feedback_items
-- Supports PDF annotation tracking per the spec requirement

ALTER TABLE feedback_items ADD COLUMN IF NOT EXISTS page_number integer;
