<!-- converted from Novabots_ScopeIQ_SystemDesign.docx -->



# 1. System Overview
ScopeIQ is a multi-tenant web SaaS platform built by Novabots on a modern cloud-native stack. The architecture follows a three-tier layered service model: a Next.js 14 frontend (presentation tier) communicates with a Node.js/Hono API layer (application tier) and a PostgreSQL database hosted on Supabase (data tier). A dedicated Python FastAPI AI Gateway handles all Anthropic Claude API interactions independently to allow isolated scaling of AI workloads.

The system is designed for 99.5% uptime on paid plans, fast AI response times (sub-10s for brief scoring, sub-5s for scope flagging), and horizontal scalability from solo-founder MVP to multi-region enterprise deployment without requiring a rewrite.

# 2. High-Level Architecture


Figure 1 — ScopeIQ Three-Tier Cloud-Native Architecture (Novabots)

# 3. Technology Stack


# 4. Core Data Model

The data model is organized around five primary domain entities: Workspace (the agency account), Project (a client engagement), Brief (intake form and submissions), Deliverable (files sent for review), and ScopeItem (parsed SOW clauses and scope flags). All entities include created_at, updated_at, and soft-delete columns. Row-level security policies on workspace_id enforce multi-tenant isolation at the database layer.

Figure 2 — Simplified Entity Relationship Overview

# 5. AI Processing Pipelines





# 6. Infrastructure & Deployment

## 6.1 Environment Strategy

## 6.2 CI/CD Pipeline

## 6.3 Security Architecture
Authentication is handled by Supabase Auth (email/password, magic link, Google OAuth). Sessions are JWT-based with 1-hour expiry, auto-refreshed by the Supabase client SDK. Authorization is enforced at two independent layers: application-layer role checks (owner, admin, member, viewer) and database-layer row-level security policies that bind every query to the authenticated user's workspace_id. Client portal access uses project-scoped portal tokens — no user account required for clients.



Novabots Engineering — ScopeIQ — Confidential — 2026
| ScopeIQ
System Design Document
Novabots Engineering  |  Architecture · Data Model · Infrastructure · Security  |  v1.0  |  2026 |
| --- |
| Three-Tier Cloud-Native Architecture |
| --- |
| ┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                          │
│  ┌──────────────────────┐    ┌───────────────────────────┐     │
│  │  Agency Dashboard    │    │  Client Portal            │     │
│  │  (Next.js 14 / RSC)  │    │  (Next.js / White-label)  │     │
│  └──────────┬───────────┘    └────────────┬──────────────┘     │
│          Vercel Edge Network (CDN + SSR)                       │
└─────────────┼──────────────────────────────┼───────────────────┘
              │  HTTPS / REST / WebSocket     │
┌─────────────┼──────────────────────────────┼───────────────────┐
│             │     APPLICATION TIER          │                   │
│  ┌──────────┴──────────┐  ┌─────────────────┴──────────────┐   │
│  │  Core API           │  │  AI Gateway Service            │   │
│  │  (Node.js / Hono)   │  │  (Python / FastAPI)            │   │
│  │  ─ Auth & sessions  │  │  ─ Brief scoring engine        │   │
│  │  ─ Project CRUD     │  │  ─ Scope flag detection        │   │
│  │  ─ Webhook dispatch │  │  ─ Change order generator      │   │
│  │  ─ Billing events   │  │  ─ Feedback summarizer         │   │
│  └──────────┬──────────┘  └───────────────┬────────────────┘   │
│             │   Railway (auto-scaling)     │                    │
│             │             ┌────────────────┘                   │
│             │             │  Anthropic Claude API              │
│             │         BullMQ / Redis Queue                     │
└─────────────┼─────────────────────────────────────────────────-┘
              │
┌─────────────┼────────────────────────────────────────────────────┐
│             │   DATA TIER                                        │
│  ┌──────────┴──────────┐   ┌──────────────────────────────┐     │
│  │  PostgreSQL         │   │  File Storage (Cloudflare R2) │     │
│  │  (Supabase)         │   │  ─ Deliverables              │     │
│  │  ─ Row-level sec.   │   │  ─ SOW documents             │     │
│  │  ─ Real-time subs.  │   │  ─ Brief attachments         │     │
│  └─────────────────────┘   └──────────────────────────────┘     │
│  ┌─────────────────────┐   ┌──────────────────────────────┐     │
│  │  Redis (Upstash)    │   │  Email (Resend)               │     │
│  │  ─ Session cache    │   │  ─ Transactional emails       │     │
│  │  ─ Rate limiting    │   │  ─ Reminder sequences         │     │
│  │  ─ BullMQ queues    │   │  ─ Change order delivery      │     │
│  └─────────────────────┘   └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘ |
| --- |
| Layer | Technology | Version | Rationale |
| --- | --- | --- | --- |
| Frontend | Next.js + React | Next.js 14 App Router | RSC for performance; edge-rendered portals; built-in API routes |
| Styling | Tailwind CSS | v3.4 | Utility-first; consistent design tokens; minimal bundle size |
| State Management | Zustand + React Query | Latest stable | Zustand for UI state; React Query for server state and cache |
| Backend API | Node.js + Hono | Node 20 LTS + Hono v4 | Lightweight; edge-compatible; TypeScript-first; fast routing |
| AI Service | Python FastAPI | Python 3.12 + FastAPI 0.110 | Async AI orchestration; isolated Claude API integration |
| AI Provider | Anthropic Claude API | claude-sonnet-4-6 | Best-in-class for document parsing, structured output, reasoning |
| Database | PostgreSQL on Supabase | PostgreSQL 15 | Row-level security; real-time subscriptions; managed infra |
| ORM | Drizzle ORM | v0.30 | TypeScript-first; lightweight; excellent PostgreSQL support |
| Cache / Queue | Redis on Upstash | Serverless Redis | Serverless-compatible; rate limiting; BullMQ job queues |
| File Storage | Cloudflare R2 | Pay-as-you-go | S3-compatible; zero egress fees; global CDN |
| Authentication | Supabase Auth + JWT | Built-in | Magic link + OAuth; JWT sessions; native RLS integration |
| Payments | Stripe Billing | Latest API | Subscription management; webhooks; usage-based billing |
| Email | Resend | Latest API | Modern transactional email; React Email templates; analytics |
| DNS / CDN | Cloudflare | Pro plan | Custom domain routing for white-label portals; DDoS protection |
| Frontend Hosting | Vercel | Pro | Next.js optimized; edge functions; preview deployments |
| API Hosting | Railway | Starter → Scale | Simple deployment; auto-scaling; built-in metrics |
| Monitoring | Sentry + Axiom | Latest | Error tracking (Sentry); structured logging and tracing (Axiom) |
| CI/CD | GitHub Actions | Latest | Automated test, lint, and deployment pipeline |
| -- Core Entity Relationships (simplified schema overview)

workspaces         { id, name, plan, stripe_customer_id, settings_json }
users              { id, workspace_id*, email, role, created_at }
clients            { id, workspace_id*, name, email, portal_token }
projects           { id, workspace_id*, client_id*, status, sow_id*, created_at }

-- Module 1: Brief Builder
brief_templates    { id, workspace_id*, fields_json, name, project_type }
briefs             { id, project_id*, version, status, clarity_score, submitted_at }
brief_fields       { id, brief_id*, field_key, value, ai_flag, ai_flag_reason }

-- Module 2: Approval Portal
deliverables       { id, project_id*, title, type, file_url, status, revision_round }
feedback_items     { id, deliverable_id*, author_type, content, x_pos, y_pos, resolved }
approval_events    { id, deliverable_id*, event_type, actor_id, timestamp }
reminder_logs      { id, project_id*, sequence_step, sent_at, delivery_status }

-- Module 3: Scope Guard
statements_of_work { id, project_id*, raw_text, parsed_at, source_file_url }
sow_clauses        { id, sow_id*, clause_type, content, is_active }
scope_flags        { id, project_id*, sow_clause_id*, message_text, confidence,
                     severity, status, created_at }
change_orders      { id, scope_flag_id*, description, price, status, signed_at }

-- Platform-wide
audit_log          { id, workspace_id*, actor_id, entity_type, entity_id,
                     action, metadata_json, created_at }
rate_card_items    { id, workspace_id*, service_type, hourly_rate, unit } |
| --- |
| 5.1 Brief Clarity Scoring Pipeline |
| --- |
| 1.  Client submits brief form
    → Core API creates brief record (status: pending_score)
2.  Core API dispatches BullMQ job: { job_type: 'score_brief', brief_id }
3.  AI Worker (FastAPI) picks up job, fetches brief fields from DB
4.  Constructs structured Claude prompt:
    - System: 'You are a creative project brief evaluator...'
    - Output schema (tool_use mode): { score: int, flags: [{field, reason, severity}] }
5.  Claude API returns structured JSON response
6.  Worker stores score + flags in DB, updates brief status → scored
7.  Dispatches webhook to Core API → pushes real-time update via Supabase subscription
8.  If score < threshold: Resend email dispatched with specific clarification questions |
| --- |
| 5.2 Scope Flag Detection Pipeline |
| --- |
| 1.  Message ingested (portal submit / email forward / manual input)
2.  Message stored in DB; BullMQ job dispatched: { job_type: 'check_scope', message_id }
3.  AI Worker fetches message + all active sow_clauses for project
4.  Constructs scope analysis prompt:
    - System: 'You are a contract scope enforcement assistant...'
    - Context: structured SOW clause list
    - Output schema: { is_in_scope, confidence, matching_clauses[], suggested_response }
5.  If !is_in_scope AND confidence > 0.6: create scope_flags record
6.  Push real-time notification to agency dashboard
7.  Send email notification if agency has not viewed in-app within 2 hours |
| --- |
| Environment | Purpose | Deployment | Data Policy |
| --- | --- | --- | --- |
| Development | Local developer machines | docker-compose | Seeded test data only — no PII |
| Preview | PR-based ephemeral environments | Vercel Preview + Railway PR Env | Anonymized staging data |
| Staging | Pre-production validation | Vercel + Railway (staging) | Anonymized production structure |
| Production | Live customer traffic | Vercel Pro + Railway Scale | Encrypted customer data with daily backups |
| On Pull Request open:
  → TypeScript compiler check (tsc --noEmit)
  → ESLint + Prettier validation
  → Vitest unit test suite
  → Playwright E2E tests against preview environment
  → Deploy preview environment (Vercel Preview + Railway PR Env)

On merge to main:
  → All PR checks must pass (no bypass)
  → Auto-deploy to Staging
  → Full Playwright E2E suite against Staging
  → Manual approval gate required before production deploy

Production deploy (Wednesday window 06:00-08:00 UTC):
  → Deploy to Vercel Production + Railway Production
  → Post-deploy smoke test suite runs automatically
  → Sentry error rate monitored for 30 minutes
  → Auto-rollback if error rate > 0.5% above baseline |
| --- |
| -- RLS Policy Example (applied to all tables with workspace_id)
CREATE POLICY workspace_isolation ON projects
  USING (workspace_id = (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Additionally: application layer ALWAYS includes workspaceId in query WHERE clause
-- Defense-in-depth: both layers must pass independently |
| --- |