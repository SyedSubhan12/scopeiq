<!-- converted from ScopeIQ_DatabaseSchema.docx -->

ScopeIQ
Database Schema & DDL Reference
Novabots Engineering  |  v1.0  |  2026  |  Confidential
Complete DDL with indexes, constraints, RLS policies, and migration notes

# 1. Schema Overview
This document defines the complete PostgreSQL database schema for ScopeIQ. All tables use UUID primary keys, include created_at / updated_at timestamps, and support soft deletion via a deleted_at column. Multi-tenant isolation is enforced at two layers: application-level workspace_id filtering in every Drizzle query, and database-level Row-Level Security (RLS) policies.
The schema is managed via Drizzle ORM migrations in packages/db/schema/. Each domain entity has its own schema file. All column types, constraints, and indexes defined here are authoritative and must match the Drizzle schema definitions exactly.
## 1.1 Naming Conventions

# 2. Enum Definitions
All enums are defined as PostgreSQL custom types. Enums should be extended via ALTER TYPE ... ADD VALUE migrations, never recreated.
## 2.1 Project & Workflow Enums
CREATE TYPE project_status_enum AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
CREATE TYPE brief_status_enum AS ENUM ('pending_score', 'scored', 'clarification_needed', 'approved', 'rejected');
CREATE TYPE deliverable_status_enum AS ENUM ('not_started', 'in_progress', 'in_review', 'revision_requested', 'approved');
CREATE TYPE deliverable_type_enum AS ENUM ('file', 'figma', 'loom', 'youtube', 'link');
CREATE TYPE flag_severity_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE flag_status_enum AS ENUM ('pending', 'confirmed', 'dismissed', 'snoozed');
CREATE TYPE change_order_status_enum AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
CREATE TYPE clause_type_enum AS ENUM ('deliverable', 'revision_limit', 'timeline', 'exclusion', 'payment_term', 'other');
CREATE TYPE user_role_enum AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE plan_enum AS ENUM ('solo', 'studio', 'agency');
CREATE TYPE audit_action_enum AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'flag', 'send', 'dismiss');
CREATE TYPE reminder_step_enum AS ENUM ('gentle_nudge', 'deadline_warning', 'silence_approval');
CREATE TYPE message_source_enum AS ENUM ('portal', 'email_forward', 'manual_input');

# 3. Platform & Auth Tables
## 3.1 workspaces
The top-level tenant entity. Every agency or freelancer account is a workspace. All data is isolated by workspace_id.
CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces (slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_workspaces_custom_domain ON workspaces (custom_domain) WHERE custom_domain IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_workspaces_stripe ON workspaces (stripe_customer_id);
## 3.2 users
Authenticated users within a workspace. Linked to Supabase Auth via auth_uid.
CREATE UNIQUE INDEX idx_users_auth_uid ON users (auth_uid);
CREATE INDEX idx_users_workspace ON users (workspace_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email_workspace ON users (email, workspace_id) WHERE deleted_at IS NULL;
## 3.3 clients
Client contacts associated with agency projects. Clients access the portal via project-scoped tokens without needing a user account.
CREATE INDEX idx_clients_workspace ON clients (workspace_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_clients_portal_token ON clients (portal_token);

# 4. Project & Brief Tables
## 4.1 projects
Central entity linking briefs, deliverables, SOWs, and scope flags for a single client engagement.
CREATE INDEX idx_projects_workspace_status ON projects (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_client ON projects (client_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_projects_portal_token ON projects (portal_token);
## 4.2 brief_templates
Reusable intake form templates configured by the agency. Form structure stored as JSON schema.
CREATE INDEX idx_brief_templates_workspace ON brief_templates (workspace_id) WHERE deleted_at IS NULL;
## 4.3 briefs
Submitted client briefs with AI-generated clarity scores. Supports multiple versions per project.
CREATE INDEX idx_briefs_project ON briefs (project_id);
CREATE UNIQUE INDEX idx_briefs_project_version ON briefs (project_id, version);
## 4.4 brief_fields
Individual field responses within a submitted brief. AI flags stored per field.
CREATE INDEX idx_brief_fields_brief ON brief_fields (brief_id);
CREATE INDEX idx_brief_fields_flagged ON brief_fields (brief_id) WHERE ai_flag = true;

# 5. Approval Portal Tables
## 5.1 deliverables
Creative work uploaded by the agency for client review. Supports multiple file types and embedded links.
CREATE INDEX idx_deliverables_project ON deliverables (project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deliverables_status ON deliverables (project_id, status) WHERE deleted_at IS NULL;
## 5.2 feedback_items
Client feedback on deliverables. Supports point-anchored annotations on images/PDFs with threaded replies.
CREATE INDEX idx_feedback_deliverable ON feedback_items (deliverable_id);
CREATE INDEX idx_feedback_unresolved ON feedback_items (deliverable_id) WHERE is_resolved = false;
## 5.3 approval_events
Audit trail for all approval-related actions: submissions, approvals, rejections, reminders.
-- event_type values: 'submitted', 'approved', 'revision_requested', 'reminder_sent', 'silence_approved'
CREATE INDEX idx_approval_events_deliverable ON approval_events (deliverable_id);
## 5.4 reminder_logs
Track automated approval reminder sequences sent to clients.
CREATE INDEX idx_reminder_logs_deliverable ON reminder_logs (deliverable_id);

# 6. Scope Guard Tables
## 6.1 statements_of_work
Uploaded SOW documents parsed by AI into structured clauses.
-- status values: 'parsing', 'parsed', 'active', 'superseded'
CREATE INDEX idx_sow_project ON statements_of_work (project_id);
## 6.2 sow_clauses
Individual parsed clauses from a SOW. Each clause becomes a scope boundary for real-time monitoring.
CREATE INDEX idx_sow_clauses_sow ON sow_clauses (sow_id);
CREATE INDEX idx_sow_clauses_active ON sow_clauses (sow_id) WHERE is_active = true;
## 6.3 scope_flags
AI-detected out-of-scope requests. Each flag references the original message and the SOW clause it violates.
CREATE INDEX idx_scope_flags_project ON scope_flags (project_id);
CREATE INDEX idx_scope_flags_pending ON scope_flags (project_id) WHERE status = 'pending';
CREATE INDEX idx_scope_flags_confidence ON scope_flags (project_id, confidence DESC);
## 6.4 change_orders
Generated change orders for confirmed out-of-scope work. Accepted COs automatically update SOW scope.
CREATE INDEX idx_change_orders_project ON change_orders (project_id);
CREATE INDEX idx_change_orders_status ON change_orders (project_id, status);

# 7. Platform Support Tables
## 7.1 rate_card_items
Agency rate card entries used for auto-pricing change orders.
CREATE INDEX idx_rate_card_workspace ON rate_card_items (workspace_id);
## 7.2 audit_log
Immutable audit trail for all significant actions across the platform. Written within the same transaction as the action it records.
CREATE INDEX idx_audit_log_workspace ON audit_log (workspace_id);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_log_created ON audit_log (workspace_id, created_at DESC);

# 8. Row-Level Security Policies
All tables with a workspace_id column have RLS enabled. Policies bind queries to the authenticated user's workspace. These are enforced at the database layer in addition to application-layer workspace_id filtering in every Drizzle query (defense in depth).
-- Enable RLS on all tenant-scoped tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Standard workspace isolation policy (applied to all tables above)
CREATE POLICY workspace_isolation ON projects
USING (workspace_id = (SELECT workspace_id FROM users WHERE auth_uid = auth.uid()));

For tables without a direct workspace_id (e.g., briefs, feedback_items), RLS is enforced through JOIN-based policies that traverse the project relationship to reach workspace_id.
-- Example: Brief isolation through project -> workspace chain
CREATE POLICY brief_workspace_isolation ON briefs
USING (project_id IN (SELECT id FROM projects WHERE workspace_id =
(SELECT workspace_id FROM users WHERE auth_uid = auth.uid())));

# 9. Migration & Maintenance Notes
All migrations are generated via Drizzle Kit (drizzle-kit generate) and stored in packages/db/migrations/. Migrations are applied in order during deployment. Never manually edit generated migration files.
Key migration rules: (1) Adding columns should always include a DEFAULT value to avoid breaking existing rows. (2) Enum extensions use ALTER TYPE ... ADD VALUE and cannot be rolled back in PostgreSQL. (3) Index creation should use CONCURRENTLY in production to avoid table locks. (4) The audit_log table is append-only and should never have UPDATE or DELETE operations.
Backup policy: Supabase provides daily automated backups with point-in-time recovery. Manual backup verification is required every Friday per SOP-05.
| Convention | Pattern | Example |
| --- | --- | --- |
| Tables | snake_case, plural | scope_flags, change_orders |
| Columns | snake_case | workspace_id, clarity_score |
| Primary keys | id (UUID v7) | id UUID DEFAULT gen_ulid() |
| Foreign keys | {entity}_id | project_id, sow_id |
| Timestamps | created_at, updated_at | TIMESTAMPTZ DEFAULT NOW() |
| Soft delete | deleted_at | TIMESTAMPTZ NULL |
| Enums | snake_case_enum | project_status_enum |
| Indexes | idx_{table}_{columns} | idx_projects_workspace_status |
| RLS Policies | policy_{table}_{action} | policy_projects_select |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Unique workspace identifier |
| name | VARCHAR(255) | NOT NULL | Agency or freelancer display name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL slug for portal subdomain |
| plan | plan_enum | NOT NULL DEFAULT 'solo' | Current subscription plan |
| stripe_customer_id | VARCHAR(255) | UNIQUE | Stripe customer reference |
| stripe_subscription_id | VARCHAR(255) | UNIQUE | Stripe subscription reference |
| logo_url | TEXT | NULL | Agency logo URL in R2 storage |
| brand_color | VARCHAR(7) | DEFAULT '#0F6E56' | Hex color for client portal |
| custom_domain | VARCHAR(255) | UNIQUE, NULL | Custom domain for portal |
| settings_json | JSONB | DEFAULT '{}' | Feature flags, thresholds, defaults |
| onboarding_progress | JSONB | DEFAULT '{}' | Onboarding checklist state |
| features | JSONB | DEFAULT '{}' | Plan-gated feature flags |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete timestamp |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Internal user ID |
| auth_uid | UUID | UNIQUE, NOT NULL | Supabase Auth user ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation key |
| email | VARCHAR(255) | NOT NULL | User email address |
| full_name | VARCHAR(255) | NULL | Display name |
| role | user_role_enum | NOT NULL DEFAULT 'member' | Permission level in workspace |
| avatar_url | TEXT | NULL | Profile image URL |
| last_login_at | TIMESTAMPTZ | NULL | Last login timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Client record ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation key |
| name | VARCHAR(255) | NOT NULL | Client company or individual name |
| email | VARCHAR(255) | NOT NULL | Primary contact email |
| portal_token | VARCHAR(64) | UNIQUE, NOT NULL | Secure token for portal access |
| phone | VARCHAR(50) | NULL | Contact phone number |
| company | VARCHAR(255) | NULL | Client company name |
| notes | TEXT | NULL | Internal notes about this client |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Project ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation |
| client_id | UUID | FK -> clients.id, NOT NULL | Associated client |
| name | VARCHAR(255) | NOT NULL | Project display name |
| status | project_status_enum | NOT NULL DEFAULT 'draft' | Current project status |
| sow_id | UUID | FK -> statements_of_work.id, NULL | Linked SOW (if uploaded) |
| portal_token | VARCHAR(64) | UNIQUE, NOT NULL | Project-scoped portal access |
| budget | DECIMAL(12,2) | NULL | Total project budget |
| start_date | DATE | NULL | Project start date |
| end_date | DATE | NULL | Target completion date |
| revision_limit | INTEGER | DEFAULT 3 | Max revision rounds per deliverable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Template ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation |
| name | VARCHAR(255) | NOT NULL | Template display name |
| project_type | VARCHAR(100) | NULL | Service category tag |
| fields_json | JSONB | NOT NULL DEFAULT '[]' | Ordered array of field definitions |
| clarity_threshold | INTEGER | DEFAULT 70, CHECK 50-90 | Min score before auto-hold |
| is_published | BOOLEAN | DEFAULT false | Whether form is live for clients |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Brief ID |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| template_id | UUID | FK -> brief_templates.id, NULL | Source template |
| version | INTEGER | NOT NULL DEFAULT 1 | Auto-increment per project |
| status | brief_status_enum | NOT NULL DEFAULT 'pending_score' | Processing state |
| clarity_score | INTEGER | NULL, CHECK 0-100 | AI-generated quality score |
| submitted_by_email | VARCHAR(255) | NULL | Client email who submitted |
| source_domain | VARCHAR(255) | NULL | Domain where form was embedded |
| submitted_at | TIMESTAMPTZ | DEFAULT NOW() | Submission timestamp |
| scored_at | TIMESTAMPTZ | NULL | When AI scoring completed |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Field response ID |
| brief_id | UUID | FK -> briefs.id, NOT NULL | Parent brief submission |
| field_key | VARCHAR(100) | NOT NULL | Field identifier from template |
| field_label | VARCHAR(255) | NOT NULL | Human-readable field label |
| value | TEXT | NULL | Client response value |
| file_url | TEXT | NULL | Uploaded file URL (for file fields) |
| ai_flag | BOOLEAN | DEFAULT false | Whether AI flagged this field |
| ai_flag_reason | TEXT | NULL | AI explanation of ambiguity |
| ai_flag_severity | flag_severity_enum | NULL | Flag severity level |
| ai_suggested_question | TEXT | NULL | AI-generated clarification question |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Deliverable ID |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| title | VARCHAR(255) | NOT NULL | Deliverable display name |
| description | TEXT | NULL | Internal description or notes |
| type | deliverable_type_enum | NOT NULL DEFAULT 'file' | Content type category |
| file_url | TEXT | NULL | R2 storage URL for uploaded files |
| file_name | VARCHAR(255) | NULL | Original filename |
| file_size_bytes | BIGINT | NULL | File size in bytes |
| file_mime_type | VARCHAR(100) | NULL | MIME type of uploaded file |
| embed_url | TEXT | NULL | URL for Figma/Loom/YouTube embeds |
| status | deliverable_status_enum | NOT NULL DEFAULT 'not_started' | Review status |
| revision_round | INTEGER | NOT NULL DEFAULT 0 | Current revision counter |
| sort_order | INTEGER | DEFAULT 0 | Display ordering within project |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Feedback item ID |
| deliverable_id | UUID | FK -> deliverables.id, NOT NULL | Target deliverable |
| parent_id | UUID | FK -> feedback_items.id, NULL | Parent for threaded replies |
| author_type | VARCHAR(20) | NOT NULL CHECK ('client','agency') | Who authored this feedback |
| author_email | VARCHAR(255) | NULL | Author email for attribution |
| content | TEXT | NOT NULL, CHECK length >= 3 | Feedback text content |
| x_pos | DECIMAL(5,2) | NULL | Horizontal pin position (% of width) |
| y_pos | DECIMAL(5,2) | NULL | Vertical pin position (% of height) |
| page_number | INTEGER | NULL | PDF page number for annotation |
| pin_number | INTEGER | NULL | Sequential pin number on deliverable |
| is_resolved | BOOLEAN | DEFAULT false | Whether agency resolved this item |
| resolved_at | TIMESTAMPTZ | NULL | Resolution timestamp |
| resolved_by | UUID | FK -> users.id, NULL | User who resolved |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Event ID |
| deliverable_id | UUID | FK -> deliverables.id, NOT NULL | Related deliverable |
| event_type | VARCHAR(50) | NOT NULL | Event classification |
| actor_id | UUID | NULL | User who triggered (null for system) |
| actor_type | VARCHAR(20) | NOT NULL CHECK ('client','agency','system') | Actor classification |
| metadata_json | JSONB | DEFAULT '{}' | Event-specific data payload |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Reminder log ID |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| deliverable_id | UUID | FK -> deliverables.id, NOT NULL | Target deliverable |
| sequence_step | reminder_step_enum | NOT NULL | Which reminder in sequence |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | When reminder was sent |
| delivery_status | VARCHAR(20) | DEFAULT 'sent' | Email delivery status |
| resend_message_id | VARCHAR(255) | NULL | Resend API message ID |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | SOW ID |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| raw_text | TEXT | NOT NULL | Full extracted text from document |
| source_file_url | TEXT | NULL | Original uploaded file URL in R2 |
| source_file_name | VARCHAR(255) | NULL | Original filename |
| status | VARCHAR(20) | DEFAULT 'parsing' | Processing state |
| parsed_at | TIMESTAMPTZ | NULL | When AI parsing completed |
| activated_at | TIMESTAMPTZ | NULL | When agency confirmed clauses |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Clause ID |
| sow_id | UUID | FK -> statements_of_work.id, NOT NULL | Parent SOW |
| clause_type | clause_type_enum | NOT NULL | Classification of clause |
| content | TEXT | NOT NULL | Clause text content |
| section_reference | VARCHAR(50) | NULL | Original section number |
| is_active | BOOLEAN | DEFAULT true | Whether clause is enforced |
| sort_order | INTEGER | DEFAULT 0 | Display ordering |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Flag ID |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| sow_clause_id | UUID | FK -> sow_clauses.id, NULL | Matching SOW clause |
| message_text | TEXT | NOT NULL | Original client message that triggered flag |
| message_source | message_source_enum | NOT NULL | How message was ingested |
| confidence | DECIMAL(3,2) | NOT NULL, CHECK 0-1 | AI confidence score (0.00-1.00) |
| severity | flag_severity_enum | NOT NULL | Flag urgency level |
| status | flag_status_enum | NOT NULL DEFAULT 'pending' | Current flag state |
| ai_suggested_response | TEXT | NULL | AI-drafted response to client |
| dismiss_reason | TEXT | NULL | Agency note when marking in-scope |
| snoozed_until | TIMESTAMPTZ | NULL | Snooze expiry timestamp |
| actioned_by | UUID | FK -> users.id, NULL | User who acted on flag |
| actioned_at | TIMESTAMPTZ | NULL | When action was taken |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Change order ID |
| scope_flag_id | UUID | FK -> scope_flags.id, NOT NULL | Originating scope flag |
| project_id | UUID | FK -> projects.id, NOT NULL | Parent project |
| title | VARCHAR(255) | NOT NULL | Change order title |
| work_description | TEXT | NOT NULL | Description of additional work |
| estimated_hours | DECIMAL(6,2) | NULL | Estimated hours of work |
| price | DECIMAL(12,2) | NOT NULL | Total price for change order |
| revised_timeline | TEXT | NULL | Impact on project timeline |
| status | change_order_status_enum | NOT NULL DEFAULT 'draft' | Current CO state |
| sent_at | TIMESTAMPTZ | NULL | When sent to client |
| signed_at | TIMESTAMPTZ | NULL | Client acceptance timestamp |
| signer_name | VARCHAR(255) | NULL | Typed client name as signature |
| declined_at | TIMESTAMPTZ | NULL | Client decline timestamp |
| decline_reason | TEXT | NULL | Client reason for declining |
| pdf_url | TEXT | NULL | Generated PDF URL in R2 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Rate card item ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation |
| service_type | VARCHAR(100) | NOT NULL | Service category name |
| description | TEXT | NULL | Service description |
| hourly_rate | DECIMAL(10,2) | NOT NULL | Rate per hour |
| unit | VARCHAR(50) | DEFAULT 'hour' | Billing unit |
| is_default | BOOLEAN | DEFAULT false | Default rate for uncategorized work |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last modification |
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, DEFAULT gen_ulid() | Audit log entry ID |
| workspace_id | UUID | FK -> workspaces.id, NOT NULL | Tenant isolation |
| actor_id | UUID | NULL | User who performed action |
| actor_type | VARCHAR(20) | NOT NULL DEFAULT 'user' | Actor classification |
| entity_type | VARCHAR(50) | NOT NULL | Target entity table name |
| entity_id | UUID | NOT NULL | Target entity ID |
| action | audit_action_enum | NOT NULL | Action performed |
| metadata_json | JSONB | DEFAULT '{}' | Action-specific context data |
| ip_address | INET | NULL | Request IP address |
| user_agent | TEXT | NULL | Request user agent |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |