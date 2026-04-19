# ScopeIQ Master Audit Report
**Novabots Engineering · Lead Architect Synthesis**
**Date:** 2026-04-10 | **Branch:** cursor/add-lottie-f5a82
**Audited by:** 5 parallel specialist agents (AGENT-FE, AGENT-BE, AGENT-AI, AGENT-DB, AGENT-SEC) + inline QA/DOCS analysis

---

## Executive Summary

ScopeIQ has a solid architectural foundation: all three modules exist, the monorepo structure is correct, real-time subscriptions are properly scoped, and the service/repository layering is mostly followed. However, **the platform is not safe to launch** in its current state. There are 8 critical issues that would either crash the service in production, expose all customer data across workspaces, or allow authentication forgery.

**Launch Blockers: 8 Critical | High Priority: 20 | Medium: 18 | Low: 14**

---

## 🔴 CRITICAL Issues (Block Launch)

| # | Source | Finding | File |
|---|---|---|---|
| C1 | AGENT-AI | `anthropic==0.18.1` — SDK too old for Claude 4 models; all AI pipelines fail at runtime | `apps/ai/requirements.txt` |
| C2 | AGENT-AI | `aiohttp` missing from `requirements.txt` — every AI callback crashes on import | `apps/ai/requirements.txt` |
| C3 | AGENT-AI | `MatchingClause` Pydantic objects accessed as dicts (`.get()`) — scope check fails at runtime | `apps/ai/app/workers/scope_guard_worker.py:70` |
| C4 | AGENT-AI | Zero retry logic on ALL Anthropic API calls — single transient error kills job permanently | All 4 AI service files |
| C5 | AGENT-DB | Migration journal missing 5 migrations including RLS policies (`0008_rls_policies.sql`) | `packages/db/drizzle/meta/_journal.json` |
| C6 | AGENT-SEC | Email approval HMAC uses insecure default `"change-this-in-production"` — approval links forgeable | `apps/api/src/routes/email-approval.route.ts:6` |
| C7 | AGENT-SEC | Auth cookie missing `httpOnly` — session token exposed to JavaScript/XSS | `apps/web/src/app/auth/callback/route.ts:31` |
| C8 | AGENT-SEC | `objectKey` not validated on `confirmUpload` — cross-workspace file access | `apps/api/src/services/deliverable.service.ts:154` |

---

## 🟠 HIGH Priority Issues

### AI Service
| # | Finding | File |
|---|---|---|
| H1 | No minimum flag count enforcement for briefs scoring below 70 | `apps/ai/app/services/brief_scorer.py` |
| H2 | Change order uses fragile regex JSON parsing — should use tool_use mode | `apps/ai/app/workers/generate_change_order_worker.py` |
| H3 | 2 services use stale model `claude-3-5-sonnet-20240620` | `generate_change_order_worker.py`, `parse_sow_worker.py` |
| H4 | No Pydantic schema for change order output — hallucinated pricing passes unchecked | Same file |
| H5 | No BullMQ job timeout — stuck Claude calls hold worker slots indefinitely | All workers |
| H6 | No dead letter queue — permanently failed jobs lost silently | All workers |
| H7 | No `/health` endpoint — container probes have nothing to hit | `apps/ai/app/main.py` |

### Backend
| # | Finding | File |
|---|---|---|
| H8 | `deliverableRevisionRepository.listByDeliverable()` has no workspace isolation — IDOR | `apps/api/src/repositories/deliverable-revision.repository.ts:14` |
| H9 | Direct DB writes in `message-ingest.route.ts` — no audit log, bypasses service layer | `apps/api/src/routes/message-ingest.route.ts:44` |
| H10 | Direct DB writes in `sow.route.ts` — no audit log, ignores `sowService` | `apps/api/src/routes/sow.route.ts:54,125` |
| H11 | No agency-side approve/reject endpoint — approval events not created via agency API | `apps/api/src/routes/deliverable.route.ts` |
| H12 | `dispatchGenerateChangeOrderJob` never called — change order AI generation is broken | `apps/api/src/routes/scope-flag.route.ts` |
| H13 | Only `/ingest` message route exists; missing `/inbound` (email) and `/manual` | `apps/api/src/routes/message-ingest.route.ts` |
| H14 | Change order send doesn't dispatch `ChangeOrderSentEmail` — clients never notified | `apps/api/src/services/change-order.service.ts:244` |
| H15 | SOW: no presigned upload route, no `/activate` route | `apps/api/src/routes/sow.route.ts` |
| H16 | `startReminderWorker()` never called — reminder jobs queue but never process | `apps/api/src/index.ts` |
| H17 | 3 email templates never dispatched: ChangeOrderSent, ChangeOrderAccepted, DeliverableReady | `apps/api/src/emails/index.ts` |

### Security
| # | Finding | File |
|---|---|---|
| H18 | Portal auth scans all clients with `.limit(100)` — fails for workspace >100 clients | `apps/api/src/middleware/portal-auth.ts:43` |
| H19 | Legacy `projects.portalToken` stored in plaintext | `apps/api/src/middleware/portal-auth.ts:28` |
| H20 | No rate limiting on `/auth/login` or `/auth/register` — brute force open | `apps/api/src/routes/auth.route.ts` |

### Frontend
| # | Finding | File |
|---|---|---|
| H21 | Password reset route missing — users locked out have no recovery | `apps/web/src/app/(auth)/` |
| H22 | FormBuilder uses arrow buttons, not DnD Kit (PRD requires drag-drop) | `apps/web/src/components/brief/` |
| H23 | ChangeOrderPDF missing — no PDF generation library installed | `apps/web/src/components/scope-guard/` |
| H24 | Reminder settings saved to `localStorage` only — not API-persisted | `apps/web/src/app/(dashboard)/settings/reminders/` |
| H25 | Logo upload sends base64 through API body — should use presigned URL | `apps/web/src/app/(dashboard)/settings/workspace/` |

### Database
| # | Finding | File |
|---|---|---|
| H26 | `deliverable_status_enum` drift — schema vs migration values differ, no ALTER TYPE migration | `packages/db/drizzle/` |
| H27 | `flag_status_enum` missing `change_order_sent` and `resolved` in tracked migrations | Same |
| H28 | Missing RLS on `users` table — cross-workspace user enumeration | `0008_rls_policies.sql` |
| H29 | Missing RLS on `workspaces` table | Same |

### CI/CD
| # | Finding | File |
|---|---|---|
| H30 | No `.github/workflows/` directory — zero automated CI pipeline | Repo root |

---

## 🟡 MEDIUM Priority Issues (20 items)

| # | Area | Finding |
|---|---|---|
| M1 | AI | CORS middleware commented out in FastAPI `main.py` |
| M2 | AI | Bare `except: pass` in clarity endpoint swallows all exceptions |
| M3 | AI | Anthropic client instantiated per-request (no connection pooling) |
| M4 | AI | `SowClauseOutput.clause_type` is bare `str` — no Pydantic enum validation |
| M5 | AI | No prompt version headers or changelog on any prompt file |
| M6 | AI | Structlog present but no Axiom sink configured |
| M7 | BE | In-memory rate limiter resets on restart — not multi-process safe |
| M8 | BE | `inviteRouter` mounted at both `/v1/invites` and `/invites` — auth ambiguity |
| M9 | BE | `portal-auth.ts:48` timing oracle (though not exploitable at SQL layer) |
| M10 | BE | No runtime plan-gating enforcement on resource creation |
| M11 | BE | Stripe/AI env vars not in Zod env schema — missing startup validation |
| M12 | BE | Two scope-check job files with different payload shapes |
| M13 | SEC | Resend webhook fail-open when `RESEND_WEBHOOK_SECRET` unset |
| M14 | SEC | Presigned upload URLs expire in 1h — should be 15min |
| M15 | SEC | No MIME type allowlist on upload presigned URL generation |
| M16 | SEC | `portalRateLimiter` defined but never applied to portal routes |
| M17 | FE | SOW file upload sends placeholder string — file never reaches server |
| M18 | FE | 23 `flag: any` prop types in ScopeGuard components |
| M19 | FE | 197 hardcoded Tailwind color classes — design token violations |
| M20 | DB | `feedback_items` missing `author_type` and `x_pos`/`y_pos` columns |

---

## What's Working Well ✅

- **Architecture:** Monorepo with proper package boundaries, service/repository layering
- **Real-time:** All Supabase subscriptions correctly scoped to `workspace_id`
- **File uploads:** Deliverable presigned URL flow correctly implemented (3-step XHR)
- **Portal auth:** Client-side path uses hashed token with constant-time comparison
- **Stripe webhook:** Signature validated correctly with raw body
- **All repository queries:** `workspaceId` scoping enforced (defense-in-depth)
- **Input validation:** Zod validators on all API inputs
- **Database:** All 16 required enums, complete audit helper, well-structured extra tables
- **AI tool_use mode:** Brief scoring and scope detection correctly use Claude tool_use
- **Confidence threshold:** Scope guard correctly uses `> 0.60` (strictly greater)
- **E2E tests:** T-CP-001/002, T-SF-001/003 have meaningful, well-structured tests
- **Annotation canvas:** Correct `getBoundingClientRect()` percentage calculation
- **Multi-format deliverable viewer:** All 8 content types (file, Figma, Loom, YouTube, etc.)

---

## Feature Implementation Status by Module

### Brief Builder
| Feature | Status |
|---|---|
| FEAT-BB-001: Custom Form Builder | ⚠️ PARTIAL — arrow buttons not DnD Kit |
| FEAT-BB-002: AI Brief Clarity Scorer | ⚠️ PARTIAL — works but no min-flag enforcement, no retry |
| FEAT-BB-003: Auto-Hold Flow | ✅ COMPLETE |
| FEAT-BB-004: Embeddable Brief Form | ✅ COMPLETE |
| FEAT-BB-005: Brief Version History with Diff | ⚠️ PARTIAL — template diff exists; submission diff missing |

### Approval Portal
| Feature | Status |
|---|---|
| FEAT-AP-001: White-Label Portal Config | ⚠️ PARTIAL — logo uses base64 not presigned URL |
| FEAT-AP-002: Multi-Format Deliverable Delivery | ✅ COMPLETE |
| FEAT-AP-003: Point-Anchored Annotation | ✅ COMPLETE |
| FEAT-AP-004: Revision Round Tracker | ✅ COMPLETE |
| FEAT-AP-005: Automated Reminder Sequence | ⚠️ PARTIAL — worker never started; settings not API-persisted |
| FEAT-AP-006: Change Order Portal | ✅ COMPLETE |

### Scope Guard
| Feature | Status |
|---|---|
| FEAT-SG-001: SOW Ingestion + AI Parsing | ⚠️ PARTIAL — file upload not wired; activate route missing |
| FEAT-SG-002: Real-Time Scope Flag Detection | ⚠️ PARTIAL — works for message ingest; manual/email routes missing |
| FEAT-SG-003: One-Click Change Order Generator | ❌ BROKEN — job never dispatched; email never sent; PDF missing |

---

## Sub-Reports
- `sub-reports/FRONTEND_AUDIT.md`
- `sub-reports/BACKEND_AUDIT.md`
- `sub-reports/AI_AUDIT.md`
- `sub-reports/DB_AUDIT.md`
- `sub-reports/SECURITY_REPORT.md`
- `sub-reports/TEST_COVERAGE_REPORT.md`
