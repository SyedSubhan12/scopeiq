-- Migration 0011: Add missing project_status_enum values
-- PostgreSQL ALTER TYPE ... ADD VALUE cannot run inside a transaction block,
-- so these statements are intentionally NOT wrapped in BEGIN/COMMIT.
-- Run this migration with: psql $DATABASE_URL -f 0011_add_project_status_enum_values.sql

-- Add missing project status values (additive only, no drops)
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'awaiting_brief';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'clarification_needed';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'brief_scored';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'deliverable_in_review';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE "project_status_enum" ADD VALUE IF NOT EXISTS 'cancelled';

-- Create brief_template_status_enum if it does not exist yet
DO $$ BEGIN
  CREATE TYPE "brief_template_status_enum" AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
