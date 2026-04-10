# ScopeIQ Implementation Plan
**Novabots Engineering · AGENT-IMPL Synthesis**
**Date:** 2026-04-10 | **Based on:** 5-agent parallel audit

---

## Sprint 0 — Critical Fixes (Week 1) — DO FIRST, EVERYTHING ELSE BLOCKED

These are production-breaking issues that must be resolved before any other sprint work.

### T-S0-001 | 🔴 | Fix AI service dependencies
**Agent:** AGENT-AI | **Points:** 2
- Update `anthropic>=0.49.0` in `apps/ai/requirements.txt`
- Add `aiohttp>=3.9.0` (or refactor `callback_service.py` to use `httpx` which is already listed)
- Remove unused `pymupdf` and `httpx` or wire them up
- **Acceptance:** `pip install -r requirements.txt` succeeds; `python -c "import anthropic, aiohttp"` passes

### T-S0-002 | 🔴 | Fix MatchingClause dict access bug
**Agent:** AGENT-AI | **Points:** 1
- **File:** `apps/ai/app/workers/scope_guard_worker.py:70-77`
- Replace `mc.get("clause_id")` etc. with `mc.clause_id` (Pydantic attribute access)
- **Acceptance:** Scope check jobs complete without AttributeError

### T-S0-003 | 🔴 | Add retry logic to all LLM calls
**Agent:** AGENT-AI | **Points:** 3
- Add exponential backoff decorator (2s, 4s, 8s) for 429/500/502/503 to:
  - `brief_scorer.py` — `self.client.messages.create()`
  - `scope_analyzer.py` — `self.client.messages.create()`
  - `sow_parser.py` — `self.client.messages.create()`
  - `generate_change_order_worker.py` — direct Claude call
- **Acceptance:** Worker handles transient 429 without failing job

### T-S0-004 | 🔴 | Apply missing DB migrations and fix journal
**Agent:** AGENT-DB | **Points:** 3
- Add untracked migrations to `_journal.json`: 0003, 0007, 0008, 0009, 0010
- Apply `0008_rls_policies.sql` to production database
- Run `ALTER TYPE deliverable_status_enum RENAME VALUE ...` migration for enum drift
- Run `ALTER TYPE flag_status_enum ADD VALUE 'change_order_sent'; ADD VALUE 'resolved';`
- Add missing RLS policies for `users` and `workspaces` tables
- Fix overly permissive portal token RLS policy
- **Acceptance:** `drizzle-kit migrate` runs without errors; RLS policies verified via Supabase dashboard

### T-S0-005 | 🔴 | Fix email approval HMAC secret
**Agent:** AGENT-SEC | **Points:** 1
- **File:** `apps/api/src/routes/email-approval.route.ts:6`
- Remove `?? "change-this-in-production"` — throw at startup if env var missing
- Add `EMAIL_APPROVAL_SECRET` to Zod env schema in `lib/env.ts`
- **Acceptance:** Server refuses to start if var unset; no default fallback

### T-S0-006 | 🔴 | Fix auth cookie httpOnly
**Agent:** AGENT-SEC | **Points:** 2
- **File:** `apps/web/src/app/auth/callback/route.ts:31`
- Add `httpOnly: true` to server-side cookie
- Remove `document.cookie` auth token writes from `auth-provider.tsx:114`
- Move to server-side session refresh pattern
- **Acceptance:** Browser DevTools shows `HttpOnly` flag on auth cookie; no token in `document.cookie`

### T-S0-007 | 🔴 | Fix objectKey cross-workspace access
**Agent:** AGENT-SEC | **Points:** 2
- **Files:** `deliverable.service.ts:154`, `brief.service.ts:1031`
- Validate objectKey has expected prefix before generating download URL
- **Acceptance:** Supplying another workspace's object key returns 403

---

## Sprint 1 — Backend Structural Fixes (Week 2-3)

### T-S1-001 | 🟠 | Add workspace isolation to deliverable-revision repository
**Agent:** AGENT-BE | **Points:** 2
- Add `workspaceId` parameter to `listByDeliverable()` and `getLatestVersion()`
- Use innerJoin to deliverables table to enforce isolation
- Update all callers in route handlers

### T-S1-002 | 🟠 | Refactor message-ingest route to use service layer
**Agent:** AGENT-BE | **Points:** 3
- Move DB insert to a `messageService.ingest()` method
- Add `writeAuditLog()` call inside transaction
- Add `/inbound` route (email webhook source)
- Add `/manual` route (dashboard paste source)
- Apply `portalRateLimiter` to portal routes in `index.ts`

### T-S1-003 | 🟠 | Refactor sow route to use service layer
**Agent:** AGENT-BE | **Points:** 3
- Remove direct `db` imports from `sow.route.ts`
- Call existing `sowService.create()`, `activateSow()`, `updateClauses()`
- Add `POST /upload` presigned URL endpoint for PDF/DOCX upload
- Add `POST /:id/activate` endpoint
- **File:** `apps/api/src/routes/sow.route.ts`

### T-S1-004 | 🟠 | Wire generate_change_order job dispatch
**Agent:** AGENT-BE | **Points:** 2
- Add route (e.g., `POST /scope-flags/:id/generate-change-order`) that dispatches BullMQ job
- OR: dispatch job from `scopeFlagService.confirm()` on status change to "confirmed"
- **File:** `apps/api/src/routes/scope-flag.route.ts`

### T-S1-005 | 🟠 | Add agency approve/reject deliverable routes
**Agent:** AGENT-BE | **Points:** 2
- Add `PATCH /deliverables/:id/approve` and `PATCH /deliverables/:id/reject` to agency API
- Route to `deliverableService.approve()` / `requestRevision()` to create approval_events records
- **File:** `apps/api/src/routes/deliverable.route.ts`

### T-S1-006 | 🟠 | Start reminder worker
**Agent:** AGENT-BE | **Points:** 1
- Call `startReminderWorker()` from `apps/api/src/index.ts`
- **File:** `apps/api/src/index.ts`

### T-S1-007 | 🟠 | Wire transactional email dispatch
**Agent:** AGENT-BE | **Points:** 3
- Dispatch `ChangeOrderSentEmail` when change order status → "sent"
- Dispatch `ChangeOrderAcceptedEmail` when client accepts
- Dispatch `DeliverableReadyEmail` when deliverable uploaded
- Replace raw `fetch()` in `clarification-email.service.ts` with Resend SDK

### T-S1-008 | 🟠 | Add rate limiting to auth routes
**Agent:** AGENT-SEC | **Points:** 2
- Apply `rateLimiter` to `POST /auth/login` (5/min) and `POST /auth/register` (3/hr)
- Replace `listUsers()` with `createUser` + error handling for duplicate emails
- **File:** `apps/api/src/routes/auth.route.ts`

### T-S1-009 | 🟠 | Fix portal auth client lookup
**Agent:** AGENT-SEC | **Points:** 2
- Replace full table scan with indexed query on `clients.portalTokenHash`
- Remove `.limit(100)` cap
- Add index on `portalTokenHash` column if not present
- **File:** `apps/api/src/middleware/portal-auth.ts`

### T-S1-010 | 🟠 | Migrate projects.portalToken to hashed storage
**Agent:** AGENT-BE + AGENT-DB | **Points:** 3
- Add `portalTokenHash` column to `projects` table
- Migration to hash existing plaintext tokens
- Update portal-auth.ts legacy path to use hash comparison

---

## Sprint 2 — AI Pipeline Hardening (Week 3-4)

### T-S2-001 | 🟠 | Migrate change order generation to tool_use mode
**Agent:** AGENT-AI | **Points:** 5
- Create `ChangeOrderOutput` Pydantic model in `schemas/`
- Update `generate_change_order_worker.py` to use `tool_use` mode
- Remove regex JSON parsing
- **Acceptance:** All 3 fields (title, work_description, pricing) validated by Pydantic

### T-S2-002 | 🟠 | Fix stale model versions
**Agent:** AGENT-AI | **Points:** 1
- Update `generate_change_order_worker.py` and `parse_sow_worker.py` to `claude-sonnet-4-6`
- Update `main.py` clarity endpoint to current Haiku model
- **Acceptance:** All services use the same model family

### T-S2-003 | 🟠 | Add job timeout and dead letter queue
**Agent:** AGENT-AI | **Points:** 3
- Configure `lockDuration`, `stalledInterval`, `attempts` in all BullMQ worker options
- Add DLQ queue for failed jobs
- Log job failure to Axiom

### T-S2-004 | 🟠 | Add /health endpoint and fix FastAPI issues
**Agent:** AGENT-AI | **Points:** 2
- Add `GET /health` endpoint returning service status
- Apply `CORSMiddleware` (uncomment)
- Replace bare `except: pass` with specific exception types
- Create Anthropic client as application-level singleton
- Use `asyncio.run()` instead of deprecated `get_event_loop()`
- Use FastAPI `lifespan` instead of deprecated `@app.on_event`

### T-S2-005 | 🟠 | Enforce minimum flag count for low-scoring briefs
**Agent:** AGENT-AI | **Points:** 1
- In `brief_scorer.py`: if `score < threshold and len(flags) < 3`, generate additional flags
- Add validator to `BriefScoreResult` Pydantic model
- **File:** `apps/ai/app/services/brief_scorer.py`

### T-S2-006 | 🟡 | Add prompt version headers
**Agent:** AGENT-AI | **Points:** 2
- Add version string, date, and changelog comment to all 5 prompt files
- Pin model version reference in each prompt file header

---

## Sprint 3 — Frontend Completion (Week 4-6)

### T-S3-001 | 🟠 | Add password reset flow
**Agent:** AGENT-FE | **Points:** 3
- Create `apps/web/src/app/(auth)/forgot-password/page.tsx`
- Create `apps/web/src/app/(auth)/reset-password/page.tsx`
- Wire Supabase `resetPasswordForEmail()` and `updateUser()` flows
- Add routes to `publicPaths` in middleware

### T-S3-002 | 🟠 | Implement DnD Kit in FormBuilder
**Agent:** AGENT-FE | **Points:** 5
- Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Replace ArrowUp/ArrowDown buttons with `DndContext` + `SortableContext` + `useSortable`
- Keyboard accessibility via DnD Kit keyboard sensor
- Mobile touch support via PointerSensor
- **File:** `apps/web/src/components/brief/FormBuilder.tsx`

### T-S3-003 | 🟠 | Implement ChangeOrderPDF
**Agent:** AGENT-FE | **Points:** 5
- Install `@react-pdf/renderer`
- Create `ChangeOrderPDF.tsx` with: header, work description block, pricing table, signature line
- Use brand colors from workspace CSS vars
- Add "Download PDF" button to ChangeOrderEditor
- Wire server-side PDF generation OR client-side rendering

### T-S3-004 | 🟠 | Persist reminder settings to API
**Agent:** AGENT-FE | **Points:** 2
- Replace `localStorage` reads/writes in `settings/reminders/page.tsx`
- Call `PATCH /v1/workspaces/me` to save `reminderSettings`
- **File:** `apps/web/src/app/(dashboard)/settings/reminders/page.tsx`

### T-S3-005 | 🟠 | Fix logo upload to use presigned URL
**Agent:** AGENT-FE | **Points:** 3
- Remove `FileReader.readAsDataURL()` approach
- Use presigned URL flow (same as deliverables): request URL → upload → confirm with key
- Add `POST /v1/workspaces/logo/upload-url` and `POST /v1/workspaces/logo/confirm` API endpoints

### T-S3-006 | 🟠 | Fix SOW file upload
**Agent:** AGENT-FE | **Points:** 3
- Remove placeholder string approach
- Use presigned URL flow for PDF/DOCX upload to R2
- API extracts text server-side after confirmation
- Wire to new `POST /v1/sow/upload` endpoint from T-S1-003

### T-S3-007 | 🟡 | Fix `flag: any` types in ScopeGuard components
**Agent:** AGENT-FE | **Points:** 2
- Import `ScopeFlag` type from `useScopeFlags.ts`
- Replace all 23 occurrences of `flag: any` in: ScopeFlagCard, ScopeFlagDetail, ScopeFlagList, ChangeOrderList, ScopeGuardTab, ChangeOrdersTab

### T-S3-008 | 🟡 | Design token compliance pass
**Agent:** AGENT-FE | **Points:** 3
- Replace 197 hardcoded Tailwind color classes with CSS var tokens
- Fix 3 hardcoded hex values in `ScopeMeter.tsx`
- Fix `text-[#0F6E56]` occurrences in auth/onboarding layouts

### T-S3-009 | 🟡 | Add brief submission version history
**Agent:** AGENT-FE | **Points:** 3
- Create `BriefVersionHistory.tsx` — list of submissions by version number + timestamp
- Side-by-side diff using `diffWords()` on field content strings
- Green added / red strikethrough removed content
- **Wire to:** `useBriefs` hook version history endpoint

---

## Sprint 4 — Database & Schema Fixes (Week 5-6)

### T-S4-001 | 🟡 | Add missing schema columns
**Agent:** AGENT-DB | **Points:** 3
- `brief_fields`: add `ai_flag` (boolean default false) and `ai_flag_reason` (text nullable)
- `feedback_items`: add `author_type` enum column (agency | client)
- `statements_of_work`: add `raw_text` (text) and `status` enum column
- `sow_clauses`: add `is_active` boolean default true
- `approval_events`: convert `eventType` to proper enum reference
- Generate migration for each

### T-S4-002 | 🟡 | Add missing performance indexes
**Agent:** AGENT-DB | **Points:** 2
- Add composite index `scope_flags(project_id, status, created_at DESC)`
- Add composite index `briefs(project_id, status)`
- Add composite index `deliverables(project_id, status)`
- Add composite index `audit_log(workspace_id, entity_type, entity_id)`
- Add index on `clients.portalTokenHash` (required for T-S1-009)

### T-S4-003 | 🟡 | Add missing Drizzle relations
**Agent:** AGENT-DB | **Points:** 2
- `reminderLogs` → `project` relation
- `deliverableRevisions` → `deliverable` + `user` relations
- `messages` → `workspace` + `project` relations
- **File:** `packages/db/src/schema/relations.ts`

### T-S4-004 | 🟡 | Fix annotation coordinate storage
**Agent:** AGENT-DB | **Points:** 3
- Add `x_pos` (numeric, 0-100) and `y_pos` (numeric, 0-100) to `feedback_items`
- Migrate existing `annotationJson` data to new columns
- Update feedback service and frontend to use direct columns

---

## Sprint 5 — CI/CD, Tests, Security Hardening (Week 6-8)

### T-S5-001 | 🟠 | Set up GitHub Actions CI pipeline
**Agent:** AGENT-TEST | **Points:** 5
Create `.github/workflows/ci.yml`:
- TypeScript compiler check (`tsc --noEmit`) for all packages
- ESLint + Prettier
- Vitest unit suite with coverage report
- Playwright E2E against preview deploy
- Preview environment on PR open (Vercel preview)
- Production deploy gate (manual approval)

### T-S5-002 | 🟠 | Add missing unit tests to reach 80% coverage
**Agent:** AGENT-TEST | **Points:** 8
Missing test files to create:
- `apps/api/src/services/sow.service.test.ts`
- `apps/api/src/services/billing.service.test.ts`
- `apps/api/src/services/reminder.service.test.ts`
- `apps/api/src/routes/deliverable.route.test.ts`
- `apps/api/src/routes/scope-flag.route.test.ts`
- `apps/api/src/routes/change-order.route.test.ts`
- `apps/api/src/routes/message-ingest.route.test.ts`
- `packages/db/src/__tests__/helpers.test.ts`

### T-S5-003 | 🟡 | Fill E2E test gaps
**Agent:** AGENT-TEST | **Points:** 5
- T-CP-007: Annotation coordinate normalization at 375/768/1440px
- T-SF-004: Confidence threshold boundary test (0.61 vs 0.60)
- T-SF-006: False positive rate corpus test (20 messages, assert <15%)
- T-SF-007: Reminder sequence timing simulation

### T-S5-004 | 🟡 | Switch main rate limiter to Redis-backed
**Agent:** AGENT-BE | **Points:** 2
- Replace in-memory `Map` store in `rate-limiter.ts` with Redis sliding window
- Match pattern from existing `portal-rate-limiter.ts`

### T-S5-005 | 🟡 | Add runtime plan-gating enforcement
**Agent:** AGENT-BE | **Points:** 3
- In `clientService.create()`: check `workspace.features.maxClients` before creating
- In `projectService.create()`: check `workspace.features.maxProjects`
- Return `ForbiddenError` with plan upgrade message

### T-S5-006 | 🟡 | OAuth state parameter validation
**Agent:** AGENT-SEC | **Points:** 2
- Verify Supabase `exchangeCodeForSession` handles state internally
- If not: add state cookie generation in `signInWithOAuth()` call and validation in callback

### T-S5-007 | 🟡 | Move Stripe/AI env vars into Zod env schema
**Agent:** AGENT-BE | **Points:** 2
- Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AI_CALLBACK_SECRET`, `RESEND_WEBHOOK_SECRET` to `envSchema`
- Remove `?? undefined` fallbacks that allow startup without required vars

---

## Sprint 6 — Polish & Launch Prep (Week 8-10)

### T-S6-001 | Responsiveness pass
- Fix `FeedbackPanel` at tablet (`w-80` to responsive collapse)
- Add error.tsx + loading.tsx to all dashboard routes
- Verify all portal pages at 375px, 768px, 1280px, 1440px

### T-S6-002 | Design system enforcement
- Complete design token compliance pass (from T-S3-008)
- Enforce no hardcoded colors via ESLint custom rule

### T-S6-003 | Performance audit
- LCP measurement on dashboard, portal, brief form
- Verify no blocking AI operations
- Confirm Framer Motion used sparingly

### T-S6-004 | Staging environment validation
- Full E2E test suite run against staging
- Security scan on staging (OWASP ZAP or equivalent)
- Load test scope flag detection SLA (<5s p95)

---

## Priority Ordering Summary

```
Week 1:  T-S0-001 through T-S0-007  (Critical fixes — nothing else works without these)
Week 2:  T-S1-001 through T-S1-010  (Backend structural fixes)
Week 3:  T-S2-001 through T-S2-006  (AI pipeline hardening)
Week 4:  T-S3-001 through T-S3-006  (Frontend feature completion)
Week 5:  T-S3-007, T-S3-008, T-S4-001 through T-S4-004
Week 6:  T-S5-001, T-S5-002         (CI pipeline + test coverage)
Week 7:  T-S5-003 through T-S5-007  (Remaining hardening)
Week 8+: T-S6-001 through T-S6-004  (Polish + launch prep)
```

## Real-World Inspiration Map

| Feature | Inspired By | Pattern |
|---|---|---|
| Form Builder (DnD) | Typeform, Tally | Card inputs, one-question-per-screen on mobile |
| Brief Score Ring | Grammarly | Animated SVG ring, per-section flag list |
| Annotation Canvas | Figma, Markup.io | Click-to-pin numbered circles, bidirectional hover |
| Scope Flag Card | Stripe Radar, Intercom | Severity border, confidence bar, 3-action row |
| Revision Counter | Linear, DocuSign | Color-coded urgency, inline limit warning |
| Change Order | PandaDoc, Bonsai | Document-style layout, line-item pricing, typed signature |
| Reminder Sequence | Linear, GitHub PR | Progressive escalation, silence-as-approval |
| Portal Branding | HoneyBook, Dubsado | CSS var injection, custom domain, no watermark |
| AI Suggested Response | Intercom Copilot | Editable suggestion, copy button, send flow |
