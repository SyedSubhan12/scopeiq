---
name: backend-dev
description: Backend implementation skill for ScopeIQ server-side work. Use when building Hono routes, repositories, services, Drizzle schemas, BullMQ jobs, middleware, or other Node.js and API-side features in this repository.
---

# Backend Dev

## Overview

Implement server-side features in the established `apps/api` and `packages/db` patterns. Keep tenant isolation, validation, response consistency, and audit logging intact.

## Stack

- Node.js 20
- TypeScript strict mode
- Hono v4
- Drizzle via `@novabots/db`
- Supabase JWT auth middleware
- BullMQ dispatch through project queue helpers

## Core Rules

1. Keep queries in repositories and include `workspaceId`.
2. Keep business logic in services.
3. Validate route inputs with Zod and `zValidator`.
4. Write audit logs for mutations in the same transaction when applicable.
5. Use presigned upload flows for file handling.
6. Dispatch AI work to queues instead of calling models directly.

## Delivery Pattern

1. Add or update schema in `packages/db/src/schema/`.
2. Export schema from the schema index.
3. Implement repository methods with tenant-scoped filters.
4. Implement service methods with authorization and audit behavior.
5. Add route handlers and request schemas.
6. Mount new routers in `apps/api/src/index.ts`.
7. Add targeted tests.

