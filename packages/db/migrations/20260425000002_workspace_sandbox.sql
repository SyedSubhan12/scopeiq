-- Add a comment to workspaces.settings_json documenting the sandbox structure
-- (settings_json is already JSONB, no column change needed)
-- This migration is a no-op DDL; it documents the sandbox schema for future reference
-- Actual sandbox data is written by the seeder at workspace creation time

COMMENT ON COLUMN workspaces.settings_json IS
'JSON settings. Sandbox fields: sandbox_mode (bool), demo_client_id (text), demo_project_id (text), sandbox_expires_at (ISO timestamp)';
