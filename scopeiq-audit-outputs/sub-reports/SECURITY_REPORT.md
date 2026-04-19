# AGENT-SEC: Security Audit Report
**Date:** 2026-04-10 | **Verdict:** NOT launch-ready — 4 Critical, 6 High, 5 Medium

## Secret Exposure — ✅ PASS
No hardcoded secrets found in source. All client env vars correctly prefixed `NEXT_PUBLIC_`.

## Critical Vulnerabilities

### 🔴 C1 — Email Approval HMAC Forgeable
**File:** `apps/api/src/routes/email-approval.route.ts:6`
```typescript
const EMAIL_APPROVAL_SECRET = process.env.EMAIL_APPROVAL_SECRET ?? "change-this-in-production";
```
If env var unset, attacker forges valid HMAC token to approve/decline any deliverable without receiving the email.
**Fix:** Throw at startup if var is missing.

### 🔴 C2 — Auth Cookie Missing `httpOnly`
**Files:** `apps/web/src/app/auth/callback/route.ts:31`, `apps/web/src/providers/auth-provider.tsx:114`
Session token set without `httpOnly` — XSS anywhere in app steals session.
**Fix:** Add `httpOnly: true` to server-side cookie; eliminate `document.cookie` auth token writes on client.

### 🔴 C3 — Object Key Not Validated on confirmUpload (Cross-Workspace File Access)
**Files:** `apps/api/src/services/deliverable.service.ts:154`, `apps/api/src/services/brief.service.ts:1031`
```typescript
const fileUrl = await getDownloadUrl(data.objectKey);  // objectKey from client — no prefix check
```
User A supplies `objectKey = "deliverables/workspace-b-id/..."` to access another workspace's files.
**Fix:** `if (!data.objectKey.startsWith(`deliverables/${workspaceId}/${deliverableId}/`)) throw ValidationError`

### 🔴 C4 — Migration Journal Missing RLS Policies
(See DB_AUDIT.md) RLS policies likely not applied to production database — complete data isolation failure.

## High Priority

| # | File | Finding |
|---|---|---|
| H1 | `middleware/portal-auth.ts:43` | Full clients table scan with `.limit(100)` — timing oracle + correctness bug for >100 clients |
| H2 | `middleware/portal-auth.ts:28` | Legacy `projects.portalToken` stored in plaintext — DB compromise exposes all portal tokens |
| H3 | `routes/auth.route.ts` | No rate limiting on `/auth/login` or `/auth/register` — brute force open |
| H4 | `routes/auth.route.ts:32` | `listUsers()` O(n) scan with pagination gap — silently misses users after page 1 |
| H5 | `app/auth/callback/route.ts` | OAuth state parameter not validated — CSRF on auth flow |
| H6 | `index.ts:91-94` | `portalRateLimiter` defined but never applied to any portal route |

## Medium Priority

| # | File | Finding |
|---|---|---|
| M1 | `middleware/rate-limiter.ts:9` | In-memory rate limiter — resets on restart, doesn't scale horizontally |
| M2 | `routes/resend-webhook.route.ts:18` | Fail-open when `RESEND_WEBHOOK_SECRET` unset — accepts unsigned webhooks |
| M3 | `lib/storage.ts:60` | Upload presigned URLs expire in 1h — should be 15 minutes |
| M4 | `lib/storage.ts` + callers | No MIME type allowlist — polyglot file upload (HTML/JS) possible |
| M5 | `routes/ai.route.ts:9` | `/v1/ai/predict-clarity` unauthenticated — anyone can drive AI inference |

## Positives
- ✅ All repository queries include `workspaceId` scoping (defense-in-depth)
- ✅ Stripe webhook HMAC validated correctly with raw body
- ✅ Resend webhook uses `timingSafeEqual`
- ✅ Zod validation on all API inputs
- ✅ Drizzle ORM prevents SQL injection throughout
- ✅ `env.ts` validates core env vars at startup
- ✅ Portal auth uses constant-time token comparison (clients path)
