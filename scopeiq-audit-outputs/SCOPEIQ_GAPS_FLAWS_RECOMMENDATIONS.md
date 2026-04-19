# ScopeIQ — Gaps, Flaws & Recommendations
Generated: 2026-04-17

## Executive Summary
- 12 P0 features are launch-blocking because no documented feature is fully complete against the tech docs and acceptance criteria.
- 8 business logic flaws identified (5 critical, 2 high, 1 medium).
- 4 entire business processes have no reliable end-to-end implementation foundation.
- Estimated engineering effort to reach launch-ready: 4-6 weeks with 2 engineers, assuming the AI worker layer is stabilized first.

---

## SECTION 1: Launch-Blocking P0 Gaps

### MODULE: Brief Builder
| Feature ID | Feature Name | Current Status | Missing Components | Effort |
|------------|-------------|----------------|-------------------|--------|
| FEAT-BB-001 | Custom Form Builder | 🟡 Partial | Embed publish flow, public iframe delivery, explicit autosave evidence for every edit, full acceptance coverage | M |
| FEAT-BB-002 | AI Brief Clarity Scorer | 🟡 Partial | Working worker runtime, queue-only execution path, Claude/tool_use parity, stronger test coverage | L |
| FEAT-BB-003 | Auto-Hold Flow | 🟡 Partial | Workspace-configurable threshold, reliable worker execution, explicit manual override flow, acceptance tests | M |
| FEAT-BB-004 | Embeddable Brief Form | 🟡 Partial | Public embeddable endpoint, iframe snippet generation, white-labeled embed delivery, tests | L |

### MODULE: Approval Portal
| Feature ID | Feature Name | Current Status | Missing Components | Effort |
|------------|-------------|----------------|-------------------|--------|
| FEAT-AP-001 | White-Label Portal Configuration | 🟡 Partial | Custom domain verification/provisioning, branded subdomain flow, plan gating, tests | L |
| FEAT-AP-002 | Multi-Format Deliverable Delivery | 🟡 Partial | Reliable review-link flow, richer metadata fetch, stronger revision wiring, tests for all file/link modes | M |
| FEAT-AP-003 | Point-Anchored Annotation | 🟡 Partial | Threaded replies, stronger validation, clearer role visibility rules, acceptance tests | M |
| FEAT-AP-004 | Revision Round Tracker | 🟡 Partial | SOW-derived revision limits, selector parity with E2E specs, acceptance coverage for cap handling | M |
| FEAT-AP-005 | Automated Approval Reminder Sequence | 🟡 Partial | Queue wiring, actual scheduling trigger, non-stub worker processing, full tests | M |

### MODULE: Scope Guard
| Feature ID | Feature Name | Current Status | Missing Components | Effort |
|------------|-------------|----------------|-------------------|--------|
| FEAT-SG-001 | SOW Ingestion & AI Parsing | 🟡 Partial | Reliable PDF text extraction, status lifecycle, normalized parsed fields, tests | L |
| FEAT-SG-002 | Real-Time Scope Flag Detection | 🟡 Partial | Runtime-safe worker, schema-aligned inserts, threshold consistency, viewed-state handling | L |
| FEAT-SG-003 | One-Click Change Order Generator | 🟡 Partial | Working worker, persisted generated scope items, signed PDF workflow, tests around accept/update | L |

---

## SECTION 2: Business Logic Flaws

### 🔴 CRITICAL FLAWS (fix before any user testing)

#### FLAW-001: Brief scoring worker cannot run
**Type:** PERFORMANCE / LOGICAL
**Feature Affected:** FEAT-BB-002, FEAT-BB-003
**File:** [`apps/ai/app/workers/score_brief_worker.py`](/home/syeds/scopeiq/apps/ai/app/workers/score_brief_worker.py:104)
**Observed Behavior:** The worker fails Python compilation with `SyntaxError: unmatched ')'`; the file also references undefined variables and hardcodes an auto-hold threshold.
**Expected Behavior:** The scoring worker should execute deterministically for queued brief-scoring jobs and produce a valid callback payload for scoring and hold decisions.
**Impact:** AI scoring and auto-hold behavior are not production-safe; queue dispatch exists but the worker implementation is not runnable.
**Fix:** Rewrite `process_score_brief_job()` in [score_brief_worker.py](/home/syeds/scopeiq/apps/ai/app/workers/score_brief_worker.py:1) to produce a single typed payload consumed by [`handleBriefScored`](/home/syeds/scopeiq/apps/api/src/routes/ai-callback.route.ts:25). Remove dead references, read thresholds from workspace/project settings, and add a smoke test that compiles and executes the worker on a fixture job.

#### FLAW-002: Change order generator worker is syntactically broken
**Type:** LOGICAL / DATA_INTEGRITY
**Feature Affected:** FEAT-SG-003
**File:** [`apps/ai/app/workers/generate_change_order_worker.py`](/home/syeds/scopeiq/apps/ai/app/workers/generate_change_order_worker.py:268)
**Observed Behavior:** The worker fails Python compilation with `SyntaxError: unterminated triple-quoted string literal`.
**Expected Behavior:** The generator should accept a flagged scope event, calculate pricing and timeline deltas, and return a valid change-order payload.
**Impact:** One-click change-order generation is blocked at the worker layer even though downstream API and UI code exist.
**Fix:** Rebuild `generate_change_order_worker.py` around a single prompt/response path, then ensure the callback persists `scopeItemsJson`, `pricingJson`, and rationale used later by [`acceptChangeOrder`](/home/syeds/scopeiq/apps/api/src/services/change-order.service.ts:395).

#### FLAW-003: Scope guard worker writes invalid payloads and has runtime NameErrors
**Type:** LOGICAL / DATA_INTEGRITY
**Feature Affected:** FEAT-SG-002
**File:** [`apps/ai/app/workers/scope_guard_worker.py`](/home/syeds/scopeiq/apps/ai/app/workers/scope_guard_worker.py:35)
**Observed Behavior:** The worker references `asyncpg` and `uuid4()` without imports, and inserts `source` and `metadata` fields into `scope_flags` even though those columns do not exist in the schema.
**Expected Behavior:** Worker output should align with [`scopeFlags`](/home/syeds/scopeiq/packages/db/src/schema/scope-flags.schema.ts:1) and insert only supported columns.
**Impact:** Runtime execution can fail before persistence, or worse, drift from the schema and create inconsistent callback behavior.
**Fix:** Import missing symbols, align worker persistence with the schema columns actually defined in [scope-flags.schema.ts](/home/syeds/scopeiq/packages/db/src/schema/scope-flags.schema.ts:1), and keep threshold logic consistent with [`handleScopeCheckCompleted`](/home/syeds/scopeiq/apps/api/src/routes/ai-callback.route.ts:114).

#### FLAW-004: Reminder sequence is implemented but not wired into production flow
**Type:** LOGICAL / PERFORMANCE
**Feature Affected:** FEAT-AP-005
**File:** [`apps/api/src/services/reminder.service.ts`](/home/syeds/scopeiq/apps/api/src/services/reminder.service.ts:21), [`apps/api/src/jobs/send-reminder.job.ts`](/home/syeds/scopeiq/apps/api/src/jobs/send-reminder.job.ts:6), [`apps/api/src/index.ts`](/home/syeds/scopeiq/apps/api/src/index.ts:112)
**Observed Behavior:** Reminder scheduling logic uses queue name `approval-reminders`, while the booted worker listens on `reminders`; `processReminders()` is effectively a stub, and `scheduleReminderSequence()` is never called from deliverable delivery flow.
**Expected Behavior:** Reminder jobs should be scheduled when a deliverable enters review and then processed hourly until approval, decline, or auto-approval.
**Impact:** Automated reminder and auto-approval behavior will not execute in production.
**Fix:** Collapse reminder handling onto one queue, invoke `scheduleReminderSequence()` from [`confirmUpload`](/home/syeds/scopeiq/apps/api/src/services/deliverable.service.ts:147) and any review-start path, and replace the stub processor in [send-reminder.job.ts](/home/syeds/scopeiq/apps/api/src/jobs/send-reminder.job.ts:15) with the service implementation.

#### FLAW-005: Portal clarity scoring bypasses the intended AI gateway pattern
**Type:** SECURITY / PERFORMANCE
**Feature Affected:** FEAT-BB-002
**File:** [`apps/web/src/components/portal/IntakeForm.tsx`](/home/syeds/scopeiq/apps/web/src/components/portal/IntakeForm.tsx:291), [`apps/api/src/routes/ai.route.ts`](/home/syeds/scopeiq/apps/api/src/routes/ai.route.ts:11)
**Observed Behavior:** The portal intake form calls `/v1/ai/predict-clarity` directly as the user types; the API route then calls the AI service synchronously rather than dispatching a BullMQ job.
**Expected Behavior:** AI operations should flow through the queue/worker gateway defined in the tech docs and Master Prompt Rule 3.
**Impact:** This creates an inconsistent runtime model, undermines queue-based scaling, and likely breaks for unauthenticated portal users because the mounted AI router uses `authMiddleware`.
**Fix:** Remove direct browser calls to `/v1/ai/predict-clarity`, dispatch scoring through [`dispatchScoreBriefJob`](/home/syeds/scopeiq/apps/api/src/jobs/score-brief.job.ts:16), and expose progress/results through the existing brief scoring callback plus realtime/UI polling.

### 🟠 HIGH FLAWS

#### FLAW-006: SOW PDF parsing path queues jobs without document text
**Type:** LOGICAL
**Feature Affected:** FEAT-SG-001
**File:** [`apps/api/src/routes/sow.route.ts`](/home/syeds/scopeiq/apps/api/src/routes/sow.route.ts:246), [`apps/api/src/services/sow.service.ts`](/home/syeds/scopeiq/apps/api/src/services/sow.service.ts:118), [`apps/ai/app/workers/parse_sow_worker.py`](/home/syeds/scopeiq/apps/ai/app/workers/parse_sow_worker.py:18)
**Observed Behavior:** The upload/confirm path dispatches parse work with empty `raw_text`, while the worker exits early when no text is present.
**Expected Behavior:** Uploaded PDFs should be text-extracted before AI parsing or parsed from a storage URL inside the worker.
**Impact:** SOW upload appears successful, but clause parsing can silently fail for the main upload path.
**Fix:** Add a preprocessing step before `dispatchParseSowJob()` that extracts text from the uploaded artifact, or pass the storage URL and let `parse_sow_worker.py` perform extraction before prompt generation.

#### FLAW-007: Webhook-created messages skip audit logging
**Type:** SECURITY
**Feature Affected:** FEAT-SG-002
**File:** [`apps/api/src/routes/resend-webhook.route.ts`](/home/syeds/scopeiq/apps/api/src/routes/resend-webhook.route.ts:82)
**Observed Behavior:** Incoming email replies are inserted into `messages` without a matching `writeAuditLog()` call.
**Expected Behavior:** Master Prompt Rule 6 requires an audit log on every mutation.
**Impact:** Scope-sensitive client communications can be created without a forensic trail.
**Fix:** After the `messages` insert in [resend-webhook.route.ts](/home/syeds/scopeiq/apps/api/src/routes/resend-webhook.route.ts:82), add `writeAuditLog()` using the message ID, workspace ID, and event type `message.received`.

### 🟡 MEDIUM FLAWS

#### FLAW-008: Revision limit logic is decoupled from the SOW-derived contract
**Type:** LOGICAL / UX
**Feature Affected:** FEAT-AP-004
**File:** [`apps/api/src/services/deliverable.service.ts`](/home/syeds/scopeiq/apps/api/src/services/deliverable.service.ts:271), [`packages/db/src/schema/deliverables.schema.ts`](/home/syeds/scopeiq/packages/db/src/schema/deliverables.schema.ts:31)
**Observed Behavior:** Revision usage is driven by `deliverables.revisionRound` and `maxRevisions`; no linkage to parsed SOW clause limits is enforced.
**Expected Behavior:** The revision tracker should reflect the contractual revision allowance extracted from the SOW tech-doc flow.
**Impact:** Agencies can drift from contract state, and the client-facing counter may not represent the actual approved scope.
**Fix:** Persist revision-limit clauses from the SOW parser into a normalized field and set `maxRevisions` from that source when deliverables are created or when a change order updates scope.

---

## SECTION 3: Missing Business Processes

### PROCESS-001: Public Embeddable Brief Intake Flow
**Affects Features:** FEAT-BB-004
**What's Missing:** The documented iframe/public-hosted intake journey is absent. The only public submission route now returns a deprecation response, and no embed code generation flow exists.
**Entry Point:** Prospect or client opens an embedded brief form outside the authenticated portal.
**Required Implementation:**
1. Schema: reuse `brief_templates` and `briefs`; add an explicit public embed publication state if needed.
2. API: replace the deprecated public submit route in [`apps/api/src/routes/brief-submit.route.ts`](/home/syeds/scopeiq/apps/api/src/routes/brief-submit.route.ts:1) with a signed public submission endpoint.
3. Service: add public template resolution and submission validation in `apps/api/src/services/brief.service.ts`.
4. Worker: reuse the brief-scoring worker after submission.
5. Frontend: add an embeddable render page and snippet generator in `apps/web/src/app`.
6. Integration: support workspace-specific hostname/embed origin allowlisting.
**Priority:** LAUNCH_BLOCKER
**Effort:** L

### PROCESS-002: Custom Domain Verification and Provisioning
**Affects Features:** FEAT-AP-001
**What's Missing:** Branding fields exist, but there is no DNS verification, certificate issuance, or domain activation workflow.
**Entry Point:** Agency configures a custom domain for the approval portal.
**Required Implementation:**
1. Schema: extend `workspaces` with domain verification status and timestamps.
2. API: create domain verification routes under `apps/api/src/routes/workspace.route.ts` or a dedicated route module.
3. Service: add a domain service that creates verification tokens and persists status.
4. Worker: background polling/verification job if DNS checks are asynchronous.
5. Frontend: add portal branding/domain setup screens in `apps/web/src/components/settings`.
6. Integration: Cloudflare or equivalent DNS verification and certificate provisioning.
**Priority:** HIGH
**Effort:** L

### PROCESS-003: End-to-End Approval Reminder Orchestration
**Affects Features:** FEAT-AP-005, FEAT-AP-002
**What's Missing:** Reminder logic exists in isolation, but the production entry point, queue processing, and steady-state orchestration are not connected.
**Entry Point:** Deliverable enters review and remains unapproved.
**Required Implementation:**
1. Schema: existing `reminder_logs` is sufficient.
2. API: ensure deliverable review start triggers reminder scheduling.
3. Service: unify scheduling and execution in `apps/api/src/services/reminder.service.ts`.
4. Worker: use a single BullMQ worker bound to the same queue name.
5. Frontend: surface reminder/auto-approval status in the portal and dashboard.
6. Integration: keep Resend delivery and webhook approval links aligned.
**Priority:** LAUNCH_BLOCKER
**Effort:** M

### PROCESS-004: Reliable SOW PDF Extraction Pipeline
**Affects Features:** FEAT-SG-001, FEAT-SG-002, FEAT-SG-003
**What's Missing:** The uploaded-PDF ingestion path does not guarantee text extraction before parsing, which leaves downstream scope-guard features dependent on empty clause data.
**Entry Point:** Agency uploads a PDF statement of work.
**Required Implementation:**
1. Schema: add SOW processing status if the team needs retry/error visibility.
2. API: validate upload completion and enqueue extraction/parsing stages separately.
3. Service: add a preprocessing stage in `apps/api/src/services/sow.service.ts`.
4. Worker: enhance `apps/ai/app/workers/parse_sow_worker.py` to fetch and extract text if `raw_text` is absent.
5. Frontend: show extraction/parsing progress and failure states in the SOW uploader.
6. Integration: PDF text extraction library and storage fetch permissions.
**Priority:** LAUNCH_BLOCKER
**Effort:** L

---

## SECTION 4: Recommendations

### Priority Matrix

| # | Recommendation | Type | Priority | Effort | Impact |
|---|---------------|------|----------|--------|--------|
| R-001 | Rebuild the brief-scoring worker and remove direct portal AI calls | BUG_FIX | LAUNCH_BLOCKER | L | Restores Brief Builder scoring and auto-hold reliability |
| R-002 | Rewrite change-order generation worker and persist structured scope deltas | BUG_FIX | LAUNCH_BLOCKER | L | Unblocks Scope Guard monetization flow |
| R-003 | Fix scope-guard worker schema/runtime drift | BUG_FIX | LAUNCH_BLOCKER | M | Prevents failed or corrupt scope-flag creation |
| R-004 | Unify reminder queue wiring and trigger scheduling from deliverable review start | REFACTOR | LAUNCH_BLOCKER | M | Restores approval reminder automation |
| R-005 | Implement reliable PDF text extraction before SOW parsing | NEW_FEATURE | LAUNCH_BLOCKER | L | Enables the Scope Guard dependency chain |
| R-006 | Add mutation audit logging to email-ingestion and other uncovered write paths | SECURITY_PATCH | HIGH | S | Restores auditability required by Rule 6 |
| R-007 | Add custom-domain verification/provisioning flow | NEW_FEATURE | HIGH | L | Closes a major white-label gap |
| R-008 | Bind revision limits to parsed SOW contract data | REFACTOR | MEDIUM | M | Aligns revision tracking with contractual scope |
| R-009 | Expand automated test coverage for missing P0 flows | TEST_COVERAGE | HIGH | M | Reduces regression risk before launch |

### R-001: Rebuild the brief-scoring worker and remove direct portal AI calls
**Priority:** LAUNCH_BLOCKER
**Effort:** L
**Type:** BUG_FIX
**Context:** FEAT-BB-002 and FEAT-BB-003 depend on a worker that currently does not compile, while the portal UI bypasses the intended queue/worker pattern.
**Implementation:**
```python
# apps/ai/app/workers/score_brief_worker.py
async def process_score_brief_job(job_data: dict[str, Any]) -> dict[str, Any]:
    # 1. Load brief + fields
    # 2. Score with apps.ai.services.brief_scorer.score_brief_clarity
    # 3. Return callback payload:
    # {
    #   "briefId": str,
    #   "score": int,
    #   "flags": list[dict[str, Any]],
    #   "autoHold": bool,
    #   "threshold": int
    # }
```
**Acceptance Test:** `python3 -m py_compile apps/ai/app/workers/score_brief_worker.py` passes, `apps/api/src/jobs/score-brief.job.ts` jobs update `briefs.scope_score`, and the portal no longer calls `/v1/ai/predict-clarity` directly.

### R-002: Rewrite change-order generation worker and persist structured scope deltas
**Priority:** LAUNCH_BLOCKER
**Effort:** L
**Type:** BUG_FIX
**Context:** FEAT-SG-003 has downstream API/UI support, but the worker that creates the payload is syntactically invalid.
**Implementation:**
```python
# apps/ai/app/workers/generate_change_order_worker.py
result = {
    "scopeFlagId": scope_flag_id,
    "title": generated.title,
    "description": generated.description,
    "amount": generated.amount,
    "timelineDays": generated.timeline_days,
    "scopeItemsJson": generated.scope_items,
    "pricingJson": generated.pricing_breakdown,
}
```
**Acceptance Test:** Worker compiles, callback persistence creates a usable `change_orders` record, and accepting a generated change order updates `projects`, `scope_flags`, and `sow_clauses` in one transaction.

### R-003: Fix scope-guard worker schema/runtime drift
**Priority:** LAUNCH_BLOCKER
**Effort:** M
**Type:** BUG_FIX
**Context:** FEAT-SG-002 is partially built, but the worker payload does not match the schema and contains runtime NameErrors.
**Implementation:**
```python
# apps/ai/app/workers/scope_guard_worker.py
from uuid import uuid4
import asyncpg

await conn.execute(
    """
    insert into scope_flags (
      id, project_id, sow_clause_id, message_id, message_text,
      confidence, severity, status, suggested_response,
      ai_reasoning, matching_clauses_json, evidence
    ) values ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11)
    """,
    ...
)
```
**Acceptance Test:** Worker runs against a fixture message, creates a `scope_flags` row with valid columns only, and the callback threshold matches the worker threshold.

### R-004: Unify reminder queue wiring and trigger scheduling from deliverable review start
**Priority:** LAUNCH_BLOCKER
**Effort:** M
**Type:** REFACTOR
**Context:** The reminder system is mostly implemented but disconnected.
**Implementation:**
```ts
// apps/api/src/services/deliverable.service.ts
await scheduleReminderSequence({
  deliverableId: deliverable.id,
  projectId: deliverable.projectId,
  workspaceId: deliverable.workspaceId,
})
```
**Acceptance Test:** A delivered item creates delayed reminder jobs in the same queue consumed by the booted worker, reminder emails send on schedule, and auto-approval occurs only after the configured sequence expires.

### R-005: Implement reliable PDF text extraction before SOW parsing
**Priority:** LAUNCH_BLOCKER
**Effort:** L
**Type:** NEW_FEATURE
**Context:** Scope Guard depends on parsed clauses, but the main upload path can enqueue empty text.
**Implementation:**
```ts
// apps/api/src/services/sow.service.ts
const extractedText = await extractPdfTextFromStorage(objectKey)
await dispatchParseSowJob({
  sowId: sow.id,
  rawText: extractedText,
  source: "upload",
})
```
**Acceptance Test:** Uploading a PDF SOW produces non-empty `sow_clauses`, sets `parsedAt`, and downstream scope-flag matching finds those clauses.

### R-006: Add mutation audit logging to email-ingestion and other uncovered write paths
**Priority:** HIGH
**Effort:** S
**Type:** SECURITY_PATCH
**Context:** Rule 6 requires audit logging on every mutation, but email-ingested messages skip that.
**Implementation:**
```ts
// apps/api/src/routes/resend-webhook.route.ts
await writeAuditLog(db, {
  workspaceId: invitation.workspaceId,
  actorType: "system",
  actorId: "resend-webhook",
  entityType: "message",
  entityId: message.id,
  action: "message.received",
  metadata: { source: "resend-webhook" },
})
```
**Acceptance Test:** Processing an inbound email creates both the `messages` row and a matching `audit_log` row.

### R-007: Add custom-domain verification/provisioning flow
**Priority:** HIGH
**Effort:** L
**Type:** NEW_FEATURE
**Context:** FEAT-AP-001 is materially incomplete without domain verification and activation.
**Implementation:**
```ts
// packages/db/src/schema/workspaces.schema.ts
domainVerificationStatus: text("domain_verification_status")
  .$type<"pending" | "verified" | "failed">()
  .default("pending"),
domainVerificationToken: text("domain_verification_token"),
domainVerifiedAt: timestamp("domain_verified_at", { withTimezone: true }),
```
**Acceptance Test:** Workspace owners can request a token, add the required DNS record, and see the portal domain move to `verified` before traffic is routed.

### R-008: Bind revision limits to parsed SOW contract data
**Priority:** MEDIUM
**Effort:** M
**Type:** REFACTOR
**Context:** FEAT-AP-004 currently counts revisions independently from the contract parser output.
**Implementation:**
```ts
// apps/api/src/services/deliverable.service.ts
const revisionLimit = await getProjectRevisionLimitFromSow(projectId)
await tx.insert(deliverables).values({
  ...payload,
  maxRevisions: revisionLimit,
})
```
**Acceptance Test:** A deliverable created under a project with a parsed 2-round revision clause shows `2` as the cap, and accepting a change order can increase that cap when scope changes.

### R-009: Expand automated test coverage for missing P0 flows
**Priority:** HIGH
**Effort:** M
**Type:** TEST_COVERAGE
**Context:** Several P0 features either have no direct coverage or appear to have specs that do not match runtime selectors/flows.
**Implementation:**
```ts
// apps/web/tests/e2e/approval-reminder-flow.spec.ts
// apps/api/src/services/__tests__/sow.service.test.ts
// apps/api/src/services/__tests__/reminder.service.test.ts
```
**Acceptance Test:** New unit and E2E tests cover reminder scheduling, SOW upload parsing, and white-label portal flows; CI fails when selectors or queue triggers drift.

---

## SECTION 5: Feature Business Processes to Add (Post-MVP)

### SUGGESTED-001: Workspace-Level AI Policy Controls
**Rationale:** Different agencies will want different hold thresholds, clause sensitivity, and reminder cadence; hardcoded values reduce trust and increase manual override work.
**Fits Into:** Brief Builder and Scope Guard; extends FEAT-BB-002, FEAT-BB-003, FEAT-SG-002, FEAT-AP-005
**Rough Implementation Sketch:** Add workspace settings for scoring threshold, scope-flag confidence threshold, and reminder cadence; thread those values into queue payloads and service decisions.
**Suggested Priority:** v1.1

### SUGGESTED-002: Scope Flag Viewed-State and SLA Dashboard
**Rationale:** The current alert logic only checks pending status, not whether an agency actually saw the flag. A viewed-state model would make reminder and escalation logic more credible.
**Fits Into:** Scope Guard; extends FEAT-SG-002
**Rough Implementation Sketch:** Add `viewedAt`, `viewedBy`, and escalation timestamps to `scope_flags`, then update dashboard cards and reminder jobs to use view-state instead of status alone.
**Suggested Priority:** v1.5

### SUGGESTED-003: Persisted Signed Change-Order Artifacts
**Rationale:** The product will be stronger if accepted change orders produce an immutable PDF artifact with signature metadata and audit references.
**Fits Into:** Scope Guard; extends FEAT-SG-003
**Rough Implementation Sketch:** Generate a PDF on acceptance, store it in object storage, and attach artifact metadata to `change_orders`.
**Suggested Priority:** v2.0

---

## SECTION 6: Test Coverage Gap Report

| Module | P0 Features | Have Unit Tests | Have E2E Tests | Coverage Risk |
|--------|-------------|-----------------|----------------|---------------|
| Brief Builder | 4 | 2 | 1 | HIGH |
| Approval Portal | 5 | 0 | 2 | HIGH |
| Scope Guard | 3 | 2 | 2 | HIGH |
| Platform/Auth/Billing | 0 documented in tech docs | 0 | 0 | MED |

### Untested P0 Critical Paths
- `FEAT-BB-002` lacks a reliable worker-level test; create `apps/ai/tests/test_score_brief_worker.py` and validate callback payload shape plus threshold behavior.
- `FEAT-BB-003` lacks an API/service test that verifies auto-hold plus clarification-request creation; create `apps/api/src/services/__tests__/brief-hold.service.test.ts`.
- `FEAT-AP-001` lacks direct coverage for branding/domain activation; create `apps/web/tests/e2e/portal-branding.spec.ts`.
- `FEAT-AP-005` lacks direct unit and E2E coverage for queue scheduling and auto-approval; create `apps/api/src/services/__tests__/reminder.service.test.ts` and `apps/web/tests/e2e/approval-reminder-flow.spec.ts`.
- `FEAT-SG-001` lacks parser-path coverage for uploaded PDFs; create `apps/api/src/services/__tests__/sow.service.test.ts` and `apps/ai/tests/test_parse_sow_worker.py`.
