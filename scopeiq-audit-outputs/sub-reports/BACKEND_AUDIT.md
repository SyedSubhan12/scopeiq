# AGENT-BE: Backend Architecture Audit
**Date:** 2026-04-10 | **Scope:** `apps/api/src/`

## Route Coverage Summary

| Route Group | Status | Critical Gaps |
|---|---|---|
| Briefs | ✅ Mostly complete | `PATCH /:id/override` uses POST |
| Deliverables | ⚠️ Partial | No agency-side approve/reject routes |
| Feedback | ✅ Complete | Shape difference (query param vs path param) |
| Scope Flags | ⚠️ Partial | No route to trigger generate_change_order job |
| Messages | ⚠️ Partial | Only `/ingest` exists; missing `/inbound` and `/manual` |
| Change Orders | ⚠️ Partial | Send doesn't dispatch email to client |
| Portal | ✅ Complete | Portal auth, brief, deliverables, change orders |
| SOW | ⚠️ Partial | No presigned upload route; no `/activate` route |
| Workspace | ✅ Complete | Uses `/me` instead of `/` (shape only) |
| Billing/Stripe | ✅ Complete | Webhook signature validated correctly |

## Critical Findings

### 🔴 CRITICAL: Repo Call Without Workspace Isolation
**File:** `routes/deliverable.route.ts:43`, `portal-deliverable.route.ts:42`
```typescript
// Both call this directly — no workspaceId filter
const revisions = await deliverableRevisionRepository.listByDeliverable(id);
```
Any authenticated user can read another workspace's revision history by guessing deliverable UUIDs.

### 🔴 CRITICAL: Direct DB Writes in Route Handlers (No Audit Log)
**Files:** `routes/message-ingest.route.ts:44`, `routes/sow.route.ts:54,125`
- Imports `db` directly from `@novabots/db`
- Performs inserts/updates inline
- Zero `writeAuditLog()` calls
- Well-implemented service layer (`sowService`) exists but is unused

### 🔴 CRITICAL: Repository Missing WorkspaceId
**File:** `repositories/deliverable-revision.repository.ts:14`
```typescript
// Missing workspaceId — exploitable via ID enumeration
.where(eq(deliverableRevisions.deliverableId, deliverableId))
```

## High Priority Findings

| # | File | Finding |
|---|---|---|
| H1 | `routes/deliverable.route.ts` | No `PATCH /:id/approve` or `/:id/reject` — agency approval bypasses event creation |
| H2 | `routes/scope-flag.route.ts` | `dispatchGenerateChangeOrderJob` imported nowhere — change order AI broken |
| H3 | `routes/message-ingest.route.ts` | Only `/ingest` exists; missing `/inbound` (email webhook) and `/manual` |
| H4 | `services/change-order.service.ts:244` | Status="sent" doesn't dispatch `ChangeOrderSentEmail` |
| H5 | `routes/sow.route.ts` | No `POST /upload` (presigned URL) and no `POST /:id/activate` |
| H6 | `services/project.service.ts:147` | `data: any` parameter — violates strict mode |
| H7 | `emails/index.ts` | `ChangeOrderSentEmail`, `ChangeOrderAcceptedEmail`, `DeliverableReadyEmail` — registered but never dispatched |
| H8 | `index.ts` | `startReminderWorker()` never called — reminder jobs enqueue but never process |

## Medium Priority Findings

| # | File | Finding |
|---|---|---|
| M1 | `middleware/portal-auth.ts:48` | Full clients table scan with `.limit(100)` — fails for workspace with >100 clients |
| M2 | `index.ts:65,100` | `inviteRouter` mounted twice — unclear auth intent |
| M3 | `routes/portal-session.route.ts:191,193,415` | Three `any` type usages |
| M4 | `routes/ai-callback.route.ts:246` | `severity: (payload.suggestedSeverity as any)` |
| M5 | `middleware/rate-limiter.ts` | In-memory store — not multi-process or restart safe |
| M6 | `billing.service.ts` | No runtime plan-gating enforcement on resource creation |
| M7 | `lib/env.ts` | Stripe, AI, storage env vars not in Zod env schema |
| M8 | `repositories/brief-attachment.repository.ts` | `listByBriefId()` / `listByBriefAndField()` — no workspace guard |

## BullMQ Job Dispatch Status

| Job | Dispatched From | Status |
|---|---|---|
| `score_brief` | `brief.service.ts` | ✅ Correct |
| `check_scope` (messages) | `message-ingest.route.ts` | ✅ Correct |
| `check_scope` (feedback) | `feedback.service.ts` | ⚠️ Uses minimal version without SOW clauses |
| `generate_change_order` | NOWHERE | ❌ BROKEN — job function defined but never dispatched |
| `send_reminder` | `index.ts` (enqueue only) | ⚠️ Worker never started |
| `parse_sow` | `sow.route.ts` | ✅ Dispatched but route bypasses service layer |
