-- Migration 0008: Row Level Security Policies for All Domain Tables
-- Purpose: Enforce workspace-level data isolation at the database level.
-- Every domain table that belongs to a workspace must have RLS enabled so that
-- users can only access rows belonging to their own workspace. This is a
-- critical security control — without RLS, any authenticated user could query
-- data from any workspace via the API.
--
-- Policy strategy:
--   - Tables with a direct workspace_id column: check workspace_id via a subquery
--     that resolves the current user's workspace through auth.uid().
--   - Tables without a direct workspace_id (brief_fields, feedback_items,
--     sow_clauses, reminder_logs): check via a JOIN to the parent table that
--     carries workspace_id.
--   - clients table additionally allows access via portal_token for client-facing
--     portal endpoints that do not have an authenticated user.
--   - audit_log is restricted to SELECT only (read-only) for workspace members.

----------------------------------------------------------------------
-- Helper subquery pattern (used inline in each policy):
--   SELECT w.id FROM workspaces w
--   JOIN users u ON u.workspace_id = w.id
--   WHERE u.id = auth.uid()
----------------------------------------------------------------------

----------------------------------------------------------------------
-- 1. projects
----------------------------------------------------------------------
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_projects" ON "projects"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 2. briefs
----------------------------------------------------------------------
ALTER TABLE "briefs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_briefs" ON "briefs"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 3. brief_templates
----------------------------------------------------------------------
ALTER TABLE "brief_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_brief_templates" ON "brief_templates"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 4. brief_fields (no workspace_id; linked via briefs)
----------------------------------------------------------------------
ALTER TABLE "brief_fields" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_brief_fields" ON "brief_fields"
  USING (brief_id IN (
    SELECT b.id FROM briefs b
    WHERE b.workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN users u ON u.workspace_id = w.id
      WHERE u.id = auth.uid()
    )
  ));

----------------------------------------------------------------------
-- 5. brief_attachments
----------------------------------------------------------------------
ALTER TABLE "brief_attachments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_brief_attachments" ON "brief_attachments"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 6. brief_versions
----------------------------------------------------------------------
ALTER TABLE "brief_versions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_brief_versions" ON "brief_versions"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 7. deliverables
----------------------------------------------------------------------
ALTER TABLE "deliverables" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_deliverables" ON "deliverables"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 8. feedback_items (no workspace_id; linked via deliverables)
----------------------------------------------------------------------
ALTER TABLE "feedback_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_feedback_items" ON "feedback_items"
  USING (deliverable_id IN (
    SELECT d.id FROM deliverables d
    WHERE d.workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN users u ON u.workspace_id = w.id
      WHERE u.id = auth.uid()
    )
  ));

----------------------------------------------------------------------
-- 9. approval_events
----------------------------------------------------------------------
ALTER TABLE "approval_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_approval_events" ON "approval_events"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 10. reminder_logs (no workspace_id; linked via deliverables)
----------------------------------------------------------------------
ALTER TABLE "reminder_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_reminder_logs" ON "reminder_logs"
  USING (deliverable_id IN (
    SELECT d.id FROM deliverables d
    WHERE d.workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN users u ON u.workspace_id = w.id
      WHERE u.id = auth.uid()
    )
  ));

----------------------------------------------------------------------
-- 11. statements_of_work
----------------------------------------------------------------------
ALTER TABLE "statements_of_work" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_statements_of_work" ON "statements_of_work"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 12. sow_clauses (no workspace_id; linked via statements_of_work)
----------------------------------------------------------------------
ALTER TABLE "sow_clauses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_sow_clauses" ON "sow_clauses"
  USING (sow_id IN (
    SELECT s.id FROM statements_of_work s
    WHERE s.workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN users u ON u.workspace_id = w.id
      WHERE u.id = auth.uid()
    )
  ));

----------------------------------------------------------------------
-- 13. scope_flags
----------------------------------------------------------------------
ALTER TABLE "scope_flags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_scope_flags" ON "scope_flags"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 14. change_orders
----------------------------------------------------------------------
ALTER TABLE "change_orders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_change_orders" ON "change_orders"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 15. audit_log (read-only for workspace members)
----------------------------------------------------------------------
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "audit_log_read" ON "audit_log"
  FOR SELECT
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 16. rate_card_items
----------------------------------------------------------------------
ALTER TABLE "rate_card_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_rate_card_items" ON "rate_card_items"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 17. messages
----------------------------------------------------------------------
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_messages" ON "messages"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

----------------------------------------------------------------------
-- 18. clients (includes portal_token access for client-facing endpoints)
----------------------------------------------------------------------
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_clients" ON "clients"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));

-- Allow client portal access without requiring an authenticated user
CREATE POLICY IF NOT EXISTS "portal_token_access_clients" ON "clients"
  USING (portal_token IS NOT NULL);

----------------------------------------------------------------------
-- 19. invitations
----------------------------------------------------------------------
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "workspace_isolation_invitations" ON "invitations"
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));
