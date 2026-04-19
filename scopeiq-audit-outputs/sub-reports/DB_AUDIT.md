# AGENT-DB: Database Schema Audit
**Date:** 2026-04-10 | **Scope:** `packages/db/`

## Schema Completeness

### Core Platform — ✅ All tables exist
- `workspaces` — all required columns + extras (slug, brand tokens, custom domain, reminderSettings)
- `users` — all required columns + extras (authUid, avatarUrl, userType, lastLoginAt)
- `clients` — all required columns + extras (portalTokenHash for hashed storage)
- `projects` — all required columns + portalToken, portalEnabled

### Brief Builder
| Table | Status | Missing Columns |
|---|---|---|
| `brief_templates` | ✅ EXISTS | `project_type` absent (replaced by `description` + `status`) |
| `briefs` | ✅ EXISTS | Uses `scopeScore` vs spec's `clarity_score` (naming only) |
| `brief_fields` | ⚠️ PARTIAL | **Missing `ai_flag` (bool) and `ai_flag_reason` (text)** |

### Approval Portal
| Table | Status | Missing Columns |
|---|---|---|
| `deliverables` | ✅ EXISTS | Complete + extras |
| `feedback_items` | ⚠️ PARTIAL | Missing `author_type` enum; `x_pos`/`y_pos` stored in JSON blob (not queryable) |
| `approval_events` | ⚠️ PARTIAL | `eventType` is varchar(50) not enum |
| `reminder_logs` | ✅ EXISTS | Complete |

### Scope Guard
| Table | Status | Missing Columns |
|---|---|---|
| `statements_of_work` | ⚠️ PARTIAL | Missing `raw_text` (full text) and `status` columns |
| `sow_clauses` | ⚠️ PARTIAL | Missing `is_active` boolean |
| `scope_flags` | ✅ EXISTS | All required columns |
| `change_orders` | ✅ EXISTS | Uses `pricing` (jsonb) vs scalar `price` — better design |

### Platform
- `audit_log` ✅ — all columns + actorType, ipAddress, userAgent
- `rate_card_items` ✅ — `rateInCents` (int, avoids float) instead of `hourly_rate`

## Enum Audit — ✅ All 16 required enums exist
Including: project_status, brief_status, deliverable_status, deliverable_type, flag_severity, flag_status, change_order_status, clause_type, user_role, plan, audit_action, reminder_step, message_source, message_status

**⚠️ Schema/Migration Drift:**
- `deliverable_status_enum`: migration creates `(not_started, in_progress, in_review, revision_requested, approved)` but schema declares `(draft, delivered, in_review, changes_requested, approved)` — **no ALTER TYPE migration**
- `flag_status_enum`: missing `change_order_sent` and `resolved` values in initial migration
- `message_status_enum`: not created in any tracked migration

## Index Audit
| Required Index | Status | Notes |
|---|---|---|
| `briefs(project_id, status)` | ⚠️ PARTIAL | Separate indexes on each column |
| `scope_flags(project_id, status, created_at DESC)` | ❌ MISSING | Will cause sequential scans on large datasets |
| `deliverables(project_id, status)` | ⚠️ PARTIAL | Separate indexes |
| `audit_log(workspace_id, entity_type, entity_id)` | ⚠️ PARTIAL | Separate indexes |
| `portal_token` unique | ✅ EXISTS | `idx_projects_portal_token` unique |

## Migration Audit — 🔴 CRITICAL

14 migration files exist (0000–0013) but **only 10 are tracked in `_journal.json`**.

**Untracked migrations (will NOT run with `drizzle-kit migrate`):**
- `0003_portal_scope_flag_enhancements.sql`
- `0007_change_order_scope_items.sql`
- **`0008_rls_policies.sql` ← RLS POLICIES**
- `0009_feedback_page_number.sql`
- `0010_feedback_parent_id.sql`

**Impact:** Row-Level Security policies are almost certainly NOT applied to the production database, meaning any authenticated user can read/write data from any workspace.

## RLS Policy Audit

`0008_rls_policies.sql` covers 19 tables correctly — **but this migration is not in the journal.**

**Missing RLS even in the migration:**
- `users` table — no workspace_isolation policy (**cross-workspace user enumeration possible**)
- `workspaces` table — no policy
- `brief_template_versions` — no policy
- `brief_clarification_requests` / `brief_clarification_items` — no policy
- `deliverable_revisions` — no policy
- Portal token RLS policy too permissive: `USING (portal_token IS NOT NULL)` allows reading ALL clients with any token

## Audit Helper — ✅ PASS
`packages/db/src/audit.ts` — correctly accepts transaction context, atomically writes with operation
