-- Migration: workspace domain verification fields
-- Adds DNS TXT verification workflow columns to workspaces table.

ALTER TABLE "workspaces"
  ADD COLUMN "domain_verification_status" text DEFAULT 'pending',
  ADD COLUMN "domain_verification_token" text,
  ADD COLUMN "domain_verified_at" timestamptz,
  ADD COLUMN "domain_verification_attempted_at" timestamptz;
