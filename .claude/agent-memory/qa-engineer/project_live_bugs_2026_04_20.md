---
name: Live API Bugs Found 2026-04-20
description: Confirmed bugs found during live API QA testing on 2026-04-20 — runtime 500s, missing routes, migration gaps
type: project
---

## BUG-01: Portal rate limiter 429 returned as 500
**Severity:** HIGH
**Location:** `apps/api/src/middleware/portal-rate-limiter.ts` + `apps/api/src/middleware/error.ts`
**Symptom:** When portal rate limit (10 req/hour/IP) is exceeded, endpoint returns `500 INTERNAL_SERVER_ERROR` instead of `429 Too Many Requests`. The `Retry-After` header IS set correctly.
**Root cause:** `portalRateLimiter` throws `HTTPException(429)` from Hono. `app.onError(errorHandler)` replaces ALL Hono error handling. `errorHandler` only catches `AppError` instances, so `HTTPException` falls through to the generic `500` branch.
**Fix:** Add `if (err instanceof HTTPException) return err.getResponse(c);` at the top of errorHandler, before the AppError check.
**How to reproduce:** Make 11+ requests to any `/portal/*` endpoint from the same IP within 1 hour (uses Redis on port 6372, key `ratelimit:portal:unknown` for local).

## BUG-02: GET /v1/change-orders returns 500 (all change-order routes broken)
**Severity:** CRITICAL
**Location:** `apps/api/src/routes/change-order.route.ts`, `apps/api/src/services/change-order.service.ts`
**Symptom:** Every authenticated change-order endpoint (GET /, POST /, GET /:id) returns 500. GET /count works fine.
**Root cause:** Not yet fully confirmed — server logs unavailable. Narrowed to: the route module loads correctly (import of generateChangeOrderDiffPdf from change-order-pdf.ts works, email templates exist). The repository query itself (Drizzle `db.select().from(changeOrders).where(...).orderBy(...)`) may be failing. Direct SQL queries to change_orders table work. `/count` uses a different SELECT signature that works.
**Hypothesis to investigate:** Drizzle's `and(...[single_condition])` when only workspaceId filter is present (no projectId) may behave differently than `and(cond1, cond2)`.
**Status:** Cannot confirm root cause without server stderr logs. The brief_embeds table NOT existing caused a similar 500 on /v1/brief-embeds which resolved after migration.

## BUG-03: GET /v1/brief-embeds returns 500 (migration not applied)
**Severity:** HIGH — blocks a full feature area
**Location:** Database migration `packages/db/migrations/20260419000000_brief_embeds.sql`
**Symptom:** All brief-embed endpoints returned 500 because the `brief_embeds` table didn't exist.
**Root cause:** Migration was committed but never applied to the dev database.
**Fix:** Applied migration manually on 2026-04-20. Table now exists.
**Status:** RESOLVED for this dev instance.

## BUG-04: Scope flag SLA migration has invalid enum value
**Severity:** MEDIUM
**Location:** `packages/db/migrations/20260419000001_scope_flag_sla.sql`
**Symptom:** Migration references `flag_status_enum` value `'open'` which doesn't exist. Valid values: pending, confirmed, dismissed, snoozed, change_order_sent, resolved.
**Root cause:** Migration was written with incorrect enum value.
**Fix:** The `ADD COLUMN IF NOT EXISTS` part applied successfully; the UPDATE statement with `WHERE status IN ('open', 'pending')` failed with ERROR. Needs to be corrected to use only valid enum values.
**Status:** Partially applied. The columns were added successfully.

## BUG-05: GET /v1/nonexistent returns plain text 404, not JSON
**Severity:** LOW
**Location:** Hono default 404 handler in `apps/api`
**Symptom:** Unknown routes return `404 Not Found` as `text/plain; charset=UTF-8` instead of a JSON error response.
**Root cause:** app.onError only handles AppError, not Hono's built-in 404. Hono's default 404 returns plain text.
**Fix:** Add `app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));`

## BUG-06: Invalid UUID in path causes 500 instead of 400
**Severity:** MEDIUM
**Location:** Multiple routes (e.g., GET /v1/projects/:id)
**Symptom:** `GET /v1/projects/not-a-valid-uuid` returns 500 INTERNAL_SERVER_ERROR. PostgreSQL throws `invalid input syntax for type uuid` which isn't caught as a validation error.
**Root cause:** No UUID format validation on path params before they reach Drizzle queries.
**Fix:** Add Zod uuid validation on path params via zValidator("param", ...) in routes, or catch DB uuid errors in errorHandler.

## BUG-07: DELETE /v1/clients/:id route missing
**Severity:** MEDIUM
**Location:** `apps/api/src/routes/client.route.ts`
**Symptom:** DELETE /v1/clients/:id returns 404 Not Found. No DELETE handler exists.
**Root cause:** client.route.ts only has GET /, POST /, GET /:id, PATCH /:id. No DELETE route implemented.
**Status:** Clients can be soft-deleted via DB but not via the API.

## BUG-08: GET /v1/change-orders list schema mismatch
**Severity:** LOW (data display issue)
**Location:** `apps/api/src/routes/change-order.schemas.ts` `changeOrderLineItemSchema`
**Symptom:** The Zod schema expects `{id, description, hours, rate}` but actual DB data has `{unit, quantity, rate_in_cents, rate_card_name, subtotal_cents}`. `parseLineItems()` uses `safeParse()` which silently returns `[]` on parse failure, so line items are swallowed.
**Root cause:** Schema was not updated when line item format changed from hours/rate to quantity/rate_in_cents.

## BUG-09: Unapplied database migrations in dev environment
**Severity:** HIGH
**Location:** `packages/db/migrations/`
**Symptom:** 3 migrations existed but were not applied:
  - 20260419000000_brief_embeds.sql (APPLIED 2026-04-20)
  - 20260419000001_scope_flag_sla.sql (PARTIALLY APPLIED - enum error)
  - 20260419000002_unapplied_drizzle_0014_to_0017.sql (APPLIED 2026-04-20)
  - 20260420000001_marketplace_installs.sql (table already existed, APPLIED)
**Root cause:** No automated migration runner in the dev startup sequence.

## BUG-10: portal.route.ts returns portalEnabled: false despite record having portalEnabled='false'
**Severity:** LOW
**Location:** `apps/api/src/routes/portal.route.ts` line 90
**Symptom:** `portalEnabled: project.portalEnabled === "true"` — this is correct behavior (converts the varchar 'false' to boolean false). NOT a bug, but the field is stored as VARCHAR(5) not BOOLEAN which is unusual.

**Why:** Found during 2026-04-20 comprehensive live API QA audit.
**How to apply:** When testing change-order or portal endpoints, be aware of these known failures to distinguish new regressions from pre-existing bugs.
