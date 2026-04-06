---
name: scopeiq-dev
description: Full-stack development skill for ScopeIQ — a B2B SaaS for creative agencies. Covers architecture decisions, frontend (Next.js 14), backend (Hono/Node.js), AI service (Python/FastAPI), database (Drizzle/PostgreSQL), testing (Vitest/Playwright), debugging, DevOps (Docker/Turborepo), and premium animations. Use when building features, reviewing code, debugging, planning architecture, writing tests, or deploying.
---

# ScopeIQ — Full-Stack Development Skill

## Project Overview

ScopeIQ is a B2B SaaS platform by Novabots that protects creative agency revenue through AI-powered scope enforcement. It's a Turborepo monorepo with three apps and four shared packages.

### Architecture

```
scopeiq/
├── apps/
│   ├── web/         Next.js 14 (App Router + RSC) → Vercel
│   ├── api/         Hono v4 (Node.js 20) → Railway
│   └── ai/          Python 3.12 FastAPI → Railway
├── packages/
│   ├── db/          Drizzle ORM + PostgreSQL schemas
│   ├── ui/          Shared React components + design tokens
│   ├── types/       Shared TypeScript types
│   └── config/      Shared ESLint/Prettier configs
├── docker-compose.yml  (PostgreSQL 15, Redis 7, MinIO)
├── turbo.json
└── pnpm-workspace.yaml
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, Tailwind CSS 3.4, Radix UI, Zustand, React Query v5, React Hook Form + Zod, DnD Kit, Framer Motion, Lucide React |
| Backend | Node.js 20, Hono v4, Zod validation, Drizzle ORM 0.30, BullMQ, Stripe SDK, Resend SDK |
| AI Service | Python 3.12, FastAPI 0.110, Anthropic SDK (claude-sonnet-4-6), BullMQ Python, Pydantic v2, PyMuPDF |
| Infrastructure | PostgreSQL 15 (Supabase), Redis (Upstash), Cloudflare R2, Vercel, Railway |

## 7 Non-Negotiable Rules

These rules are enforced in every piece of code generated. Violations must be flagged immediately.

1. **TypeScript strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`. Never use `any`, `@ts-ignore`, or type assertions without detailed justification comments.

2. **Database via Drizzle ORM only** — No raw SQL strings. ALL queries MUST include `workspaceId` in the WHERE clause for tenant isolation. Never rely on RLS alone.

3. **AI calls via AI Gateway only** — Never import the Anthropic SDK in apps/web or apps/api. All AI operations dispatch BullMQ jobs to apps/ai (FastAPI). Exception: DEV_MODE test endpoint.

4. **File uploads via presigned URLs only** — Never accept file content in API request bodies. Three-step flow: request presigned URL → upload directly to R2 → confirm upload.

5. **No client-side secrets** — Only `NEXT_PUBLIC_` prefixed vars in apps/web. API keys, Stripe secrets, database URLs NEVER in client bundles.

6. **Every mutation writes to audit_log** — Use `writeAuditLog()` helper from `packages/db/src/audit.ts` within the same database transaction as the mutation.

7. **Tests for P0 features** — Vitest unit test + Playwright E2E for every P0 feature. 80% coverage target for packages/db and apps/api.

## Code Patterns & Conventions

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | `PascalCase.tsx` | `ScopeFlagCard.tsx` |
| Utilities | `camelCase.ts` | `formatCurrency.ts` |
| API routes | `kebab-case.route.ts` | `scope-flags.route.ts` |
| DB schemas | `kebab-case.schema.ts` | `scope-flags.schema.ts` |
| Tests | `same-name.test.ts` | `ScopeFlagCard.test.ts` |
| Hooks | `useCamelCase.ts` | `useScopeFlags.ts` |

### Component File Structure (strict order)

1. `'use client'` or `'use server'` directive
2. External library imports
3. Internal absolute imports (`@/components`, `@novabots/ui`)
4. Internal relative imports
5. Type definitions
6. Constants
7. Component function (default export)
8. Named exports

### Hono API Route Pattern

```typescript
const resource = new Hono()
  .use('*', authMiddleware)
  .get('/', async (c) => {
    const workspaceId = c.get('workspaceId');
    const data = await service.list(workspaceId);
    return c.json({ data });
  })
  .post('/', zValidator('json', schema), async (c) => {
    const body = c.req.valid('json');
    // ...
  });
```

### Database Query Pattern

```typescript
// ✅ CORRECT — always include workspaceId
import { db, table, eq, and, isNull } from '@novabots/db';

const result = await db.select().from(table)
  .where(and(eq(table.id, id), eq(table.workspaceId, workspaceId), isNull(table.deletedAt)))
  .limit(1);

// ❌ WRONG — missing workspaceId
const result = await db.select().from(table)
  .where(eq(table.id, id));
```

### Response Shape

Always use `{ data: T }` or `{ data: T, pagination: CursorPagination }`:

```typescript
return c.json({ data: result }, 201); // created
return c.json({ data: result });       // ok
return c.json({ data: { success: true } }); // deleted
```

### Error Handling

Throw, don't catch:

```typescript
throw new NotFoundError('Brief', briefId);
throw new ValidationError('Budget must be positive');
throw new ForbiddenError('Only owners can delete projects');
```

## Frontend Development (Next.js 14)

### Key Principles

- Server components by default; `"use client"` only when using hooks, event handlers, or browser APIs
- Always use `@novabots/ui` components — never write raw `<button>` or `<input>` unless inside a UI library component
- All API calls go through `fetchWithAuth()` from `@/lib/api`
- Invalidate React Query cache after mutations: `queryClient.invalidateQueries()`

### Design Tokens

Use CSS variables from `packages/ui/globals.css`, never hardcoded colors:

```
text-[rgb(var(--text-primary))]       — headings, body
text-[rgb(var(--text-secondary))]     — labels, subtext
text-[rgb(var(--text-muted))]         — placeholders, hints
bg-[rgb(var(--surface-subtle))]       — page background
border-[rgb(var(--border-default))]   — card borders, input borders
```

### React Query Hook Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api';

export function useBriefs(projectId?: string) {
  return useQuery({
    queryKey: ['briefs', projectId],
    queryFn: () => fetchWithAuth(`/v1/briefs?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; title: string }) =>
      fetchWithAuth('/v1/briefs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['briefs'] }),
  });
}
```

## Backend Development (Hono/Node.js)

### Project Structure

```
apps/api/src/
├── middleware/      auth.ts, portal-auth.ts, error.ts, logger.ts
├── repositories/   one file per entity — all Drizzle queries here
├── services/       business logic, calls repositories + writeAuditLog
├── routes/         Hono route handlers + Zod schemas
└── lib/            queue.ts, storage.ts, pagination.ts, env.ts
```

### Implementation Order

1. **Schema** — new table in `packages/db/src/schema/`
2. **Repository** — pure data access, every query includes `workspaceId`
3. **Service** — business logic + authorization, calls `writeAuditLog()` after mutations
4. **Route** — Hono route handler with Zod validation
5. **Mount** — add `v1.route("/resource", router)` to `apps/api/src/index.ts`

### Drizzle Schema Pattern

```typescript
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const examples = pgTable('examples', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  workspaceIdx: index('idx_examples_workspace').on(table.workspaceId),
}));

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
```

### BullMQ Job Dispatch

```typescript
import { dispatchJob } from './lib/queue.js';

// Dispatch AI job to apps/ai service
await dispatchJob('ai:brief-scoring', { projectId, briefId });
```

## Testing

### Vitest — Service Tests (mock repository)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from './project.service.js';
import * as repo from '../repositories/project.repository.js';
import * as db from '@novabots/db';

vi.mock('../repositories/project.repository.js');
vi.mock('@novabots/db', () => ({
  db: {},
  writeAuditLog: vi.fn(),
  generatePortalToken: vi.fn(() => 'token'),
}));

describe('projectService.createProject', () => {
  it('creates a project and writes audit log', async () => {
    vi.mocked(repo.projectRepository.create).mockResolvedValue({ id: 'proj-1', name: 'Test' } as never);
    const result = await projectService.createProject('ws-1', 'user-1', { name: 'Test', clientId: 'client-1' });
    expect(result.name).toBe('Test');
    expect(db.writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'create', entityType: 'project' })
    );
  });
});
```

### Vitest — Route Tests (mock auth)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../index.js';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('userId', 'user-1');
    c.set('workspaceId', 'ws-1');
    c.set('userRole', 'owner');
    await next();
  },
}));

describe('GET /v1/projects', () => {
  it('returns paginated projects list', async () => {
    const res = await app.request('/v1/projects', { method: 'GET' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
  });
});
```

### Playwright E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('creates a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=New Project');
    await page.fill('[name=name]', 'Test Project');
    await page.click('text=Create');
    await expect(page.locator('text=Test Project')).toBeVisible();
  });
});
```

### Edge Cases to Always Test

- Empty/null/undefined inputs
- Wrong workspace (tenant isolation)
- Soft-deleted records
- Pagination boundaries
- Concurrent mutations
- Invalid UUIDs
- Auth edge cases (expired token, missing token, wrong role)

## Debugging Methodology

### Workflow

1. **Freeze the story** — exact error, stack trace, environment, commit SHA, what changed
2. **Reproduce** — smallest path that triggers the bug
3. **Localize** — narrow from "the app" → service → handler → function → line
4. **Root cause** — state as: *Under condition X, component Y does Z, violating invariant W*
5. **Fix** — fix the invariant or mechanism, not only the symptom
6. **Verify** — re-run repro → pass; run targeted tests; consider blast radius

### Common Gap Classes

| Gap Class | What to Check |
|-----------|--------------|
| AuthZ | Authenticated but not authorized; missing workspaceId scope |
| Concurrency | Race conditions, TOCTOU, non-atomic read-modify-write |
| Null/empty | Optional chains hiding bad assumptions; empty arrays vs undefined |
| N+1 queries | Missing limit, missing index, fan-out in loops |
| Error swallowing | Empty catch, generic handlers losing context |
| Secrets/PII | Logs, client bundles, exception reports |

### Severity Labels

- **P0** — security, data corruption, widespread outage, money/legal exposure
- **P1** — major feature broken, no workaround
- **P2** — incorrect behavior with workaround
- **P3** — cosmetic, minor edge case

## DevOps & Infrastructure

### Environment Variables (`.env.example`)

```bash
# Core Services
WEB_URL=http://localhost:3000
API_URL=http://localhost:4000
AI_SERVICE_URL=http://localhost:8000

# Database
DATABASE_URL=postgres://scopeiq:scopeiq_dev@localhost:5432/scopeiq

# Redis
REDIS_URL=redis://localhost:6379

# Storage (MinIO local / R2 production)
STORAGE_ENDPOINT=localhost
STORAGE_PORT=9000
STORAGE_ACCESS_KEY=scopeiq
STORAGE_SECRET_KEY=scopeiq_dev
STORAGE_BUCKET=scopeiq-assets
STORAGE_USE_SSL=false

# Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:4000

# AI, Payments, Email
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### Common Commands

```bash
# Start all services (apps + infra)
pnpm dev

# Start just infrastructure
docker compose up -d

# Run DB migrations
pnpm --filter @novabots/db db:generate
pnpm --filter @novabots/db db:push

# Seed database
pnpm --filter @novabots/db db:seed

# Typecheck, build, test
pnpm typecheck
pnpm build
pnpm test
```

### Docker Compose Services

- PostgreSQL 15 (port 5433→5432)
- Redis 7 (port 6372→6379)
- MinIO (port 9000, console 9001)

### Deployment

| App | Platform | Notes |
|-----|----------|-------|
| apps/web | Vercel | Next.js, `NEXT_PUBLIC_*` vars in dashboard |
| apps/api | Railway | Node.js, `node dist/index.js` |
| apps/ai | Railway | Python, `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

## Premium Animations & Motion

### When to Use Motion

- Motion as **information**: every animation answers "what changed?" or "where should I look?"
- One strong focal moment over many competing effects
- UI feedback ~150–300ms; emphasis/hero ~400–900ms

### Lottie Guidelines

- Use `@lottiefiles/dotlottie-react` or `lottie-react` with **dynamic import** + `ssr: false`
- Lazy load below-the-fold Lottie
- Honor `prefers-reduced-motion` — show static poster frame
- Avoid heavy scroll-synced Lottie; prefer CSS/Canvas/WebGL for those

### Performance

- Animate `transform` and `opacity` only; avoid layout-thrashing properties in loops
- Avoid stacking heavy Lottie + complex layout animations on same element
- Profile before shipping; avoid blocking main thread with huge JSON parsers

## Output Rules

- Generate COMPLETE files, never partial snippets
- NO TODOs, NO placeholders, NO "you would add X here"
- Every file must be immediately runnable
- Follow the patterns and conventions above consistently
- Read existing code before proposing changes — never design in a vacuum
