# ScopeIQ — Feature Implementation Map
Generated: 2026-04-17
Codebase Ref: 73c6008b69dc8ff8aa477c5cd65fe6ce479a446a

Local note: `tech_docs/Novabots_ScopeIQ_FeatureBreakdown.docx` defines 13 explicit `FEAT-*` IDs. This audit only scores those documented IDs to avoid inventing missing specs.

## Implementation Summary
| Status | Count | % of Total |
|--------|-------|------------|
| ✅ Complete | 0 | 0% |
| 🟡 Partial | 13 | 100% |
| 🔴 Stub Only | 0 | 0% |
| ⬜ Not Started | 0 | 0% |
| ❓ Unverifiable | 0 | 0% |
| **Total Audited (documented IDs)** | 13 | 100% |

---

## Module 1: Brief Builder

### FEAT-BB-001 — Custom Form Builder [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/brief-templates.schema.ts:5-20` — `brief_templates.fields_json`, `branding_json`, `status`, `clarity_threshold` found
- API Route: `apps/api/src/routes/brief-template.route.ts:15-92` — CRUD, versions, publish, restore found
- Service: `apps/api/src/services/brief-template.service.ts:52-261` — create/update/publish/version restore/audit found
- Frontend: `apps/web/src/components/brief/FormBuilder.tsx:145-253`, `apps/web/src/components/brief/FormPreview.tsx:33-165`
- Unit Tests: found — `apps/api/src/routes/brief-template.route.test.ts`, `apps/web/src/components/brief/form-builder.utils.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/brief-builder-stack.spec.ts`

**Implemented Business Logic:**
- Drag reorder updates `order` with `arrayMove(...)` in `FormBuilder.tsx:163-176`
- Six field types render in preview: text, textarea, single_choice, multi_choice, date, file_upload in `FormPreview.tsx:78-157`
- Conditional logic supports `equals`, `not_equals`, `contains` in `FormPreview.tsx:12-31` and `brief.service.ts:77-100`
- Publish blocks empty templates in `brief-template.service.ts:153-156`
- Publish snapshots immutable template versions in `brief-template.service.ts:158-197`
- Audit logging exists for create/update/publish/restore/delete in `brief-template.service.ts:79-85`, `123-130`, `181-192`, `229-240`, `251-258`

**Missing vs. Acceptance Criteria:**
- No evidence of debounced 500ms autosave from builder UI; mutations are explicit hook calls, not background save
- No evidence of iframe embed code generation
- No evidence of mobile-specific drag handling validation beyond generic DnD kit usage
- No evidence that published forms resolve at `portal.scopeiq.com/{workspace}/{template_id}`; actual portal flow is token/project oriented

---

### FEAT-BB-002 — AI Brief Clarity Scorer [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/briefs.schema.ts:19-28` — `scope_score`, `scoring_result_json`, `scored_at` found
- API Route: `apps/api/src/routes/ai.route.ts:8-21`, `apps/api/src/routes/ai-callback.route.ts:392-540`
- Service: `apps/api/src/jobs/score-brief.job.ts:4-29`, `apps/api/src/services/brief-scoring-worker.service.ts:21-115`
- AI Worker: `apps/ai/app/services/brief_scorer.py`, `apps/ai/app/workers/score_brief_worker.py:16-160`
- Frontend: `apps/web/src/app/(portal)/portal/[portalToken]/page.tsx:508-576`, `apps/web/src/components/brief/BriefScoreCard.tsx`, `apps/web/src/components/brief/BriefFlagCard.tsx`
- Unit Tests: found — `apps/api/src/services/brief.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/brief-flow.spec.ts`, `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Portal input triggers synchronous clarity prediction via `/v1/ai/predict-clarity` once text length exceeds 20 chars in `IntakeForm.tsx:277-320`
- Queue dispatch prefetches brief fields in `score-brief.job.ts:7-28`
- Callback writes `scope_score`, `scoring_result_json`, and project status in `ai-callback.route.ts:418-487`
- Prompt/service enforce at least 3 flags when score `< 70` in `apps/ai/app/services/brief_scorer.py:113-123`

**Missing vs. Acceptance Criteria:**
- AI provider is Gemini, not Claude tool-use mode from the tech docs
- Worker file is syntactically broken: `apps/ai/app/workers/score_brief_worker.py:104`
- Direct `/v1/ai/predict-clarity` route bypasses BullMQ for portal clarity checks
- Results persist on `briefs.scoring_result_json`, not `brief_fields` as stated in the Feature Breakdown
- No evidence of durable flag history beyond overwritten JSON blob on the brief

---

### FEAT-BB-003 — Auto-Hold Flow for Low-Score Briefs [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/enums.ts`, `packages/db/src/schema/briefs.schema.ts:19-28`, `packages/db/src/schema/brief-clarification-requests.schema.ts`, `packages/db/src/schema/brief-clarification-items.schema.ts`
- API Route: `apps/api/src/routes/ai-callback.route.ts:490-538`, `apps/api/src/routes/portal-session.route.ts`
- Service: `apps/api/src/services/brief.service.ts:361-410`, `520-617`, `652-1088`, `apps/api/src/services/clarification-email.service.ts`
- Frontend: `apps/web/src/components/portal/BriefHoldState.tsx`, `apps/web/src/app/(portal)/portal/[portalToken]/page.tsx:535-541`
- Unit Tests: found — `apps/api/src/services/brief.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- AI callback dispatches clarification email when `status === "clarification_needed"` and flags exist in `ai-callback.route.ts:491-538`
- Review actions write audit logs in `brief.service.ts:397-408`
- Clarification requests/items are created and re-submissions versioned in `brief.service.ts:520-617`, `652-1088`
- Portal renders hold/clarification state from brief status in `portal/[portalToken]/page.tsx:535-541`

**Missing vs. Acceptance Criteria:**
- Feature doc requires threshold from workspace settings default 70/range 50-90; worker hardcodes 60 in `score_brief_worker.py:94-95`
- No evidence that workspace or template `clarity_threshold` is used in the scoring outcome
- No explicit manual override button path found in the portal/dashboard UI audit sample
- Email dispatch is best-effort async after transaction, not guaranteed within a bounded SLA

---

### FEAT-BB-004 — Embeddable Brief Form [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/brief-templates.schema.ts:15-18`
- API Route: `apps/api/src/routes/brief-submit.route.ts:6-20`, `apps/api/src/routes/portal-session.route.ts`
- Service: secure portal brief submission and draft save live in `brief.service.ts` and `portal-session.route.ts`
- Frontend: `apps/web/src/components/portal/IntakeForm.tsx`, `apps/web/src/app/(portal)/[portalToken]/brief/page.tsx`
- Unit Tests: found — `apps/api/src/routes/portal-brief-submit.route.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Legacy public submit endpoint is hard-disabled with `410` in `brief-submit.route.ts:6-20`
- Portal draft save and secure submit run under portal token auth in `IntakeForm.tsx:228-275` and `portal-session.route.ts`
- Public rate limiting exists at `10 submissions / hour` only on the deprecated endpoint in `brief-submit.route.ts:9-11`

**Missing vs. Acceptance Criteria:**
- Feature doc expects iframe snippet/direct link for public embedding; current public route is deprecated
- No evidence of CORS strategy for third-party embedding
- No evidence of external-domain attribution analytics for embedded submissions
- Current implementation requires a project-scoped portal token, which conflicts with no-account embeddable submission

---

### FEAT-BB-005 — Brief Version History with Diff [P1]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/brief-versions.schema.ts`, `packages/db/src/schema/briefs.schema.ts:15`
- API Route: `apps/api/src/routes/brief.route.ts`
- Service: `apps/api/src/services/brief.service.ts:265-295`, `324-359`, `386-395`
- Frontend: `apps/web/src/components/briefs/submissions/BriefVersionHistory.tsx`, `template-version-compare-panel.tsx`, `submission-review-view.tsx`
- Unit Tests: found — `apps/api/src/services/brief.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/brief-flow.spec.ts`

**Implemented Business Logic:**
- Version snapshots are created via `createBriefVersionSnapshot(...)` in `brief.service.ts:265-295`
- Current brief and stored versions are merged for history view in `brief.service.ts:324-359`
- Latest version is updated when review status changes in `brief.service.ts:386-395`

**Missing vs. Acceptance Criteria:**
- No evidence of server or client route to restore a historical brief version
- No evidence of PDF export for brief diffs
- No evidence of explicit diff coloring implementation in the audited files
- Performance target `diff loads within 1 second` is unverified

---

## Module 2: Approval Portal

### FEAT-AP-001 — White-Label Portal Configuration [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/workspaces.schema.ts:11-16` — `logo_url`, `brand_color`, `custom_domain` found
- API Route: `apps/api/src/routes/workspace.route.ts`, `apps/api/src/routes/portal-session.route.ts:81-92`
- Service: `apps/api/src/services/workspace.service.ts`
- Frontend: `apps/web/src/components/portal/PortalHeader.tsx:161-169`, portal layout/pages under `apps/web/src/app/(portal)/`
- Unit Tests: NOT FOUND
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Portal branding uses workspace/template logo and brand color in `portal-session.route.ts:255-260`
- Portal CSS variables are generated server-side in `apps/web/src/app/(portal)/[portalToken]/layout.tsx`
- “Powered by ScopeIQ” hides only when a brand color exists in `PortalHeader.tsx:161-169`

**Missing vs. Acceptance Criteria:**
- No Cloudflare subdomain provisioning, DNS verification polling, or SSL automation code found
- No plan-gated “hide ScopeIQ branding” enforcement beyond simple brand-color presence
- No custom domain activation workflow or status tracking found
- No screenshot-based branding regression test found

---

### FEAT-AP-002 — Multi-Format Deliverable Delivery [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/deliverables.schema.ts:21-38`
- API Route: `apps/api/src/routes/deliverable.route.ts:42-122`
- Service: `apps/api/src/services/deliverable.service.ts:29-216`
- Frontend: `apps/web/src/components/approval/DeliverableList.tsx`, `DeliverableUploader.tsx`, `DeliverableViewer.tsx`
- Unit Tests: found — `apps/api/src/services/__tests__/deliverable.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Deliverables support `file | figma | loom | youtube | link` in schema/service `deliverables.schema.ts:23`, `deliverable.service.ts:49`
- Presigned upload URLs enforce 500MB max and MIME allowlist in `deliverable.service.ts:125-147` and `storage.ts:9-24`
- Confirm upload creates a revision record and marks deliverable `delivered` in `deliverable.service.ts:168-185`
- Viewer supports Figma, Loom, YouTube embed parsing in `apps/web/src/components/approval/DeliverableViewer.tsx`

**Missing vs. Acceptance Criteria:**
- No evidence of Figma/Loom/YouTube oEmbed metadata fetch; embeds are URL-derived only
- `confirmUpload()` increments revision version from `revisionRound`, not revision table count, which can desync file versions
- Deliverable ready email links to `/portal/deliverables/{id}`, but API routes are mounted at `/portal/deliverables` and portal pages use tokenized paths
- Reminder sequence is not triggered when a deliverable enters review

---

### FEAT-AP-003 — Point-Anchored Annotation [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/feedback-items.schema.ts:8-20` — `annotation_json`, `page_number`, `parent_id`
- API Route: `apps/api/src/routes/feedback.route.ts:32-70`, `apps/api/src/routes/portal-deliverable.route.ts:47-76`
- Service: `apps/api/src/services/feedback.service.ts:13-124`
- Frontend: `apps/web/src/components/approval/AnnotationCanvas.tsx:23-121`, `FeedbackPanel.tsx`, `PortalDeliverableView.tsx`
- Unit Tests: found — `apps/api/src/services/__tests__/feedback.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Pins are stored as percentage coordinates and rounded to 2 decimals in `AnnotationCanvas.tsx:34-44`
- Resolved pins are visually hidden/faded in `AnnotationCanvas.tsx:94-100`
- Portal and agency feedback submission both persist `annotationJson` and optional `pageNumber` in `feedback.service.ts:35-43`
- Feedback submission dispatches AI summary and scope-check jobs in `feedback.service.ts:61-66`

**Missing vs. Acceptance Criteria:**
- Schema supports `parent_id`, but routes/services expose no reply/thread API
- No 3-character minimum validation in the service; only route schema governs body shape
- No evidence that resolved pins are hidden only from clients while preserved for agency history
- No evidence of explicit multi-page PDF navigation logic in the annotation API

---

### FEAT-AP-004 — Revision Round Tracker [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/deliverables.schema.ts:30-31`, `packages/db/src/schema/sow-clauses.schema.ts:5-15`
- API Route: `apps/api/src/routes/deliverable.route.ts:124-178`, `apps/api/src/routes/portal-change-order.route.ts:31-69`
- Service: `apps/api/src/services/deliverable.service.ts:259-398`, `apps/api/src/services/change-order.service.ts:76-200`
- Frontend: `apps/web/src/components/approval/RevisionCounter.tsx:9-47`, `RevisionLimitModal.tsx`, `PortalDeliverableView.tsx`
- Unit Tests: found — `apps/api/src/services/__tests__/deliverable.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`

**Implemented Business Logic:**
- Counter color states follow green `<=50%`, amber `<=80%`, red `>80%` in `RevisionCounter.tsx:9-18`
- Revision requests increment `revisionRound` in `deliverable.service.ts:271-301`
- At-limit message is enforced on revision requests in `deliverable.service.ts:271-275`
- Change-order acceptance can update `deliverables.maxRevisions` in `change-order.service.ts:148-162`
- Supabase real-time invalidation exists for approval events in `useRealtimeApprovalEvents.ts:17-33`

**Missing vs. Acceptance Criteria:**
- Feature doc says revision limit comes from parsed `sow_clauses`; current source of truth is `deliverables.maxRevisions`
- Counter does not update on every client feedback submission; it only increments on explicit `requestRevision` / decline actions
- No evidence of mandatory acknowledgment before dismissing at-limit modal in runtime code
- E2E selectors expect `data-testid="revision-counter"` / `at-limit-modal`, but the audited components do not expose those selectors

---

### FEAT-AP-005 — Automated Approval Reminder Sequence [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/reminder-logs.schema.ts:6-22`, `packages/db/src/schema/approval-events.schema.ts:5-20`
- API Route: `apps/api/src/routes/email-approval.route.ts:17-219`
- Service: `apps/api/src/services/reminder.service.ts:11-266`
- Jobs: `apps/api/src/jobs/send-reminder.job.ts:12-76`
- Frontend: reminder settings pages/components under `apps/web/src/app/(dashboard)/settings/reminders/page.tsx`, `components/approval/ReminderSettings.tsx`
- Unit Tests: NOT FOUND
- E2E Tests: NOT FOUND

**Implemented Business Logic:**
- Default sequence is 48h, 72h, 48h in `reminder.service.ts:11-17`
- Silence auto-approval occurs 48h after final reminder in `reminder.service.ts:17`, `177-189`, `197-237`
- HMAC email approve/decline links exist in `email-approval.route.ts:17-55`
- Reminder logs and audit writes happen in `reminder.service.ts:123-155`

**Missing vs. Acceptance Criteria:**
- `scheduleReminderSequence()` is never invoked anywhere in `apps/api/src`
- Startup launches `jobs/send-reminder.startReminderWorker()` on queue `reminders`, but service uses queue `approval-reminders`; the queues do not match
- Feature doc requires hourly threshold scan; `processReminders()` in `send-reminder.job.ts:45-47` is a stub returning `scheduled_jobs_only`
- No evidence of Outlook/Gmail rendering validation or project timeline UI for full sequence logs

---

## Module 3: Scope Guard

### FEAT-SG-001 — SOW Ingestion & AI Parsing [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/statements-of-work.schema.ts:4-19`, `packages/db/src/schema/sow-clauses.schema.ts:5-15`
- API Route: `apps/api/src/routes/sow.route.ts:61-250`, `apps/api/src/routes/ai-callback.route.ts:135-195`
- Service: `apps/api/src/services/sow.service.ts:31-498`
- AI Worker: `apps/ai/app/workers/parse_sow_worker.py:11-67`, `apps/ai/app/services/sow_parser.py`
- Frontend: `apps/web/src/components/scope-guard/SowUploader.tsx`, `SowClauseEditor.tsx`
- Unit Tests: NOT FOUND
- E2E Tests: NOT FOUND

**Implemented Business Logic:**
- Raw text SOW creation creates placeholder `other` clauses before async parsing in `sow.service.ts:66-83`
- Parse callback deletes placeholders, inserts typed clauses, marks `parsedAt`, and audits in `ai-callback.route.ts:155-194`
- Activation replaces clauses and writes audit metadata in `sow.service.ts:199-235`
- Presigned upload flow exists for SOW files in `sow.route.ts:173-250`

**Missing vs. Acceptance Criteria:**
- `statements_of_work` has no `status` column, so the documented `active` state machine is not represented
- PDF upload path dispatches parse jobs with empty `raw_text` in `sow.service.ts:167-170` and `sow.route.ts:246-248`; the worker skips when `raw_text` is empty in `parse_sow_worker.py:18-24`
- No evidence of PyMuPDF extraction from uploaded PDFs
- Clause editor stores generic text and summary only; extracted revision limits, milestones, exclusions, and payment terms are not normalized into typed columns

---

### FEAT-SG-002 — Real-Time Scope Flag Detection [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/scope-flags.schema.ts:8-39`, `packages/db/src/schema/messages.schema.ts`
- API Route: `apps/api/src/routes/message-ingest.route.ts:26-123`, `apps/api/src/routes/resend-webhook.route.ts:37-114`, `apps/api/src/routes/ai-callback.route.ts:197-305`
- Service: `apps/api/src/services/message.service.ts:5-60`, `apps/api/src/services/scope-flag.service.ts:19-68`, `scope-flag-alert.service.ts:23-107`
- AI Worker: `apps/ai/app/workers/scope_guard_worker.py:15-199`
- Frontend: `apps/web/src/components/scope-guard/ScopeFlagCard.tsx`, `ScopeFlagDetail.tsx`, `hooks/useRealtimeScopeFlags.ts`
- Unit Tests: found — `apps/api/src/services/__tests__/scope-flag.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/scope-flag-flow.spec.ts`

**Implemented Business Logic:**
- Message ingestion supports portal, email forward, and manual input in `message-ingest.route.ts:9-123`
- Callback creates scope flags only when `confidence > 0.60` in `ai-callback.route.ts:228-257`
- 2-hour delayed alert dispatch exists in `ai-callback.route.ts:296-303` and `scope-flag-alert.job.ts:10-23`
- Realtime dashboard invalidation is wired via Supabase `scope_flags` subscription in `useRealtimeScopeFlags.ts:22-37`
- UI supports confirm, dismiss, snooze, and soft-ask actions in `ScopeFlagCard.tsx:110-179`

**Missing vs. Acceptance Criteria:**
- Worker runtime is broken: `asyncpg` and `uuid4` are referenced but never imported in `scope_guard_worker.py:34-35`, `117`
- Worker inserts columns `source` and `metadata` not present in `scope_flags` schema in `scope_guard_worker.py:124-147`
- Detection thresholds conflict: worker uses `0.30` minimum, callback uses `0.60`
- Email alert checks only `status === pending`; it does not verify “not viewed within 2 hours”

---

### FEAT-SG-003 — One-Click Change Order Generator [P0]
**Status:** 🟡 PARTIAL
**Code Evidence:**
- Schema: `packages/db/src/schema/change-orders.schema.ts:7-40`
- API Route: `apps/api/src/routes/change-order.route.ts:16-58`, `apps/api/src/routes/portal-change-order.route.ts:41-97`, `apps/api/src/routes/ai-callback.route.ts:307-390`
- Service: `apps/api/src/services/change-order.service.ts:22-301`, `apps/api/src/jobs/generate-change-order.job.ts:20-146`
- AI Worker: `apps/ai/app/workers/generate_change_order_worker.py:129-323`
- Frontend: `apps/web/src/components/scope-guard/ChangeOrderEditor.tsx`, `ChangeOrderList.tsx`, `portal/ChangeOrderView.tsx`
- Unit Tests: found — `apps/api/src/services/__tests__/change-order.service.test.ts`
- E2E Tests: found — `apps/web/tests/e2e/client-portal-flow.spec.ts`, `scope-flag-flow.spec.ts`

**Implemented Business Logic:**
- Confirming a scope flag dispatches change-order generation in `scope-flag.service.ts:61-65`
- Job prefetches scope flag, SOW clauses, and rate card items in `generate-change-order.job.ts:24-145`
- Portal acceptance updates change order, optional deliverable revision limit, linked scope flag, and audit log atomically in `change-order.service.ts:76-200`
- Email send on status `sent` or `accepted` exists in `change-order.service.ts:258-293`

**Missing vs. Acceptance Criteria:**
- AI worker is syntactically broken; `py_compile` fails with unterminated triple-quoted string at `generate_change_order_worker.py:268`
- No evidence that accepted change orders reliably update SOW scope, because `scopeItemsJson` is never populated by the AI callback path
- PDF export is UI-only; no persisted signed PDF artifact or `pdf_url` generation flow was found
- Agency UI also allows manual change-order creation separate from scope-flag confirmation, so “one-click generated from flag context” is not the only path
