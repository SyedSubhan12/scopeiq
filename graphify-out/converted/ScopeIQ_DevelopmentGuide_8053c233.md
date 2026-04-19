<!-- converted from ScopeIQ_DevelopmentGuide.docx -->

ScopeIQ
Development Guide & Setup Manual
Novabots Engineering  |  v1.0  |  2026  |  Confidential

# 1. Prerequisites
Ensure the following tools are installed and configured on your development machine before cloning the repository.
## 1.1 Recommended VS Code Extensions
These are configured in .vscode/extensions.json and will be suggested on project open.
ESLint, Prettier, Tailwind CSS IntelliSense, Prisma/Drizzle ORM,
Python (Microsoft), Pylance, Thunder Client, GitLens

# 2. Initial Setup
## 2.1 Clone & Install
git clone git@github.com:novabots/scopeiq.git
cd scopeiq
pnpm install
cp .env.example .env.local
The .env.example file documents every required environment variable. Copy it to .env.local and fill in your local development credentials. Never commit .env.local.
## 2.2 Start Local Infrastructure
docker-compose up -d
This starts PostgreSQL (port 5432), Redis (port 6379), and MinIO (S3-compatible, port 9000) in containers. Health checks ensure services are ready before application startup.
# Verify services are running
docker-compose ps
## 2.3 Database Setup
# Initialize Supabase locally (runs migrations + seeds)
supabase start

# Or run Drizzle migrations directly
pnpm --filter @scopeiq/db db:push
pnpm --filter @scopeiq/db db:seed
The seed script creates a test workspace ("Demo Agency"), 3 test clients, 2 projects with sample briefs and SOWs, and pre-generated scope flags for development testing.
## 2.4 Start Development Servers
# Start all services concurrently via Turborepo
pnpm dev
This starts three processes in parallel:
## 2.5 Stripe Webhook Forwarding
# In a separate terminal window
stripe listen --forward-to localhost:4000/v1/webhooks/stripe
Copy the webhook signing secret printed by the CLI and set it as STRIPE_WEBHOOK_SECRET in .env.local.

# 3. Project Structure Overview
ScopeIQ is a Turborepo monorepo with three applications and four shared packages. See the Master Prompt Document for the complete folder hierarchy.

# 4. Development Workflow
## 4.1 Branch Strategy
Feature branches are created from main and merged via Pull Request. No direct commits to main are allowed.
## 4.2 Commit Convention
All commits follow Conventional Commits format for automated changelog generation.
feat(scope-guard): add real-time scope flag detection
fix(brief-builder): correct clarity score threshold validation
chore(deps): update Drizzle ORM to 0.31
docs(api): add change order endpoint documentation
## 4.3 PR Requirements
Every PR must pass the following automated checks before merge is allowed: TypeScript compilation (tsc --noEmit), ESLint and Prettier validation, Vitest unit test suite (80% coverage for packages/db and apps/api), and Playwright E2E tests against the preview environment. PRs require at least one approval from a code owner. All conversations must be resolved before merge.
## 4.4 Adding a New Feature
Follow the 10-step checklist defined in the Master Prompt Document. Generate files in order: Drizzle schema, migration, repository, service, Zod schemas, route handler, unit tests, React Query hook, display component, and E2E test. Every file must be complete and immediately runnable with no TODOs.

# 5. Testing Strategy
## 5.1 Unit Tests (Vitest)
# Run all unit tests
pnpm test

# Run tests for a specific package
pnpm --filter apps/api test

# Run with coverage
pnpm test:coverage
Unit tests cover service logic, repository queries (against a test database), and Zod schema validation. Coverage target: 80% for packages/db and apps/api.
## 5.2 E2E Tests (Playwright)
# Run E2E tests
pnpm e2e

# Run in headed mode for debugging
pnpm e2e:headed

# Run a specific test file
pnpm e2e -- scope-flag-flow.spec.ts
E2E tests run against the preview deployment in CI, or against localhost in development. Every P0 feature requires both a happy-path and an error-path E2E test.
## 5.3 AI Behavior QA
The AI service (apps/ai) has a dedicated test corpus stored in apps/ai/tests/fixtures/. Before every release, run the AI QA suite which tests brief scoring against 5 sample briefs (2 clear, 2 ambiguous, 1 adversarial) and scope flags against 3 SOW + message combinations. See SOP-03 for the full pre-release QA checklist.
cd apps/ai && pytest tests/ -v

# 6. Deployment
## 6.1 Environment Promotion
See SOP-03 (Product Release Process) for the complete release-day protocol including rollback procedures.
## 6.2 Database Migrations in Production
# Generate migration from schema changes
pnpm --filter @scopeiq/db db:generate

# Apply migration to production (via CI pipeline)
pnpm --filter @scopeiq/db db:migrate
Migrations run automatically during the CI/CD pipeline before the application deploys. Index creation uses CONCURRENTLY to avoid table locks. If a migration fails, the deploy is halted and the team is alerted via Sentry.

# 7. Monitoring & Observability

# 8. Quick Reference — Key Commands
| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | v20 LTS (20.x) | Use nvm to manage versions: nvm install 20 |
| Python | 3.12+ | For AI Gateway service (apps/ai) |
| pnpm | v9+ | Workspace-aware package manager (npm install -g pnpm) |
| Docker Desktop | Latest | Required for local PostgreSQL, Redis, and S3-compatible storage |
| Supabase CLI | Latest | supabase init, migrations, and local auth emulation |
| Stripe CLI | Latest | Webhook forwarding for local development |
| Git | 2.40+ | Version control |
| VS Code | Latest (recommended) | Recommended extensions listed in .vscode/extensions.json |
| Service | Port | Framework | Hot Reload |
| --- | --- | --- | --- |
| apps/web | http://localhost:3000 | Next.js 14 | Yes (Turbopack) |
| apps/api | http://localhost:4000 | Hono v4 | Yes (tsx watch) |
| apps/ai | http://localhost:8000 | FastAPI | Yes (uvicorn --reload) |
| Directory | Purpose |
| --- | --- |
| apps/web/ | Next.js 14 frontend — agency dashboard and client portal |
| apps/api/ | Hono v4 REST API — business logic, auth, webhooks |
| apps/ai/ | Python FastAPI AI Gateway — Claude API integration, BullMQ workers |
| packages/db/ | Drizzle ORM schema, migrations, query helpers, audit log utility |
| packages/ui/ | Shared React component library (Button, Input, Badge, Card, etc.) |
| packages/config/ | Shared ESLint, Prettier, TypeScript base configurations |
| packages/types/ | Cross-package TypeScript types and custom error classes |
| Branch Pattern | Purpose |
| --- | --- |
| main | Production-ready code; auto-deploys to staging on merge |
| feat/FEAT-XX-description | New feature development (reference Feature ID from breakdown) |
| fix/BUG-XX-description | Bug fix branch |
| chore/description | Tooling, config, or documentation updates |
| release/vX.Y | Release candidate (created from main for final QA) |
| Environment | Trigger | Platform |
| --- | --- | --- |
| Preview | Every PR opened | Vercel Preview + Railway PR Env (ephemeral) |
| Staging | Merge to main | Vercel Staging + Railway Staging (persistent) |
| Production | Manual approval gate | Vercel Pro + Railway Scale (Wednesday 06:00-08:00 UTC) |
| Tool | Purpose | Access |
| --- | --- | --- |
| Sentry | Error tracking | Alerts on new errors; auto-rollback if rate > 0.5% |
| Axiom | Structured logging | JSON logs from API + AI service; full-text search |
| Vercel Analytics | Frontend performance | Core Web Vitals, page load times |
| Railway Metrics | API performance | CPU, memory, request latency, uptime |
| Stripe Dashboard | Billing health | MRR, churn, failed payments |
| Supabase Dashboard | Database health | Query performance, connection pool, storage |
| Anthropic Console | AI API usage | Token consumption, cost per workspace, latency |
| Command | Purpose |
| --- | --- |
| pnpm dev | Start all services (web + api + ai) |
| pnpm build | Build all packages and apps |
| pnpm test | Run all Vitest unit tests |
| pnpm e2e | Run Playwright E2E tests |
| pnpm test:coverage | Unit tests with coverage report |
| pnpm lint | ESLint + Prettier check |
| pnpm lint:fix | Auto-fix lint issues |
| pnpm typecheck | TypeScript compilation check (tsc --noEmit) |
| pnpm --filter apps/web dev | Start only the frontend |
| pnpm --filter apps/api dev | Start only the API server |
| pnpm --filter @scopeiq/db db:generate | Generate Drizzle migration |
| pnpm --filter @scopeiq/db db:push | Push schema to local database |
| pnpm --filter @scopeiq/db db:seed | Seed test data |
| pnpm --filter @scopeiq/db db:studio | Open Drizzle Studio (database GUI) |
| docker-compose up -d | Start local infrastructure |
| docker-compose down | Stop local infrastructure |
| supabase start | Start Supabase local emulator |
| stripe listen --forward-to ... | Forward Stripe webhooks locally |