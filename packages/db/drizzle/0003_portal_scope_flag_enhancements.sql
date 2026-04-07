-- Migration 0003: Portal & Scope Flag Enhancements
-- Adds hashed portal tokens, scope flag metadata, change order fields,
-- reminder log tracking, message status, approval event workspace isolation,
-- and workspace branding fields.

-- 1. Clients: add hashed portal token, token expiry, email auth flag
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token varchar(64);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token_hash varchar(64);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS requires_email_auth boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients (portal_token);

-- 2. Scope flags: add message_text, confidence, suggested_response, matching_clauses_json
ALTER TABLE scope_flags ADD COLUMN IF NOT EXISTS message_text text NOT NULL DEFAULT '';
ALTER TABLE scope_flags ADD COLUMN IF NOT EXISTS confidence double precision NOT NULL DEFAULT 0;
ALTER TABLE scope_flags ADD COLUMN IF NOT EXISTS suggested_response text;
ALTER TABLE scope_flags ADD COLUMN IF NOT EXISTS matching_clauses_json jsonb DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_scope_flags_workspace_status ON scope_flags (workspace_id, status);

-- 3. Change orders: add change order spec fields
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS work_description text;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS estimated_hours double precision;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS pricing jsonb;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS revised_timeline text;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone;
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS signed_by_name varchar(255);
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS pdf_url text;
CREATE INDEX IF NOT EXISTS idx_change_orders_scope_flag ON change_orders (scope_flag_id);

-- 4. Reminder logs: add project_id, sequence_step, delivery_status, opened_at
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS project_id uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS sequence_step integer NOT NULL DEFAULT 1;
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS delivery_status varchar(50) DEFAULT 'pending';
ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS idx_reminder_logs_project ON reminder_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_step ON reminder_logs (deliverable_id, sequence_step);

-- Fix the default project_id on existing rows (set from deliverables -> projects)
UPDATE reminder_logs
SET project_id = deliverables.project_id
FROM deliverables
WHERE reminder_logs.deliverable_id = deliverables.id
  AND reminder_logs.project_id = uuid_generate_v4();

-- Add FK constraint after backfilling
ALTER TABLE reminder_logs
  ADD CONSTRAINT reminder_logs_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 5. Messages: add status column for scope check pipeline
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'pending_check';
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status);

-- 6. Approval events: add workspace_id, event_type, timestamp for audit compliance
ALTER TABLE approval_events ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE approval_events ADD COLUMN IF NOT EXISTS event_type varchar(50) NOT NULL DEFAULT 'approval';
ALTER TABLE approval_events ADD COLUMN IF NOT EXISTS "timestamp" timestamp with time zone NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_approval_events_workspace ON approval_events (workspace_id);
CREATE INDEX IF NOT EXISTS idx_approval_events_type ON approval_events (workspace_id, event_type);

-- Fix workspace_id on existing rows (set from deliverables -> projects -> workspaces)
UPDATE approval_events
SET workspace_id = projects.workspace_id
FROM deliverables
JOIN projects ON deliverables.project_id = projects.id
WHERE approval_events.deliverable_id = deliverables.id
  AND approval_events.workspace_id = uuid_generate_v4();

-- 7. Workspaces: add branding and reminder settings
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS secondary_color varchar(7) DEFAULT '#1D9E75';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brand_font varchar(100) DEFAULT 'Inter';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS reminder_settings jsonb DEFAULT '{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}'::jsonb;

-- 8. Remove old columns from change_orders (kept for backward compat, but new columns are primary)
-- We keep 'description' and 'amount' for backward compatibility with existing data.
-- New code uses work_description, pricing, estimated_hours.
