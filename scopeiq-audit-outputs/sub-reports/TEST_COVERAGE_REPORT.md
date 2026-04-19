# AGENT-TEST: QA & Test Coverage Report
**Date:** 2026-04-10

## E2E Test Matrix (Playwright)

### Client Portal Tests
| Test ID | Required Scenario | Status | File | Quality |
|---|---|---|---|---|
| T-CP-001 | Portal entry → branding → brief submit → scoring pending | ✅ EXISTS | `client-portal-flow.spec.ts` | Good — SLA check, branding assertion |
| T-CP-002 | Brief below 70 → clarification → resubmit | ✅ EXISTS | `client-portal-flow.spec.ts` | Good |
| T-CP-003 | Annotation pins → agency notification | ⚠️ PARTIAL | `client-portal-flow.spec.ts` | Pin placement tested; realtime notification not verified |
| T-CP-004 | Revision limit → modal → cannot submit | ⚠️ PARTIAL | `client-portal-flow.spec.ts` | Modal shown; submit block assertion weak |
| T-CP-005 | Change order accept via email → signed_at | ⚠️ PARTIAL | `client-portal-flow.spec.ts` | Acceptance flow tested; DB state not asserted |
| T-CP-006 | Portal token validation (valid/expired/revoked) | ✅ EXISTS | `client-portal-flow.spec.ts` | All three cases |
| T-CP-007 | Annotation coordinates at 375/768/1440px | ❌ MISSING | — | Not implemented |

### Scope Flag Tests
| Test ID | Required Scenario | Status | File | Quality |
|---|---|---|---|---|
| T-SF-001 | Out-of-scope message → flag <5s → red badge | ✅ EXISTS | `scope-flag-flow.spec.ts` | SLA polling at 2× SLA, badge count check |
| T-SF-002 | Confirm flag → change order → send → accept → SOW update | ⚠️ PARTIAL | `scope-flag-flow.spec.ts` | Flow exists; SOW update assertion missing |
| T-SF-003 | Dismiss flag → audit_log entry | ✅ EXISTS | `scope-flag-flow.spec.ts` | |
| T-SF-004 | Confidence threshold 0.61 (create) vs 0.60 (skip) | ❌ MISSING | — | Not implemented |
| T-SF-005 | audit_log write on every status transition | ⚠️ PARTIAL | `scope-flag-flow.spec.ts` | One transition checked |
| T-SF-006 | False positive rate <15% on 20-message corpus | ❌ MISSING | — | Not implemented |
| T-SF-007 | Reminder sequence timing | ❌ MISSING | — | Not implemented |

### Other E2E Tests (Existing)
| File | Coverage |
|---|---|
| `brief-builder-stack.spec.ts` | Form builder UI, template loading, field rendering — mocked API, good quality |
| `brief-flow.spec.ts` | T-BRIEF-001/002/003 — submit → pending → score → clarification |
| `portal-tabs.spec.ts` | T-NAV-001–005 — tab gating by project status |
| `sidebar-counts.spec.ts` | Dashboard metrics, sidebar badge counts — mocked API |

## Unit Test Coverage (Vitest)

### API Services
| Service | Test File | Lines | Quality | Missing |
|---|---|---|---|---|
| `change-order.service` | `__tests__/change-order.service.test.ts` | 386 | Good — workspace isolation, CRUD, status transitions | Email dispatch not tested |
| `deliverable.service` | `__tests__/deliverable.service.test.ts` | 463 | Good | Approve/reject event creation tested |
| `feedback.service` | `__tests__/feedback.service.test.ts` | 123 | Adequate | Scope check job dispatch verified |
| `scope-flag.service` | `__tests__/scope-flag.service.test.ts` | 362 | Good — all status transitions | Change order dispatch (broken anyway) |
| `dashboard.service` | `__tests__/dashboard.service.test.ts` | 86 | Thin — heavy mocking | Metrics aggregation not deeply tested |
| `brief.service` | `brief.service.test.ts` | 376 | Good | Override logging |
| `brief-template.service` | `brief-template.service.test.ts` | 374 | Good | Version restore |
| `client.service` | `client.service.test.ts` | 71 | Thin | Plan-gating not tested |
| `project.service` | `project.service.test.ts` | 96 | Thin | Deliverable creation `any` type not caught |

### Services With NO Tests
- `sow.service.ts` — ❌ No test file
- `billing.service.ts` — ❌ No test file
- `reminder.service.ts` — ❌ No test file
- `clarification-email.service.ts` — ❌ No test file
- `analytics.service.ts` — ❌ No test file

### API Routes
| Route | Test File | Quality |
|---|---|---|
| `brief-template.route` | `brief-template.route.test.ts` (184 lines) | Good — all endpoints |
| `portal-session.route` | `portal-session.route.test.ts` (270 lines) | Good |
| `portal-brief-submit.route` | `portal-brief-submit.route.test.ts` (394 lines) | Good |
| `deliverable.route` | ❌ No test | — |
| `scope-flag.route` | ❌ No test | — |
| `change-order.route` | ❌ No test | — |
| `sow.route` | ❌ No test | — |
| `message-ingest.route` | ❌ No test | — |

### Frontend Unit Tests
| File | Coverage |
|---|---|
| `hooks/query-keys.test.ts` | Query key generation |
| `hooks/useRealtimeDashboardMetrics.test.ts` | Realtime subscription logic |
| `components/brief/form-builder.utils.test.ts` | Field ordering utilities |

## CI Pipeline — 🔴 CRITICAL GAP
**No `.github/workflows/` directory exists at repo root.**

Required but missing:
- ❌ TypeScript compiler check (`tsc --noEmit`)
- ❌ ESLint + Prettier
- ❌ Vitest unit suite (no CI gate)
- ❌ Playwright E2E against preview environment
- ❌ Preview environment on PR open
- ❌ Production deploy gate
- ❌ Post-deploy smoke test
- ❌ Auto-rollback on error spike

Test infrastructure exists (playwright.config.ts, vitest.config.ts) but nothing runs it automatically.

## Estimated Coverage
- `apps/api/src/services/`: ~65% (5 of 10 services tested; missing sow, billing, reminder, clarification, analytics)
- `apps/api/src/routes/`: ~30% (3 of ~12 route files have tests)
- `packages/db/`: helpers.ts has no tests; `__tests__/helpers.test.d.ts` exists in dist but not in src
- Target: 80% for services and db — **currently below target**
