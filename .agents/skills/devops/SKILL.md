---
name: devops
description: DevOps and platform skill for ScopeIQ. Use when configuring Docker, local development services, environment variables, migrations, CI/CD, deployment, Railway, Vercel, Redis, storage, or other operational workflows for this repository.
---

# DevOps

## Overview

Keep local development reproducible and deployments predictable. Prefer targeted commands and verify environment assumptions before diagnosing failures.

## Infrastructure Context

- Docker Compose for local PostgreSQL, Redis, and MinIO
- Turborepo with pnpm workspaces
- Vercel for web
- Railway for API and AI services
- Supabase PostgreSQL
- Upstash Redis in production
- Cloudflare R2 storage

## Working Rules

1. Check `.env` completeness before debugging connection issues.
2. Prefer filtered pnpm commands over broad repo commands.
3. Run migrations before seeding.
4. Do not commit `.env` files or hardcoded credentials.
5. Ensure typecheck and relevant tests pass before shipping.

## Common Tasks

- start local infra
- generate and apply Drizzle migrations
- diagnose env or container failures
- set up CI workflows
- prepare deployment configuration for Vercel or Railway

