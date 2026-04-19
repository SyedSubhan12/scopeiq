---
name: Test File Locations
description: Canonical absolute paths for all project-owned test files in the ScopeIQ monorepo
type: reference
---

## API — Service Unit Tests
- `/home/syeds/scopeiq/apps/api/src/services/project.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/brief.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/brief-template.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/client.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/__tests__/change-order.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/__tests__/dashboard.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/__tests__/deliverable.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/__tests__/feedback.service.test.ts`
- `/home/syeds/scopeiq/apps/api/src/services/__tests__/scope-flag.service.test.ts`

Note: inconsistent placement — some service tests sit alongside the service file, others go into __tests__/. No standard enforced.

## API — Route Integration Tests
- `/home/syeds/scopeiq/apps/api/src/routes/brief-template.route.test.ts`
- `/home/syeds/scopeiq/apps/api/src/routes/portal-session.route.test.ts`
- `/home/syeds/scopeiq/apps/api/src/routes/portal-brief-submit.route.test.ts`

## Web — Unit Tests
- `/home/syeds/scopeiq/apps/web/src/components/brief/form-builder.utils.test.ts`
- `/home/syeds/scopeiq/apps/web/src/hooks/query-keys.test.ts`
- `/home/syeds/scopeiq/apps/web/src/hooks/useRealtimeDashboardMetrics.test.ts`

## Web — E2E Tests (Playwright)
- `/home/syeds/scopeiq/apps/web/tests/e2e/client-portal-flow.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/scope-flag-flow.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/brief-flow.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/portal-tabs.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/sidebar-counts.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/brief-builder-stack.spec.ts`
- `/home/syeds/scopeiq/apps/web/tests/e2e/helpers.ts` — shared fixtures, SLA constants, API helpers
- `/home/syeds/scopeiq/apps/web/tests/e2e/test-setup.ts` — DB seed script (run manually)

## packages/db
- `/home/syeds/scopeiq/packages/db/src/__tests__/helpers.test.ts`

## Config Files
- `/home/syeds/scopeiq/apps/api/vitest.config.ts`
- `/home/syeds/scopeiq/apps/web/vitest.config.ts`
- `/home/syeds/scopeiq/apps/web/playwright.config.ts`
- `/home/syeds/scopeiq/packages/db/vitest.config.ts`
