---
name: Test Matrix Status
description: EXISTS/MISSING/PARTIAL/STUB status for T-CP-001..007 and T-SF-001..007 required test matrix — verified 2026-04-10
type: project
---

## Client Portal E2E (client-portal-flow.spec.ts)
- T-CP-001: EXISTS — portal entry, branding check (ScopeIQ absent), brief submission, pending state. Quality: GOOD. SLA assertion present.
- T-CP-002: EXISTS — vague brief triggers clarification screen, resubmit, pollUntil advances URL. Quality: GOOD.
- T-CP-003: EXISTS — annotation pins (3 pins via canvas click), feedback submit, API assertion on feedback count. Quality: GOOD. Uses `pageTimeout()` inline delay between pins (300ms).
- T-CP-004: EXISTS — revision limit modal, Escape key blocks, acknowledge button, change order URL check. Quality: GOOD.
- T-CP-005: EXISTS — typed signature, accept button, API assert signed_at/signed_by_name. Quality: GOOD.
- T-CP-006: PARTIAL — valid token (200), invalid token (404), expired token (STUB: submits nonexistent token string, does NOT seed a genuinely expired token via expires_at column).
- T-CP-007: EXISTS — 375/768/1440px viewports, toBeCloseTo 5% tolerance. Quality: GOOD.

## Scope Flag E2E (scope-flag-flow.spec.ts)
- T-SF-001: EXISTS — API ingest then pollUntil count increases, badge text assertion. Quality: GOOD. RISK: getAgencyJwt() returns "" if SUPABASE_JWT env unset — silent failure.
- T-SF-002: EXISTS — confirm flag, change order editor, edit hours/price, send, API status "sent" + sentAt. Quality: GOOD.
- T-SF-003: EXISTS — dismiss with reason, audit log assert (action="dismiss"), badge count decrement. Quality: GOOD.
- T-SF-004: PARTIAL — below-threshold test submits an in-scope text message and checks flag count doesn't increase by >1; does NOT directly assert 0.60 threshold or mock confidence value. High-confidence test verifies flag created. Both pass only if AI returns expected confidence.
- T-SF-005: EXISTS — pending→confirmed audit (assert metadataJson.status="confirmed"); pending→snoozed audit (assert action="update"). Quality: GOOD.
- T-SF-006: EXISTS — 10 in-scope messages (<15% false positive); 10 out-of-scope messages (≥60% true positive). Quality: GOOD but depends entirely on live AI service behavior.
- T-SF-007: PARTIAL — Test 1 checks deliverable status=in_review and reviewStartedAt present. Test 2 is an explicit STUB (comments "full timing requires waiting 168+ hours"). Test 3 checks approve/decline buttons visible in portal UI (no email interception).

## Additional E2E tests
- brief-flow.spec.ts: T-BRIEF-001/002/003 — conditional on seed state; tests use if-visible guards, meaning they skip silently if project is in wrong state. Quality: WEAK (tests may always pass without exercising the feature).
- portal-tabs.spec.ts: T-NAV-001..005 — mix of hard assertions (tab counts=0) and conditional/if-visible guards. T-NAV-001 is hard assertion. T-NAV-002/003 use optional guards.
- sidebar-counts.spec.ts: Mocked API via page.route(). Single test, solid assertion on sidebar badge text. Quality: GOOD.
- brief-builder-stack.spec.ts: Mocked API. Adds 2 fields, verifies count and move-up reorder. Quality: GOOD.

## Unit Service Tests
- scope-flag.service: GOOD — workspace isolation, all status transitions, snoozedUntil window (23-25h), resolvedBy/resolvedAt fields, countPending. T-SF-004 unit test is a DEAD TEST (expect(true).toBe(true)).
- change-order.service: GOOD — workspace isolation, create/update/accept/decline, sentAt/respondedAt timestamps, lineItemsJson, scopeFlagId.
- deliverable.service: GOOD — approve, requestRevision, revision limit enforcement ("3/3" error message), null actorId for system approvals, audit log with revisionRound metadata.
- feedback.service: GOOD — resolve/delete with audit log, workspace isolation, deliverable ownership check before submit.
- dashboard.service: OK — single test, covers active projects/awaitingApproval/pendingScopeFlags/mrr chain. Only 1 test total.
- project.service: PARTIAL — CRUD + audit log. No test for workspace isolation (getById with wrong workspaceId). No test for portal token generation.
- brief.service: GOOD — template version pinning, archived template rejection, no-published-version guard, pinned version on draft save, missing version fails closed.
- brief-template.service: GOOD — create/publish/restore/archive + branding overrides + version incrementing.
- client.service: PARTIAL — CRUD + audit log. updateClient does NOT verify audit log is called. No workspace isolation test.

## Route Tests
- brief-template.route: EXISTS — listVersions, publish, restore via briefTemplateRouter.fetch(). Quality: GOOD.
- portal-session.route: EXISTS — pinned template version branding, field overrides, attachment list. Quality: GOOD.
- portal-brief-submit.route: EXISTS — T-BRIEF-004 (201 with brief_id), T-BRIEF-005 (expired token → 401), T-BRIEF-006 (workspace isolation). Quality: GOOD.

## Notable defects found in 2026-04-10 re-audit
1. T-CP-006 expired token test is a stub — tests 404 for nonexistent token string, not a genuinely DB-expired token.
2. T-SF-004 confidence boundary test does not control or assert confidence=0.60; relies on AI returning low confidence for an in-scope message.
3. T-SF-007 auto-approve timing test explicitly documents it cannot verify 168h sequence in E2E.
4. T-SF-004 unit test in scope-flag.service.test.ts is a DEAD TEST: expect(true).toBe(true) with a comment saying the boundary is enforced elsewhere.
5. project.service.test.ts has no workspace isolation test for getProject (cross-workspace getById).
6. client.service.test.ts updateClient does not assert writeAuditLog was called.
7. brief-flow.spec.ts T-BRIEF-001/002/003 all use if-visible/early-return guards — tests are silently skipped when seed state doesn't match.
8. No coverage threshold enforced in any vitest.config.ts.
9. getAgencyJwt() returns empty string when SUPABASE_JWT env absent — T-SF-001..006 fail silently (no auth error surfaced until assertion).

**Why:** Full re-audit conducted 2026-04-10.
**How to apply:** When writing new tests, do NOT replicate the if-visible guard pattern from brief-flow.spec.ts. Treat T-SF-004 dead unit test as a bug to fix. Prioritize workspace isolation tests for project.service and client.service.
