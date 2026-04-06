---
name: scopeiq-dev
description: Full-stack ScopeIQ development skill for this monorepo. Use when building features, reviewing code, debugging implementation details, writing tests, planning architecture, or working across Next.js 14, Hono, FastAPI, Drizzle, BullMQ, Docker, and shared packages in this repository.
---

# ScopeIQ Dev

## Overview

Use this skill as the default project-specific guide for work in this repository. It consolidates the project rules, stack expectations, and handoff points across frontend, backend, AI, testing, debugging, and DevOps.

## Enforce Project Rules

Apply these rules on every change:

1. Keep TypeScript strict. Avoid `any`, `@ts-ignore`, and casual type assertions.
2. Use Drizzle and include `workspaceId` in every tenant-scoped query.
3. Route AI work through queue jobs to `apps/ai`; do not import provider SDKs in web or API code.
4. Use presigned uploads; do not accept file bytes in API bodies.
5. Keep secrets out of client bundles; only `NEXT_PUBLIC_` vars belong in web.
6. Write `audit_log` entries for mutations in the same transaction when applicable.
7. Add tests for critical behavior, especially P0 paths.

## Repo Map

```text
apps/web      Next.js 14 App Router
apps/api      Hono + Node.js
apps/ai       FastAPI + Python
packages/db   Drizzle schema and database utilities
packages/ui   Shared UI components and tokens
packages/types Shared types
packages/config Shared config
```

## Working Pattern

1. Read the relevant implementation before proposing a change.
2. Keep server components as the default in `apps/web`.
3. Put pure data access in repositories, business logic in services, validation in routes.
4. Use consistent response shapes: `{ data }` or `{ data, pagination }`.
5. Throw typed errors instead of swallowing failures.
6. Verify with targeted tests after changes.

## Use Specialized Skills

- For motion-heavy UI work, read [references/premium-web-animations.md](references/premium-web-animations.md).
- For defect investigation and incident-style debugging, read [references/senior-debugging.md](references/senior-debugging.md).
- Prefer the dedicated repo-local skills `backend-dev`, `frontend-dev`, `qa-engineer`, `tech-lead`, `devops`, or `senior-debugger` when the task is clearly specialized.

