<!-- converted from Novabots_ScopeIQ_MasterPrompt.docx -->



# 1. Purpose
This Master Prompt Document is the single authoritative reference for any AI coding assistant (Claude, Cursor, GitHub Copilot) working on the ScopeIQ codebase by Novabots. Provide this document in full as a system prompt or project context file at the start of every AI-assisted development session. Do not summarize or truncate it.

Senior developers should review and update this document at the start of each sprint to reflect architectural decisions from the previous cycle. Any deviation from these standards requires explicit sign-off from the lead architect.

# 2. Project Overview


ScopeIQ is a B2B SaaS platform by Novabots that protects the revenue and workflows of creative agencies and freelancers through AI-powered scope enforcement, structured client approvals, and intelligent brief qualification. Three integrated modules: Brief Builder (AI-scored intake forms), Approval Portal (branded deliverable review with revision tracking), and Scope Guard (real-time SOW monitoring and change order generation).


# 3. Strict Execution Rules
These rules are non-negotiable. Violations will be caught in code review and require rework. Apply all rules to every contribution regardless of perceived convenience.

All TypeScript must compile with strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true. Never use // @ts-ignore or any cast unless accompanied by a detailed comment explaining why it is unavoidable and what the actual type is. Reaching for any is almost always a signal to model the types properly instead.

Never write raw SQL strings in application code. All database operations must go through Drizzle ORM using the schema in packages/db/schema.ts. If a query cannot be expressed with the Drizzle query builder, use Drizzle's sql template tag which still provides type safety. Raw pg queries are forbidden — bypassing Drizzle bypasses row-level security.

No component, route handler, or API endpoint may import the Anthropic SDK directly. All AI operations must be dispatched as BullMQ jobs to the Redis queue and processed by the FastAPI AI Gateway service. This ensures rate limit management, retry logic, cost attribution, and model version control happen in one place. Exception: local dev testing via /api/ai/test endpoint gated behind DEV_MODE env flag only.

Never accept file content in API request bodies. Follow the presigned URL pattern: client requests a presigned upload URL from the API → client uploads directly to R2/S3 using that URL → client confirms upload to API with the returned object key. This prevents large files from consuming API server memory at any scale.

Nothing that is not explicitly NEXT_PUBLIC_ prefixed may be referenced in any file inside apps/web/src. API keys, Stripe secret keys, database URLs, and the Anthropic API key must never appear in any client-side bundle. Use Server Components or API routes for operations requiring these values.

Any operation that creates, updates, or deletes a project, brief, deliverable, scope flag, or change order must write a corresponding record to audit_log as part of the same database transaction. Use the writeAuditLog(ctx, action, entityType, entityId, metadata) helper in packages/db/audit.ts. The audit log is a core product feature, not an afterthought.

Every P0 feature must have a unit test (Vitest) and at least one E2E test (Playwright). Tests must pass in CI before any PR can be merged. Unit test coverage target: 80% for packages/db and apps/api. All form submissions and state transitions must be covered by tests.

# 4. Technology Stack









# 5. Code Style Guidelines









# 6. Output Format — Files & Folder Structure

When generating new code, always output complete files rather than partial snippets. If modifying an existing file, show the complete modified file unless it exceeds 300 lines, in which case show only changed sections with a minimum of 10 lines of context above and below each change.






When implementing any new feature, generate all of the following files in this order. Each file must be complete and immediately runnable — no TODOs, no placeholders, no 'you would add X here' comments.



Novabots — ScopeIQ — Confidential — 2026
| ScopeIQ
Master Prompt Document
Novabots Engineering  |  AI Dev Reference · Tech Stack · Code Standards · Folder Structure  |  v1.0  |  2026 |
| --- |
| What ScopeIQ Does |
| --- |
| Company | Novabots |
| --- | --- |
| Product | ScopeIQ |
| Stage | MVP v1.0 — Active Development |
| Target Launch | Q3 2026 |
| Repo Structure | Turborepo monorepo: apps/web (Next.js), apps/api (Node/Hono), apps/ai (Python/FastAPI), packages/db (Drizzle schema), packages/ui (components) |
| Core Constraint | Every architectural decision must be reversible or extensible. No premature optimization. Ship working software first — make it elegant in iteration. |
| Rule 1 — TypeScript Strict Mode Everywhere |
| --- |
| Rule 2 — Database Access Only via Drizzle ORM |
| --- |
| Rule 3 — All AI Calls Through the AI Gateway |
| --- |
| Rule 4 — File Uploads Only via Presigned URLs |
| --- |
| Rule 5 — No Client-Side Secrets |
| --- |
| Rule 6 — Every Mutation Must Write to audit_log |
| --- |
| Rule 7 — Tests Required for All P0 Features |
| --- |
| 4.1 Frontend — apps/web |
| --- |
| Framework:       Next.js 14  (App Router + React Server Components)
Language:        TypeScript 5.4  (strict mode enforced)
Styling:         Tailwind CSS v3.4 + CSS variables for Novabots design tokens
Components:      Radix UI primitives + custom ScopeIQ component layer
State:           Zustand (global UI state)  +  React Query v5 (server state)
Forms:           React Hook Form  +  Zod resolver
Drag & Drop:     DnD Kit
PDF Viewer:      React-PDF
Charts:          Recharts
Icons:           Lucide React
Animation:       Framer Motion (sparingly — only meaningful transitions)
Testing:         Vitest (unit)  +  Playwright (E2E)
Linting:         ESLint (Next.js config)  +  Prettier |
| --- |
| 4.2 Backend API — apps/api |
| --- |
| Runtime:         Node.js 20 LTS
Framework:       Hono v4  (lightweight, edge-compatible, TypeScript-first)
Language:        TypeScript 5.4  (strict mode)
Validation:      Zod  (all request/response schemas)
ORM:             Drizzle ORM v0.30
Auth Verify:     Supabase JWT verification middleware
Job Queue:       BullMQ  (dispatch only — no job processing in API)
Email:           Resend SDK
Payments:        Stripe Node.js SDK
Logging:         Axiom structured JSON logger
Error Tracking:  Sentry Node.js SDK
Testing:         Vitest  +  Supertest for route integration tests |
| --- |
| 4.3 AI Service — apps/ai |
| --- |
| Runtime:         Python 3.12
Framework:       FastAPI 0.110
AI Provider:     Anthropic Python SDK  (claude-sonnet-4-6)
Queue Worker:    BullMQ Python client  (job worker, not dispatcher)
Validation:      Pydantic v2
PDF Parsing:     PyMuPDF  (fitz)
Testing:         pytest  +  pytest-asyncio
Logging:         Structlog  (JSON output → Axiom)
Concurrency:     asyncio + uvicorn ASGI  (fully async throughout) |
| --- |
| 4.4 Shared Packages |
| --- |
| packages/db/        Drizzle schema, migration files, query helpers, audit helper
packages/ui/        Shared React components (Button, Input, Badge, Card...)
packages/config/    Shared ESLint, Prettier, TypeScript base configs
packages/types/     Cross-package TypeScript types and error classes |
| --- |
| 5.1 Naming Conventions |
| --- |
| React components:      PascalCase.tsx         ScopeFlagCard.tsx
Utility functions:     camelCase.ts           formatCurrency.ts
Server actions:        kebab-case.action.ts   create-project.action.ts
API route handlers:    kebab-case.route.ts    scope-flags.route.ts
DB schema files:       kebab-case.schema.ts   scope-flags.schema.ts
Test files:            same-name.test.ts      ScopeFlagCard.test.ts
E2E test files:        kebab-case.spec.ts     scope-flag-flow.spec.ts
Custom React hooks:    useCamelCase.ts        useScopeFlags.ts
Constants:             SCREAMING_SNAKE_CASE   (in constants/ subdirectory) |
| --- |
| 5.2 Component File Structure (strict order) |
| --- |
| 1.  'use client' or 'use server' directive  (if applicable)
2.  External library imports  (React, Next.js, third-party packages)
3.  Internal absolute imports  (@/components, @/lib, @novabots/ui)
4.  Internal relative imports  (./SiblingComponent)
5.  Type definitions for this file only
6.  Constants used only within this component
7.  The component function  (default export)
8.  Named exports  (sub-components, exported types) |
| --- |
| 5.3 Hono API Route Pattern |
| --- |
| import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { createScopeFlagSchema } from './scope-flags.schemas';
import { scopeFlagService } from '../services/scope-flag.service';

const scopeFlags = new Hono()
  .use('*', authMiddleware)                     // Auth middleware first

  .get('/:projectId', async (c) => {            // List flags
    const { projectId } = c.req.param();
    const workspaceId  = c.get('workspaceId'); // From auth middleware
    const flags = await scopeFlagService.list(workspaceId, projectId);
    return c.json({ data: flags });
  })

  .post('/',
    zValidator('json', createScopeFlagSchema),  // Validate before handler
    async (c) => {
      const body = c.req.valid('json');
      // ... service call
    }
  );

export { scopeFlags }; |
| --- |
| 5.4 Database Query Pattern — Defense in Depth |
| --- |
| // ALWAYS include workspaceId in queries — RLS alone is not sufficient.
// Application-layer + database-layer must both enforce workspace isolation.

// ✅ CORRECT — explicit workspace filter in every query
const project = await db
  .select()
  .from(projects)
  .where(and(
    eq(projects.id, projectId),
    eq(projects.workspaceId, workspaceId)  // Always include this
  ))
  .limit(1);

// ❌ WRONG — relying on RLS alone (missing workspaceId filter)
const project = await db
  .select()
  .from(projects)
  .where(eq(projects.id, projectId)); |
| --- |
| 6.1 Monorepo Structure |
| --- |
| scopeiq/                           ← Turborepo monorepo root
├── apps/
│   ├── web/                       ← Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/               ← App Router pages and layouts
│   │   │   │   ├── (auth)/        ← Login, register, password reset
│   │   │   │   ├── (dashboard)/   ← Agency dashboard route group
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── briefs/
│   │   │   │   │   ├── scope-flags/
│   │   │   │   │   └── settings/
│   │   │   │   └── portal/        ← Client portal (white-label)
│   │   │   │       └── [token]/   ← Dynamic route per project
│   │   │   ├── components/
│   │   │   │   ├── brief/         ← Brief Builder components
│   │   │   │   ├── approval/      ← Approval Portal components
│   │   │   │   ├── scope-guard/   ← Scope Guard components
│   │   │   │   └── shared/        ← Cross-module shared components
│   │   │   ├── hooks/             ← Custom React hooks
│   │   │   ├── lib/               ← Utilities, formatters, constants
│   │   │   ├── stores/            ← Zustand stores
│   │   │   └── types/             ← Frontend-only types
│   │   └── tests/e2e/             ← Playwright E2E tests
│   │
│   ├── api/                       ← Hono Node.js Core API
│   │   └── src/
│   │       ├── routes/            ← Route handlers (one file per resource)
│   │       ├── services/          ← Business logic (calls repositories)
│   │       ├── repositories/      ← Data access layer (Drizzle queries)
│   │       ├── middleware/        ← Auth, rate limiting, error handling
│   │       └── jobs/              ← BullMQ job dispatch helpers
│   │
│   └── ai/                        ← Python FastAPI AI Gateway
│       ├── app/
│       │   ├── workers/           ← BullMQ job workers (one per operation)
│       │   ├── services/          ← AI orchestration logic
│       │   ├── prompts/           ← Versioned Claude prompt templates
│       │   └── schemas/           ← Pydantic I/O schemas
│       └── tests/
│
├── packages/
│   ├── db/                        ← Drizzle schema + migrations
│   │   ├── schema/                ← One file per domain entity
│   │   ├── migrations/            ← Auto-generated migration files
│   │   └── src/                   ← Query helpers + audit log helper
│   ├── ui/                        ← Shared React component library
│   ├── config/                    ← ESLint, Prettier, TS base configs
│   └── types/                     ← Cross-package types + error classes
│
├── turbo.json                     ← Turborepo pipeline config
├── package.json                   ← Root workspace manager
└── .env.example                   ← All env vars documented |
| --- |
| 6.2 Environment Variables |
| --- |
| # Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role]       # API only — NEVER in web
DATABASE_URL=postgresql://...                  # API + packages/db only

# Anthropic (AI service only — NEVER in web or api)
ANTHROPIC_API_KEY=[key]

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[pk_...]
STRIPE_SECRET_KEY=[sk_...]                     # API only
STRIPE_WEBHOOK_SECRET=[whsec_...]              # API only

# Cloudflare R2
R2_ACCOUNT_ID=[id]
R2_ACCESS_KEY_ID=[key]
R2_SECRET_ACCESS_KEY=[secret]
R2_BUCKET_NAME=scopeiq-files
NEXT_PUBLIC_R2_PUBLIC_URL=https://files.scopeiq.com

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=[url]
UPSTASH_REDIS_REST_TOKEN=[token]

# Resend Email
RESEND_API_KEY=[key]

# Monitoring
SENTRY_DSN=[dsn]                               # Both web and api
AXIOM_TOKEN=[token]
AXIOM_DATASET=scopeiq-logs

# Feature flags (local dev only)
DEV_MODE=false |
| --- |
| 6.3 New Feature Implementation Checklist |
| --- |
| Step | File to Generate | Location |
| --- | --- | --- |
| 1 | Drizzle table definition and types | packages/db/schema/[feature].schema.ts |
| 2 | Database migration (via drizzle-kit generate) | packages/db/migrations/[timestamp]_[feature].sql |
| 3 | Data access layer — all DB queries | apps/api/src/repositories/[feature].repository.ts |
| 4 | Business logic service — calls repository, dispatches jobs | apps/api/src/services/[feature].service.ts |
| 5 | Zod request/response schemas | apps/api/src/routes/[feature].schemas.ts |
| 6 | Hono route handler with validation | apps/api/src/routes/[feature].route.ts |
| 7 | Vitest unit tests for service | apps/api/src/services/[feature].service.test.ts |
| 8 | React Query hook for data fetching and mutations | apps/web/src/hooks/use[Feature].ts |
| 9 | Primary display component | apps/web/src/components/[module]/[Feature]Card.tsx |
| 10 | Playwright E2E test (happy path + error path) | apps/web/tests/e2e/[feature]-flow.spec.ts |