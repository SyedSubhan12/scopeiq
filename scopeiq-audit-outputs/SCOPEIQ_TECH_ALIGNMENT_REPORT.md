# ScopeIQ — Tech Docs Alignment Report
Generated: 2026-04-17

Local note: the available local tech docs define 13 explicit feature IDs and a 19-table data model. This report scores alignment against those local docs, not the generic 40-feature prompt template.

## Alignment Score
| Area | Score | Status |
|------|-------|--------|
| Architecture Structure | 8/10 | 🟡 Partial |
| Data Model | 8/10 | 🟡 Partial |
| Engineering Rules (7 Rules) | 4/7 | 🟡 Partial |
| AI Pipeline Implementation | 3/10 | 🔴 Misaligned |
| Performance SLA Readiness | 5/10 | 🟡 Partial |
| **Overall** | **28/50** | **🟡 Partial** |

---

## 1. Architecture Alignment
### ✅ Aligned
- Expected monorepo structure exists: `apps/web`, `apps/api`, `apps/ai`, `packages/db`, `packages/ui`, `packages/config`, `packages/types`
- Hono API is mounted from `apps/api/src/index.ts:1-122`
- FastAPI AI service exists in `apps/ai/app/main.py:46-93`
- BullMQ queue dispatch exists for brief scoring, scope check, SOW parse, change order generation, reminders, and scope alert jobs
- Presigned upload helper exists in `apps/api/src/lib/storage.ts:72-96`
- RLS migration exists for domain tables in `packages/db/drizzle/0008_rls_policies.sql:28-268`

### ⚠️ Deviations
- **AI provider mismatch:** Tech docs specify Claude; AI service is built on Gemini (`apps/ai/app/gemini_client.py:1-10`, `apps/ai/app/config.py:4-7`) [Severity: HIGH]
- **Broken AI worker tier:** `score_brief_worker.py` and `generate_change_order_worker.py` do not compile, so the nominal web/api/ai split is not operational for two P0 pipelines [Severity: HIGH]
- **Direct synchronous AI path:** Portal brief intake calls `/v1/ai/predict-clarity` directly instead of dispatching through BullMQ (`apps/web/src/components/portal/IntakeForm.tsx:291-307`, `apps/api/src/routes/ai.route.ts:11-21`) [Severity: HIGH]
- **Reminder queue split-brain:** startup runs `jobs/send-reminder` on queue `reminders`, while the implemented reminder service uses `approval-reminders` (`apps/api/src/index.ts:112-119`, `apps/api/src/jobs/send-reminder.job.ts:6-7`, `apps/api/src/services/reminder.service.ts:21-25`) [Severity: HIGH]
- **Public embed architecture diverges from doc:** public brief submit endpoint is deprecated with `410`, so the embeddable/public form architecture is not present (`apps/api/src/routes/brief-submit.route.ts:6-20`) [Severity: MED]

---

## 2. Data Model Alignment
### Missing Tables
| Expected Table | Found | Missing Columns | RLS Policy |
|----------------|-------|-----------------|------------|
| workspaces | Y | DNS/domain verification fields not found | Y |
| users | Y | soft-delete not verified from this audit slice | via join pattern |
| clients | Y | none material | Y |
| projects | Y | none material | Y |
| brief_templates | Y | none material | Y |
| briefs | Y | none material | Y |
| brief_fields | Y | no workspace_id column; linked by brief_id | Y |
| deliverables | Y | none material | Y |
| feedback_items | Y | no deleted_at; no explicit thread route layer | Y |
| approval_events | Y | no deleted_at | Y |
| reminder_logs | Y | no workspace_id column | Y |
| statements_of_work | Y | `status` missing | Y |
| sow_clauses | Y | no normalized revision-limit/timeline/payment fields | Y |
| scope_flags | Y | schema lacks worker-written `source` / `metadata` fields | Y |
| change_orders | Y | no normalized `price` scalar; uses `pricing` JSON | Y |
| audit_log | Y | read-only RLS only | Y |
| rate_card_items | Y | none material | Y |
| messages | Y | none material | Y |
| invitations | Y | extra table beyond doc summary | Y |

### Schema Deviations
- `statements_of_work` has `parsedAt` but no `status`, so the documented `draft -> parsed -> active` lifecycle is not modeled in schema (`packages/db/src/schema/statements-of-work.schema.ts:4-19`)
- `sow_clauses` stores generic `original_text` and `summary`; extracted revision limits and milestones are not normalized (`packages/db/src/schema/sow-clauses.schema.ts:5-15`)
- `reminder_logs` lacks `workspace_id`, relying on deliverable linkage plus RLS join policy (`packages/db/src/schema/reminder-logs.schema.ts:6-22`, `0008_rls_policies.sql:140-152`)
- `feedback_items` supports `parent_id`, but no route/service surface exposes threaded replies
- `scope_flags` schema and AI worker insert payload disagree: worker writes `source` and `metadata`, schema defines `message_text`, `matching_clauses_json`, `evidence` (`scope-flags.schema.ts:15-24`, `scope_guard_worker.py:124-147`)

---

## 3. Engineering Rules Compliance

| Rule | Description | Status | Evidence |
|------|-------------|--------|----------|
| Rule 1 | TypeScript strict mode | ✅ | `packages/config/tsconfig.base.json:3-14` |
| Rule 2 | Drizzle-only DB access | ❌ | Python workers use raw SQL via `asyncpg` / `conn.fetch` and `conn.execute` in `apps/ai/app/workers/score_brief_worker.py:27-35`, `scope_guard_worker.py:56-68`, `124-147` |
| Rule 3 | AI via gateway only | ❌ | Portal calls `/v1/ai/predict-clarity` synchronously; API proxies directly to FastAPI in `apps/web/src/components/portal/IntakeForm.tsx:291-307`, `apps/api/src/routes/ai.route.ts:11-21` |
| Rule 4 | Presigned URL uploads | ✅ | Deliverable and SOW uploads request presigned URLs then upload directly to storage (`deliverable.service.ts:125-147`, `sow.route.ts:173-181`) |
| Rule 5 | No client-side secrets | ✅ | Only `NEXT_PUBLIC_*` env vars plus `NODE_ENV` were found in `apps/web/src`; no server secrets leaked |
| Rule 6 | Audit log on mutations | ❌ | Many services comply, but `resend-webhook.route.ts:82-103` inserts `messages` directly without `writeAuditLog()` |
| Rule 7 | Tests for P0 features | ❌ | P0 unit/E2E coverage exists for some flows, but several P0 features have no direct unit coverage or no runnable selector alignment; AP-001, AP-005, SG-001 are clear gaps |

---

## 4. AI Pipeline Alignment
### Brief Scoring Pipeline
Expected pipeline from docs:
1. Submit brief
2. API dispatches BullMQ job
3. FastAPI worker calls Claude tool-use
4. Results stored and pushed to dashboard
5. Low score triggers hold + email

Implemented comparison:
- Dispatch exists: `apps/api/src/jobs/score-brief.job.ts:7-28`
- Callback exists: `apps/api/src/routes/ai-callback.route.ts:392-540`
- Low-score clarification email exists: `ai-callback.route.ts:490-538`
- Realtime dashboard UI exists, but no direct evidence of a scoring-specific subscription channel
- Mismatch 1: provider is Gemini, not Claude
- Mismatch 2: `score_brief_worker.py` does not compile (`py_compile` fails at line 104)
- Mismatch 3: worker hardcodes hold threshold 60, doc requires workspace-configurable threshold default 70
- Mismatch 4: portal clarity helper bypasses queue entirely through `/v1/ai/predict-clarity`

### Scope Flag Detection Pipeline
Expected pipeline from docs:
1. Ingest portal/email/manual message
2. Dispatch BullMQ scope-check job
3. FastAPI worker compares message to active SOW
4. Create scope flag when confidence > 0.6
5. Push realtime update
6. Email if unviewed for 2 hours

Implemented comparison:
- Message ingest routes exist for portal/manual/email webhook: `message-ingest.route.ts`, `resend-webhook.route.ts`
- Queue dispatch exists: `check-scope.job.ts:11-59`
- Callback path creates flags and delayed alert jobs: `ai-callback.route.ts:225-304`
- Realtime UI invalidation exists: `useRealtimeScopeFlags.ts:22-37`
- Mismatch 1: worker still uses Gemini
- Mismatch 2: worker runtime will fail because `asyncpg` and `uuid4` are undefined
- Mismatch 3: worker uses `0.30` threshold while callback uses `> 0.60`
- Mismatch 4: 2-hour alert job checks only `pending` status, not whether the flag was viewed

---

## 5. Performance SLA Readiness
- **AI brief scoring < 10s p95:** weak readiness. Workers use 30s timeouts (`score_brief_worker.py:70-81`), not 10s. No queue priority or measurement loop for p95 exists.
- **Scope flag detection < 5s p95:** partial readiness. Code defines `SLA_LATENCY_MS = 5000` and records latency in worker evidence (`scope_guard_worker.py:21`, `122-145`), but the worker is runtime-broken and threshold handling is inconsistent.
- **API response < 300ms p95:** partial readiness. There are useful indexes in schema files and some paginated endpoints, but no cache layer, no query timing enforcement, and some raw aggregate SQL in routes.
- **File upload progress:** aligned. Deliverables and SOW uploads use presigned URLs, and web UI tracks progress (`apps/web/src/hooks/useDeliverables.ts`, `components/scope-guard/SowUploader.tsx`, `components/approval/DeliverableUploader.tsx`).
- **Reminder/alert async processing:** misaligned. Queue and worker wiring defects mean background SLA behavior cannot be trusted even where code exists.
