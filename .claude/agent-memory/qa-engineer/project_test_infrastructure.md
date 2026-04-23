---
name: Test Infrastructure
description: Test DB seed, Playwright config, Vitest configs, env setup, fixture patterns
type: project
---

Vitest configs exist at:
- `apps/api/vitest.config.ts` — includes `src/**/*.test.ts`, aliases @novabots/db and @novabots/types to source
- `apps/web/vitest.config.ts` — includes `src/**/*.test.ts`
- `packages/db/vitest.config.ts` — includes `src/**/*.test.ts`

Coverage thresholds: NONE configured in any vitest config. The 80% target from system prompt is not enforced.

Playwright config: `apps/web/playwright.config.ts`
- testDir: `./tests/e2e`
- workers: 1 (serial, DB tests share state)
- retries: 2 in CI
- timeout: 60s global, 10s expect
- Only Chromium configured — no Firefox or Safari

Test DB setup: `apps/web/tests/e2e/test-setup.ts`
- Real PostgreSQL via pg driver
- Seeds with deterministic UUIDs (T.workspaceId, T.projectId, etc.)
- Has cleanDatabase() and seedDatabase() functions
- Seeds: workspace, user, client, SOW, project, SOW clauses, 3 deliverables, scope flag, change order, rate card item
- Run via `npx tsx test-setup.ts [--clean]`
- Missing: no globalSetup hook in playwright.config.ts — test-setup must be run manually before E2E

No .env.test file exists — environment variables fall back to hardcoded defaults in test files.

Test helper fixtures: `apps/web/tests/e2e/helpers.ts`
- Extended Playwright `test` fixture with `testIds` and `sla` attached
- SLA constants: scopeFlagDetectionMs=5000, changeOrderGenerationMs=5000, portalPageLoadMs=2000, briefScoringMs=10000
- `getAgencyJwt()` reads from SUPABASE_JWT or TEST_AGENCY_TOKEN env vars — empty string if missing

**Why:** Real DB (no mocks) enforced for E2E. Prior incident where mocked tests passed but prod migration failed.
**How to apply:** Never mock the database for integration/E2E tests. Unit service tests mock the repository layer only.

## Live API test credentials (2026-04-20 audit)
- API: http://localhost:4000, Web: http://localhost:3000
- DB: PostgreSQL localhost:5433, database `scopeiq`, user `scopeiq`, password `scopeiq_dev`
- Redis: localhost:6372 (NOT 6379) — rate limiter uses this port, redis-cli defaults to 6379
- Supabase: https://ncsmshzgbmutxfzghlim.supabase.co
- Test JWT: set TestPass123! on syedsubhans132@gmail.com (auth_uid 4fa94e94...) via admin API
- Test workspace: 4ca7779e-4405-4809-a18f-72b35a362f3e (Acme), user 108160a2...
- Portal token (Q4 project): 8ef6f85fa262a6b1d4367d6405f2e5dde4b01b7843ce452eb8f667a616184d5c
- Portal rate limit key: ratelimit:portal:unknown — always reset with `redis-cli -p 6372 del ratelimit:portal:unknown` before portal tests
