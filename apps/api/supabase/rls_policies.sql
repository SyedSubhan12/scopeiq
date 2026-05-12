-- =============================================================================
-- ScopeIQ — Row-Level Security Policies
-- Generated: 2026-05-01
--
-- USAGE: Apply against the Supabase project using the SQL editor or
--   supabase db push / psql -f rls_policies.sql
--
-- DESIGN NOTES:
--   • All workspace-scoped tables use a helper join through `users` to map
--     auth.uid() → workspace_id.  No workspace_members junction table exists
--     in this schema; `users.auth_uid` is the Supabase auth identity column.
--   • The `audit_log` table is append-only for the application.  Authenticated
--     users may SELECT their own workspace rows; INSERT is allowed from the
--     service-role (app backend).  UPDATE/DELETE are denied for everyone.
--   • The `reminder_logs` table has no direct workspace_id column; it joins
--     through `deliverables` → workspace_id.  The policy reflects that join.
--   • The `sow_clauses` table has no workspace_id; access is granted when the
--     parent SOW belongs to the user's workspace.
--   • `project_intelligence` uses text PKs (not uuid FKs), so the policy joins
--     on text equality rather than a typed FK.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Convenience function: returns the workspace_id of the calling user.
-- Used by every workspace-scoped policy below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.workspace_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT workspace_id
  FROM   public.users
  WHERE  auth_uid = auth.uid()
  LIMIT  1
$$;

-- =============================================================================
-- TABLE: workspaces
-- =============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- A user may read only their own workspace.
CREATE POLICY "workspaces_select_own"
  ON public.workspaces FOR SELECT
  USING (id = auth.workspace_id());

-- Only the service-role (backend) may INSERT new workspaces.
-- Regular users go through the auth flow; they never INSERT directly.
CREATE POLICY "workspaces_insert_service_role"
  ON public.workspaces FOR INSERT
  WITH CHECK (false);   -- blocked for authenticated users; backend uses service key

-- Only workspace members may UPDATE their own workspace.
CREATE POLICY "workspaces_update_own"
  ON public.workspaces FOR UPDATE
  USING (id = auth.workspace_id())
  WITH CHECK (id = auth.workspace_id());

-- Soft-delete only; hard DELETE is blocked at RLS level.
CREATE POLICY "workspaces_delete_denied"
  ON public.workspaces FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: users
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users may read all members of their own workspace (needed for member lists).
CREATE POLICY "users_select_own_workspace"
  ON public.users FOR SELECT
  USING (workspace_id = auth.workspace_id());

-- Service-role handles INSERT (user-sync after Supabase auth signup).
CREATE POLICY "users_insert_service_role"
  ON public.users FOR INSERT
  WITH CHECK (false);

-- Users may only update their own row.
CREATE POLICY "users_update_own_row"
  ON public.users FOR UPDATE
  USING (auth_uid = auth.uid())
  WITH CHECK (auth_uid = auth.uid());

CREATE POLICY "users_delete_denied"
  ON public.users FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: clients
-- =============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_own_workspace"
  ON public.clients FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "clients_insert_own_workspace"
  ON public.clients FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "clients_update_own_workspace"
  ON public.clients FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

-- Soft-delete via deleted_at; block hard DELETE.
CREATE POLICY "clients_delete_denied"
  ON public.clients FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: projects
-- =============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own_workspace"
  ON public.projects FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "projects_insert_own_workspace"
  ON public.projects FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "projects_update_own_workspace"
  ON public.projects FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "projects_delete_denied"
  ON public.projects FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: briefs
-- =============================================================================
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefs_select_own_workspace"
  ON public.briefs FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "briefs_insert_own_workspace"
  ON public.briefs FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "briefs_update_own_workspace"
  ON public.briefs FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "briefs_delete_denied"
  ON public.briefs FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_versions
-- =============================================================================
ALTER TABLE public.brief_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_versions_select_own_workspace"
  ON public.brief_versions FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "brief_versions_insert_own_workspace"
  ON public.brief_versions FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_versions_update_own_workspace"
  ON public.brief_versions FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_versions_delete_denied"
  ON public.brief_versions FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_templates
-- =============================================================================
ALTER TABLE public.brief_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_templates_select_own_workspace"
  ON public.brief_templates FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "brief_templates_insert_own_workspace"
  ON public.brief_templates FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_templates_update_own_workspace"
  ON public.brief_templates FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_templates_delete_denied"
  ON public.brief_templates FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_template_versions
-- =============================================================================
ALTER TABLE public.brief_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_template_versions_select_own_workspace"
  ON public.brief_template_versions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM public.brief_templates WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_template_versions_insert_own_workspace"
  ON public.brief_template_versions FOR INSERT
  WITH CHECK (
    template_id IN (
      SELECT id FROM public.brief_templates WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_template_versions_update_own_workspace"
  ON public.brief_template_versions FOR UPDATE
  USING (
    template_id IN (
      SELECT id FROM public.brief_templates WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_template_versions_delete_denied"
  ON public.brief_template_versions FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_fields
-- =============================================================================
ALTER TABLE public.brief_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_fields_select_own_workspace"
  ON public.brief_fields FOR SELECT
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_fields_insert_own_workspace"
  ON public.brief_fields FOR INSERT
  WITH CHECK (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_fields_update_own_workspace"
  ON public.brief_fields FOR UPDATE
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_fields_delete_denied"
  ON public.brief_fields FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_attachments
-- =============================================================================
ALTER TABLE public.brief_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_attachments_select_own_workspace"
  ON public.brief_attachments FOR SELECT
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_attachments_insert_own_workspace"
  ON public.brief_attachments FOR INSERT
  WITH CHECK (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_attachments_update_own_workspace"
  ON public.brief_attachments FOR UPDATE
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_attachments_delete_denied"
  ON public.brief_attachments FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_clarification_requests
-- =============================================================================
ALTER TABLE public.brief_clarification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_clarification_requests_select_own_workspace"
  ON public.brief_clarification_requests FOR SELECT
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_clarification_requests_insert_own_workspace"
  ON public.brief_clarification_requests FOR INSERT
  WITH CHECK (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_clarification_requests_update_own_workspace"
  ON public.brief_clarification_requests FOR UPDATE
  USING (
    brief_id IN (
      SELECT id FROM public.briefs WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_clarification_requests_delete_denied"
  ON public.brief_clarification_requests FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_clarification_items
-- =============================================================================
ALTER TABLE public.brief_clarification_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_clarification_items_select_own_workspace"
  ON public.brief_clarification_items FOR SELECT
  USING (
    request_id IN (
      SELECT bcr.id
      FROM   public.brief_clarification_requests bcr
      JOIN   public.briefs b ON b.id = bcr.brief_id
      WHERE  b.workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_clarification_items_insert_own_workspace"
  ON public.brief_clarification_items FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT bcr.id
      FROM   public.brief_clarification_requests bcr
      JOIN   public.briefs b ON b.id = bcr.brief_id
      WHERE  b.workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "brief_clarification_items_delete_denied"
  ON public.brief_clarification_items FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: brief_embeds
-- =============================================================================
ALTER TABLE public.brief_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brief_embeds_select_own_workspace"
  ON public.brief_embeds FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "brief_embeds_insert_own_workspace"
  ON public.brief_embeds FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_embeds_update_own_workspace"
  ON public.brief_embeds FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "brief_embeds_delete_denied"
  ON public.brief_embeds FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: statements_of_work
-- =============================================================================
ALTER TABLE public.statements_of_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sow_select_own_workspace"
  ON public.statements_of_work FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "sow_insert_own_workspace"
  ON public.statements_of_work FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "sow_update_own_workspace"
  ON public.statements_of_work FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "sow_delete_denied"
  ON public.statements_of_work FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: sow_clauses
-- No direct workspace_id — access scoped through parent SOW.
-- =============================================================================
ALTER TABLE public.sow_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sow_clauses_select_own_workspace"
  ON public.sow_clauses FOR SELECT
  USING (
    sow_id IN (
      SELECT id FROM public.statements_of_work WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "sow_clauses_insert_own_workspace"
  ON public.sow_clauses FOR INSERT
  WITH CHECK (
    sow_id IN (
      SELECT id FROM public.statements_of_work WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "sow_clauses_update_own_workspace"
  ON public.sow_clauses FOR UPDATE
  USING (
    sow_id IN (
      SELECT id FROM public.statements_of_work WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "sow_clauses_delete_denied"
  ON public.sow_clauses FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: deliverables
-- =============================================================================
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverables_select_own_workspace"
  ON public.deliverables FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "deliverables_insert_own_workspace"
  ON public.deliverables FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "deliverables_update_own_workspace"
  ON public.deliverables FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "deliverables_delete_denied"
  ON public.deliverables FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: deliverable_revisions
-- No direct workspace_id — scoped through parent deliverable.
-- =============================================================================
ALTER TABLE public.deliverable_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverable_revisions_select_own_workspace"
  ON public.deliverable_revisions FOR SELECT
  USING (
    deliverable_id IN (
      SELECT id FROM public.deliverables WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "deliverable_revisions_insert_own_workspace"
  ON public.deliverable_revisions FOR INSERT
  WITH CHECK (
    deliverable_id IN (
      SELECT id FROM public.deliverables WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "deliverable_revisions_update_own_workspace"
  ON public.deliverable_revisions FOR UPDATE
  USING (
    deliverable_id IN (
      SELECT id FROM public.deliverables WHERE workspace_id = auth.workspace_id()
    )
  );

CREATE POLICY "deliverable_revisions_delete_denied"
  ON public.deliverable_revisions FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: scope_flags
-- =============================================================================
ALTER TABLE public.scope_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scope_flags_select_own_workspace"
  ON public.scope_flags FOR SELECT
  USING (workspace_id = auth.workspace_id());

-- Backend service-role inserts scope flags; deny direct INSERT from clients.
CREATE POLICY "scope_flags_insert_service_role_only"
  ON public.scope_flags FOR INSERT
  WITH CHECK (false);

-- Agency users may UPDATE (status changes, snooze) via the API (service key).
CREATE POLICY "scope_flags_update_own_workspace"
  ON public.scope_flags FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "scope_flags_delete_denied"
  ON public.scope_flags FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: change_orders
-- =============================================================================
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change_orders_select_own_workspace"
  ON public.change_orders FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "change_orders_insert_own_workspace"
  ON public.change_orders FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "change_orders_update_own_workspace"
  ON public.change_orders FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "change_orders_delete_denied"
  ON public.change_orders FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: messages
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own_workspace"
  ON public.messages FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "messages_insert_own_workspace"
  ON public.messages FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "messages_update_own_workspace"
  ON public.messages FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "messages_delete_denied"
  ON public.messages FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: feedback_items
-- =============================================================================
ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_items_select_own_workspace"
  ON public.feedback_items FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "feedback_items_insert_own_workspace"
  ON public.feedback_items FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "feedback_items_update_own_workspace"
  ON public.feedback_items FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "feedback_items_delete_denied"
  ON public.feedback_items FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: invitations
-- =============================================================================
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select_own_workspace"
  ON public.invitations FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "invitations_insert_own_workspace"
  ON public.invitations FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

-- Allow update (accept) when the row's email matches the calling user's email.
CREATE POLICY "invitations_update_accept_or_admin"
  ON public.invitations FOR UPDATE
  USING (
    workspace_id = auth.workspace_id()
    OR email = (SELECT email FROM public.users WHERE auth_uid = auth.uid() LIMIT 1)
  );

CREATE POLICY "invitations_delete_own_workspace"
  ON public.invitations FOR DELETE
  USING (workspace_id = auth.workspace_id());

-- =============================================================================
-- TABLE: rate_card_items
-- =============================================================================
ALTER TABLE public.rate_card_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_card_items_select_own_workspace"
  ON public.rate_card_items FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "rate_card_items_insert_own_workspace"
  ON public.rate_card_items FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "rate_card_items_update_own_workspace"
  ON public.rate_card_items FOR UPDATE
  USING (workspace_id = auth.workspace_id())
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "rate_card_items_delete_own_workspace"
  ON public.rate_card_items FOR DELETE
  USING (workspace_id = auth.workspace_id());

-- =============================================================================
-- TABLE: approval_events
-- workspace_id present — events are read-only after insert (immutable log).
-- =============================================================================
ALTER TABLE public.approval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_events_select_own_workspace"
  ON public.approval_events FOR SELECT
  USING (workspace_id = auth.workspace_id());

-- Service-role inserts; block direct INSERT from browser clients.
CREATE POLICY "approval_events_insert_service_role_only"
  ON public.approval_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "approval_events_update_denied"
  ON public.approval_events FOR UPDATE
  USING (false);

CREATE POLICY "approval_events_delete_denied"
  ON public.approval_events FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: audit_log
-- Append-only.  Users may SELECT; INSERT/UPDATE/DELETE locked to service-role.
-- =============================================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_own_workspace"
  ON public.audit_log FOR SELECT
  USING (workspace_id = auth.workspace_id());

-- Only the backend (service-role key) may write audit log entries.
CREATE POLICY "audit_log_insert_denied_for_users"
  ON public.audit_log FOR INSERT
  WITH CHECK (false);

CREATE POLICY "audit_log_update_denied"
  ON public.audit_log FOR UPDATE
  USING (false);

CREATE POLICY "audit_log_delete_denied"
  ON public.audit_log FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: reminder_logs
-- No direct workspace_id — scoped through deliverables.
-- =============================================================================
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_logs_select_own_workspace"
  ON public.reminder_logs FOR SELECT
  USING (
    deliverable_id IN (
      SELECT id FROM public.deliverables WHERE workspace_id = auth.workspace_id()
    )
  );

-- Service-role inserts reminder logs; block direct INSERT.
CREATE POLICY "reminder_logs_insert_service_role_only"
  ON public.reminder_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "reminder_logs_update_denied"
  ON public.reminder_logs FOR UPDATE
  USING (false);

CREATE POLICY "reminder_logs_delete_denied"
  ON public.reminder_logs FOR DELETE
  USING (false);

-- =============================================================================
-- TABLE: marketplace_installs
-- =============================================================================
ALTER TABLE public.marketplace_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_installs_select_own_workspace"
  ON public.marketplace_installs FOR SELECT
  USING (workspace_id = auth.workspace_id());

CREATE POLICY "marketplace_installs_insert_own_workspace"
  ON public.marketplace_installs FOR INSERT
  WITH CHECK (workspace_id = auth.workspace_id());

CREATE POLICY "marketplace_installs_delete_own_workspace"
  ON public.marketplace_installs FOR DELETE
  USING (workspace_id = auth.workspace_id());

-- =============================================================================
-- TABLE: project_intelligence
-- Uses text columns (not uuid FKs). Authenticated users read; service-role writes.
-- =============================================================================
ALTER TABLE public.project_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_intelligence_select_own_workspace"
  ON public.project_intelligence FOR SELECT
  USING (workspace_id = (auth.workspace_id())::text);

-- Only service-role may write intelligence events.
CREATE POLICY "project_intelligence_insert_service_role_only"
  ON public.project_intelligence FOR INSERT
  WITH CHECK (false);

CREATE POLICY "project_intelligence_update_denied"
  ON public.project_intelligence FOR UPDATE
  USING (false);

CREATE POLICY "project_intelligence_delete_denied"
  ON public.project_intelligence FOR DELETE
  USING (false);

-- =============================================================================
-- TABLES WITH NO DIRECT USER OWNERSHIP (recommendations)
-- =============================================================================
-- The following tables have no direct auth identity column.  They are owned
-- implicitly through parent joins.  RLS is enabled and policies are defined
-- above via sub-selects.  If you later need a more permissive policy for any
-- of these (e.g. Realtime subscriptions), add a SELECT policy that checks
-- the parent workspace.
--
--   sow_clauses            → via statements_of_work.workspace_id
--   brief_fields           → via briefs.workspace_id
--   brief_attachments      → via briefs.workspace_id
--   brief_clarification_*  → via briefs.workspace_id
--   brief_template_versions → via brief_templates.workspace_id
--   deliverable_revisions  → via deliverables.workspace_id
--   reminder_logs          → via deliverables.workspace_id
--   project_intelligence   → workspace_id stored as text (policy uses cast)
-- =============================================================================
