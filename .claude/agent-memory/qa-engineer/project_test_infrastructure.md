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
