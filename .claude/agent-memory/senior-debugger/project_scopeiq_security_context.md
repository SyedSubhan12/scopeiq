---
name: ScopeIQ Security Audit Context
description: Key security findings and patterns from security audits of ScopeIQ (April 2026)
type: project
---

Comprehensive security audits performed 2026-04-09 and 2026-04-10. Key patterns to be aware of in future sessions:

**Why:** This is the first full security audit of the B2B SaaS platform. Findings serve as baseline.

**How to apply:** When reviewing any API route changes, portal auth changes, or webhook handlers, reference these known patterns.

Key findings:
- `.env` file is in the git repo root but IS listed in `.gitignore` — the file contains real Supabase keys and a real Resend API key. Was this committed at any point? Check git history.
- `EMAIL_APPROVAL_SECRET` defaults to `"change-this-in-production"` in email-approval.route.ts:6 — silently insecure if env var not set
- `AI_CALLBACK_SECRET` defaults to `"dev-secret-change-me"` in brief-scoring-worker.service.ts:7 — same problem
- `portalRateLimiter` (portal-rate-limiter.ts) is defined but NEVER imported/used anywhere in routes — portal token validation endpoint has no rate limiting
- `ai.route.ts` imports authMiddleware but never calls `aiRouter.use("*", authMiddleware)` — the `/v1/ai/predict-clarity` endpoint is unauthenticated
- `auth.route.ts` register endpoint calls `supabase.auth.admin.listUsers()` with no pagination — O(n) scan of ALL users on every registration
- Portal rate limiter correctly uses Redis sliding window; regular rate limiter uses in-memory store (lost on restart, no horizontal scale protection)
- Storage presigned URLs expire in 3600s (1 hour) — best practice is 900s (15 min) for uploads
- Legacy `portalToken` (projects.portalToken) stored in PLAINTEXT in DB; new client tokens use hashed storage. Mixed system.
- `dangerouslySetInnerHTML` in portal layout injects CSS vars from `brandColor` fetched from API — brandColor is NOT sanitized, potential CSS injection
- `clarification-email.service.ts` builds HTML email with unsanitized `clientName`, `projectName`, `f.fieldLabel`, `f.prompt` from DB — stored XSS vector in email content
- `NEXT_PUBLIC_APP_URL` used in API server code (not a valid server-side env var name; no `NEXT_PUBLIC_` vars should be in API)
- `confirmBriefAttachmentSchema` does not validate that `objectKey` starts with the expected prefix — client can supply arbitrary object keys
- `/portal/:token` (portal.route.ts) does NOT check `portalEnabled` flag — even disabled projects expose data
- `notification.route.ts` uses `parseInt(limit, 10)` with no bounds checking — pass limit=999999 for expensive query
