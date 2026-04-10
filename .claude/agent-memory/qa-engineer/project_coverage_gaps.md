---
name: Coverage Gaps
description: Services, routes, and packages with zero or insufficient test coverage — verified 2026-04-10
type: project
---

## Services with ZERO test coverage (no .test.ts file)
- `apps/api/src/services/workspace.service.ts`
- `apps/api/src/services/invite.service.ts`
- `apps/api/src/services/sow.service.ts`
- `apps/api/src/services/billing.service.ts`
- `apps/api/src/services/analytics.service.ts`
- `apps/api/src/services/audit-log.service.ts`
- `apps/api/src/services/rate-card.service.ts`
- `apps/api/src/services/user-sync.service.ts`
- `apps/api/src/services/reminder.service.ts` — HIGH RISK: reminder timing logic (48h/72h/168h steps) untested
- `apps/api/src/services/scope-flag-alert.service.ts` — HIGH RISK: alert delivery untested
- `apps/api/src/services/brief-scoring-worker.service.ts` — HIGH RISK: BullMQ worker untested
- `apps/api/src/services/clarification-email.service.ts`

## Services with PARTIAL coverage (notable gaps)
- `apps/api/src/services/project.service.ts` — missing workspace isolation test for getProject, no portal token generation test
- `apps/api/src/services/client.service.ts` — updateClient missing audit log assertion, no workspace isolation test
- `apps/api/src/services/dashboard.service.ts` — single test only; no edge cases (empty workspace, Stripe failure, etc.)
- `apps/api/src/services/scope-flag.service.ts` — T-SF-004 unit test is a DEAD TEST (expect(true).toBe(true))

## Routes with ZERO test coverage
All routes except brief-template, portal-session, and portal-brief-submit have no route tests:
- project.route.ts, client.route.ts, change-order.route.ts, scope-flag.route.ts
- deliverable.route.ts, feedback.route.ts, brief.route.ts, brief-submit.route.ts
- workspace.route.ts, auth.route.ts, invite.route.ts, sow.route.ts
- audit-log.route.ts, analytics.route.ts, billing.route.ts, dashboard.route.ts
- portal.route.ts, portal-change-order.route.ts, portal-deliverable.route.ts
- message-ingest.route.ts, email-approval.route.ts, resend-webhook.route.ts, webhook-stripe.route.ts
- notification.route.ts, rate-card.route.ts, ai.route.ts, ai-callback.route.ts, health.route.ts

## Repositories — ZERO test coverage
All 20 repository files have no test coverage.
The workspace isolation guarantee lives in repository WHERE clauses — none are directly tested.
This is a critical gap: the only isolation enforcement tested is that the service calls the repository with the correct workspaceId argument.

## AI service (Python) — ZERO test coverage
- `apps/ai/app/services/brief_scorer.py` — untested
- `apps/ai/app/services/scope_analyzer.py` — untested (confidence threshold 0.60 lives here; T-SF-004 E2E relies on AI behavior, not a unit boundary test)
- `apps/ai/app/services/sow_parser.py` — untested
- `apps/ai/app/services/feedback_summarizer.py` — untested
- `apps/ai/app/services/callback_service.py` — untested
- `apps/ai/app/workers/` — all 5 workers untested
- No pytest.ini, pyproject.toml, or setup.cfg found

## packages/db
- Only `helpers.ts` is tested (generatePortalToken, hashPortalToken, constantTimeCompare, generateUlid)
- `audit.ts` helper (writeAuditLog) — NOT directly tested
- `seed.ts` — not tested

## E2E test quality gaps
- brief-flow.spec.ts T-BRIEF-001/002/003 use if-visible/early-return guards — silently skip when seed state doesn't match required project state
- T-SF-006 (false positive rate) depends on live AI service behavior — non-deterministic in CI
- T-SF-007 auto-approve timing is explicitly a stub (cannot test 168h in E2E)
- sidebar-counts.spec.ts mocks the API — does not exercise real API routes

## CI/CD
- No .github/workflows/ directory exists — ZERO CI pipeline configured
- No TypeScript check, ESLint, Vitest suite, or Playwright E2E in any automated pipeline

## Coverage config
- No coverage threshold is set in any vitest.config.ts — the 80% target is unenforced

**Why:** Identified in 2026-04-09 full audit, re-verified 2026-04-10.
**How to apply:** When asked to write tests, prioritize by risk order:
1. reminder.service (timing logic, 168h sequence)
2. scope-flag-alert.service (alert delivery)
3. ai service scope_analyzer.py (confidence threshold 0.60 boundary)
4. all route tests (especially message-ingest.route — scope flag trigger path)
5. repository workspace isolation (direct WHERE clause tests)
6. brief-scoring-worker.service (BullMQ)
