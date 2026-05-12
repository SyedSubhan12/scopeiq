  
             **SCOPEIQ PRODUCTION BUILD SPECIFICATION**  
                            v1.0 — Final Edition  
                         Complete System Orchestration  
                              Novabots Engineering  
                               2026 · Confidential

CRITICAL: This document is the SINGLE SOURCE OF TRUTH for building ScopeIQ   
to production-ready status. Every engineer, designer, QA, and stakeholder must:

1\. Read this document in full BEFORE starting work  
2\. Reference this document when ANY decision point arises  
3\. Escalate ANY deviations to the Lead Architect before implementation  
4\. Update this document when decisions change (with timestamps)

This is not aspirational. This is binding.

═══════════════════════════════════════════════════════════════════════════════  
                            TABLE OF CONTENTS  
═══════════════════════════════════════════════════════════════════════════════

SECTION 1:   Executive Overview & Vision  
SECTION 2:   Development Stack (Non-Negotiable)  
SECTION 3:   Architecture Principles & Patterns  
SECTION 4:   Absolute Code Rules (Enforcement)  
SECTION 5:   Data Model & Schema  
SECTION 6:   API Specification (Complete)  
SECTION 7:   AI Processing Pipelines (Step-by-Step)  
SECTION 8:   Frontend Implementation Guide  
SECTION 9:   Security & Compliance Checklist  
SECTION 10:  Testing Strategy (Unit, Integration, E2E)  
SECTION 11:  CI/CD Pipeline & Deployment  
SECTION 12:  Performance & Monitoring SLAs  
SECTION 13:  Launch Sequence & Gates  
SECTION 14:  Team Coordination & Handoff  
SECTION 15:  Troubleshooting & Emergency Protocols  
SECTION 16:  Post-Launch Operations

═════════════════════════════════════════════════════════  
                    SECTION 1: EXECUTIVE OVERVIEW & VISION  
═══════════════════════════════════════════════════════════════════════════════

1.1 What We're Building

ScopeIQ is a Collaborative Scope Economics Platform that prevents creative   
professionals from losing 15–25% of revenue to scope creep by:

1\. Eliminating scope ambiguity at project kickoff (AI-guided interviews)  
2\. Making scope additions collaborative, not confrontational (multi-option framework)  
3\. Automating negotiation and closure (agentic system)  
4\. Building team consistency and learning (governance \+ intelligence)

NOT a detection tool. NOT a billing system. NOT a generic PM app.  
YES a scope clarity \+ negotiation automation \+ team governance \+ learning system.

1.2 Core Insight (Non-Negotiable)

The problem is NOT information asymmetry. Creative professionals can see scope   
creep coming. The problem is CONFRONTATION.

When a freelancer notices out-of-scope work:  
  Option A: Confront client → Risk relationship → Often don't do it  
  Option B: Absorb cost → Keep relationship → Destroy margin

ScopeIQ solves this by making scope additions COLLABORATIVE, not accusatory.  
Instead of agency saying "that's extra," system presents 3 options and client   
chooses. Confrontation removed.

This insight is the foundation. Everything else flows from this.

1.3 Revenue Model & Market Position

Pricing: Subscription-based (NOT take-rate)  
  ├─ Solo: $49/mo (1 project, SOW generator, CO automation)  
  ├─ Studio: $199/mo (5 projects, team governance, predictions, Slack)  
  └─ Agency: $499/mo (unlimited, API, analytics, priority support)

Optional 1.5% of accepted COs if customer uses AI negotiation service.

Why subscription:  
  ✓ Aligns incentives (better SOWs \= fewer disputes \= customer keeps paying)  
  ✓ Predictable revenue  
  ✓ Scales with customer success  
  ✓ Not penalized for product working (unlike take-rate model)

Market position:  
  ✓ Owned market: Scope clarity \+ negotiation automation for creatives  
  ✓ Defensible moat: Per-client ML behavior models, SOW analysis  
  ✓ Adjacent markets: Freelancers → Studios → Agencies → Consultants

1.4 Target Customer Profile (Beachhead)

PRIMARY: Recently-burned freelancers  
  \- Lost $7K+ to scope creep in last 90 days (ACTIVE PAIN)  
  \- Solo operator or 3–5 person studio  
  \- Uses Figma, Stripe, basic PM tools  
  \- WTP: $49–199/month (or 1.5% of recovered revenue)  
  \- Acquisition: Community (Slack, Reddit, Twitter)

EXPANSION: Studio leads  
  \- Team consistency problems visible to staff  
  \- Team margin erosion quantifiable ($3K+/mo OOS requests)  
  \- WTP: $199–499/month  
  \- Triggered by: Case study from recently-burned freelancer

LONG-TAIL: Agency ops managers  
  \- Admin burden quantifiable (40% of week on scope/COs)  
  \- Team training needs clear  
  \- WTP: $500+/month  
  \- Triggered by: Time savings ROI demonstration

1.5 Success Definition (Q3 2026 Launch)

MVP Launch Success (Gate 1 validation):  
  ├─ 500+ active users  
  ├─ 100+ active projects  
  ├─ \>80% SOW clarity score (client satisfaction)  
  ├─ \<20% scope dispute rate (vs. 60% industry baseline)  
  ├─ NPS \>50  
  ├─ \<90% monthly churn rate  
  └─ Gate 1 test validation: \>40% of freelancers accept COs without major   
     negotiation (vs. 50% industry baseline after negotiation)

If NOT met: Iterate on SOW quality \+ negotiation framing before moving to   
Approval Portal (Gate 2).

1.6 Scope (What's In / Out)

IN (Scope Guard MVP, Q3 2026):  
  ✓ SOW ingestion & AI parsing  
  ✓ Client interviews & detailed SOW generation  
  ✓ Scope meter (visual health tracking)  
  ✓ Client inbox (primary communication channel)  
  ✓ Scope request handling (3-option framework)  
  ✓ AI negotiation drafting  
  ✓ Change order automation  
  ✓ White-label client portal  
  ✓ Team governance basics (approval routing)  
  ✓ Audit logging (complete trail)  
  ✓ Stripe billing (subscription \+ 1.5% optional)

OUT (Q4 2026 \+ beyond):  
  ✗ Approval Portal deliverable tracking (Gate 2\)  
  ✗ Brief Builder intake forms (Gate 3\)  
  ✗ Advanced analytics & insights (Phase 2\)  
  ✗ Mobile native app (PWA only, v1.5)  
  ✗ Multi-language support (v2.0)  
  ✗ API for third parties (Phase 2\)  
  ✗ Custom integrations (Phase 2\)

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 2: DEVELOPMENT STACK (NON-NEGOTIABLE)  
═══════════════════════════════════════════════════════════════════════════════

2.1 Frontend Stack

├─ Runtime: Node.js 20 LTS  
├─ Framework: Next.js 14 (App Router, React Server Components)  
├─ Language: TypeScript 5.4 (strict: true, noUncheckedIndexedAccess: true)  
├─ Styling: Tailwind CSS v3.4 \+ CSS custom properties for theming  
├─ UI Primitives: Radix UI (accessible, unstyled components)  
├─ Form Handling: React Hook Form v7 \+ Zod resolver  
├─ State Management: Zustand (global UI) \+ React Query v5 (server state)  
├─ HTTP Client: TanStack Query (built-in caching, retry logic)  
├─ Drag & Drop: DnD Kit (form builder, reorderable lists)  
├─ PDF Viewer: React-PDF (client-side, efficient)  
├─ Rich Text: Slate.js (if needed for rich editor; minimize dependencies)  
├─ Markdown Rendering: react-markdown \+ remark plugins  
├─ SVG Canvas: Konva.js (annotation overlays) or raw SVG \+ event handlers  
├─ Animation: Framer Motion (sparingly, only meaningful transitions)  
├─ Date Picker: React Daypicker (headless, Radix UI compatible)  
├─ Icons: Lucide React (500+ icons, tree-shaken)  
├─ Testing (Unit): Vitest v0.34+ (fast, ESM-native)  
├─ Testing (E2E): Playwright v1.40+ (cross-browser, headless)  
├─ Linting: ESLint (Next.js config) \+ Prettier  
├─ Build: Vercel deployment (Next.js optimized, zero-config)  
└─ Hosting: Vercel Pro (auto-scaling, edge functions, preview envs)

FORBIDDEN:  
  ✗ No Material-UI, Chakra, Bootstrap (too heavy, too much styling)  
  ✗ No Redux (overkill; Zustand is simpler)  
  ✗ No GraphQL (REST \+ polling is sufficient)  
  ✗ No large animation libraries (GSAP not needed for ScopeIQ)  
  ✗ No jQuery or DOM manipulation (React only)

2.2 Backend API Stack

├─ Runtime: Node.js 20 LTS  
├─ Framework: Hono v4 (lightweight, TypeScript-first, edge-compatible)  
├─ Language: TypeScript 5.4 (strict: true)  
├─ Request Validation: Zod (parse \+ validate in one step)  
├─ Database ORM: Drizzle ORM v0.30 (TypeScript native, migration-first)  
├─ Database: PostgreSQL 15 (via Supabase managed)  
├─ Authentication: Supabase Auth (JWT tokens, built-in RLS)  
├─ Job Queue: BullMQ v4 (Redis-backed, reliable job processing)  
├─ Cache: Redis via Upstash (serverless, no provisioning)  
├─ Email: Resend SDK (modern, React Email templates)  
├─ Payments: Stripe Node.js SDK (v13+)  
├─ File Storage: Cloudflare R2 (presigned URLs, zero egress fees)  
├─ File Uploads: aws-sdk v3 (S3-compatible, R2 works out of box)  
├─ Logging: Axiom SDK (structured JSON logging)  
├─ Error Tracking: Sentry SDK (performance \+ errors)  
├─ PDF Generation: @react-pdf/renderer (server-side React → PDF)  
├─ Testing (Unit): Vitest (same as frontend)  
├─ Testing (Integration): Supertest (HTTP assertions)  
├─ Deployment: Railway (auto-scaling containers)  
└─ Hosting: Railway (Hono-friendly, simple deployments)

FORBIDDEN:  
  ✗ No Express (verbose; Hono is modern alternative)  
  ✗ No Prisma (Drizzle is more performant, type-safer)  
  ✗ No TypeORM (same as Prisma)  
  ✗ No Bull (use BullMQ instead, Bull is legacy)  
  ✗ No raw SQL strings (Drizzle ORM only)  
  ✗ No Nodemailer (use Resend for transactional email)

2.3 AI Service Stack

├─ Runtime: Python 3.12  
├─ Framework: FastAPI v0.110 (async-native, performance)  
├─ Language: Python 3.12 (no legacy Python 2\)  
├─ AI Provider: Anthropic SDK (claude-sonnet-4-6 ONLY)  
├─ Validation: Pydantic v2 (strict validation, serialization)  
├─ Job Worker: BullMQ Python client (same queue as Node.js API)  
├─ Async: asyncio \+ uvicorn ASGI server (fully async)  
├─ PDF Parsing: PyMuPDF (fast, memory-efficient)  
├─ Logging: structlog (structured JSON, same as Node.js)  
├─ Testing: pytest \+ pytest-asyncio  
├─ Deployment: Railway (Docker container)  
└─ Monitoring: Axiom SDK (same as Node.js, unified logging)

FORBIDDEN:  
  ✗ No Django (overkill for API service)  
  ✗ No Flask (too minimal; FastAPI is better)  
  ✗ No LangChain (don't use abstractions; call Anthropic SDK directly)  
  ✗ No pydantic-settings (use environment variables directly)

2.4 Database Stack

├─ Database: PostgreSQL 15 (Supabase managed)  
├─ Schema Management: Drizzle Kit (auto-migrations from schema)  
├─ Connection Pooling: PgBouncer (built into Supabase)  
├─ Backups: Automated daily (30-day retention)  
├─ RLS: PostgreSQL row-level security (enabled on all tables)  
├─ Real-time: Supabase Realtime (WebSocket subscriptions)  
├─ Transactions: Full ACID support (used for audit log writes)  
└─ Monitoring: Supabase metrics dashboard

2.5 Infrastructure Stack

├─ DNS & CDN: Cloudflare (for white-label custom domains)  
├─ Secrets Management: Railway environment variables \+ Vercel secrets  
├─ CI/CD: GitHub Actions (workflows, automated testing)  
├─ Monitoring: Vercel Analytics (frontend RUM), Sentry (errors/perf), Axiom (logs)  
├─ Uptime Monitoring: Healthchecks.io (external ping every 5 min)  
├─ Load Testing: k6 (if needed, run via GitHub Actions)  
└─ Documentation: GitHub Wiki (not separate tool; in-repo)

2.6 Development Environment

├─ Package Manager: pnpm (faster, more efficient than npm/yarn)  
├─ Monorepo Tool: Turborepo (optimal for multi-package setup)  
├─ Version Control: Git \+ GitHub (standard workflow)  
├─ Code Editor: VS Code (recommended; .vscode/settings.json in repo)  
├─ API Testing: Postman or Hoppscotch (for manual API testing)  
├─ Database Tool: DBeaver (free, PostgreSQL native support)  
├─ Local DB: Docker Compose (postgres \+ redis containers)  
└─ .env Files: Never committed; .env.example provided

2.7 Third-Party Services (Critical Path)

├─ Supabase (PostgreSQL, Auth, RLS, Realtime, Storage)  
├─ Anthropic (Claude API — ONLY)  
├─ Stripe (Billing)  
├─ Resend (Email)  
├─ Cloudflare (DNS, R2, DDoS protection)  
├─ Vercel (Frontend hosting)  
├─ Railway (Backend hosting)  
├─ Upstash (Redis)  
├─ Sentry (Error tracking)  
├─ Axiom (Logging)  
└─ GitHub (Source control, CI/CD)

NO ADDITIONAL SERVICES. Minimize dependencies. No SaaS tool bloat.

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 3: ARCHITECTURE PRINCIPLES & PATTERNS  
═══════════════════════════════════════════════════════════════════════════════

3.1 Core Architectural Pattern: Layered \+ Event-Driven

Frontend (Presentation Tier)  
  ├─ Next.js Server Components (for server-side rendering)  
  ├─ Client Components (for interactivity)  
  ├─ React Hooks (state management via Zustand \+ React Query)  
  └─ No business logic in components; all in custom hooks

API Server (Application Tier)  
  ├─ Route handlers (HTTP endpoints, validation)  
  ├─ Services (business logic, no DB access directly)  
  ├─ Repositories (data access layer, all Drizzle queries)  
  └─ Middleware (auth, logging, error handling)

AI Service (AI Tier)  
  ├─ BullMQ workers (job consumers)  
  ├─ Services (Claude API orchestration)  
  ├─ Schemas (Pydantic validation)  
  └─ Prompts (versioned, documented)

Database (Persistence Tier)  
  ├─ PostgreSQL with RLS  
  ├─ Drizzle ORM (type-safe schema \+ queries)  
  ├─ Audit log (immutable record of all changes)  
  └─ Real-time subscriptions (WebSocket)

Event Flow (Async Jobs):  
  ├─ Action triggered in API  
  ├─ BullMQ job dispatched to Redis queue  
  ├─ AI worker processes job (async)  
  ├─ Results stored in DB  
  ├─ Supabase real-time pushes to client  
  └─ Client UI updates without page refresh

3.2 Design Patterns (Required for All Features)

Repository Pattern (Data Access):  
  └─ All queries in repository/\*.repository.ts files  
     Never raw SQL. Never queries in routes.  
     Always pass workspaceId to enforce isolation.

Service Pattern (Business Logic):  
  └─ All logic in services/\*.service.ts files  
     Call repositories for data, not routes.  
     Return typed data; never raw DB results.

Factory Pattern (Object Creation):  
  └─ Use for creating complex objects (SOW clauses, scope options)  
     Encapsulates creation logic away from routes.

Observer Pattern (Real-time):  
  └─ Supabase subscriptions for real-time updates  
     Client subscribes to table changes.  
     Automatic re-render when data changes.

Strategy Pattern (AI Pipelines):  
  └─ Different "strategies" for scope analysis, option generation, etc.  
     Allows swapping Claude for another model later.

3.3 Error Handling Pattern (Mandatory)

All errors must:  
  ├─ Be typed (define error classes in packages/types/errors.ts)  
  ├─ Have a code (SCOPE\_AMBIGUITY\_DETECTED, INVALID\_RATE\_CARD, etc.)  
  ├─ Have a message (user-facing, not stack traces)  
  ├─ Have a statusCode (HTTP status)  
  ├─ Be logged to Sentry (with context)  
  └─ Be caught and handled at route level (never let exceptions bubble)

Example error class:  
\`\`\`typescript  
export class ScopeAmbiguityError extends AppError {  
  constructor(message: string, context?: Record\<string, any\>) {  
    super('SCOPE\_AMBIGUITY\_DETECTED', message, 400, context);  
  }  
}  
\`\`\`

3.4 Logging Pattern (Mandatory)

All operations must log:  
  ├─ Start: { operation: "scope\_check", message\_id, timestamp }  
  ├─ Context: { workspace\_id, user\_id, project\_id }  
  ├─ Data: { confidence, is\_in\_scope, matching\_clauses\_count }  
  ├─ Duration: { duration\_ms }  
  ├─ Result: { status: "success|failure", error\_code }  
  └─ End: Structured JSON to Axiom

Format (structlog / Axiom):  
\`\`\`json  
{  
  "timestamp": "2026-03-15T10:30:45.123Z",  
  "operation": "scope\_check",  
  "status": "success",  
  "workspace\_id": "ws\_123",  
  "message\_id": "msg\_456",  
  "confidence": 0.82,  
  "duration\_ms": 2345,  
  "model": "claude-sonnet-4-6"  
}  
\`\`\`

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 4: ABSOLUTE CODE RULES (ENFORCEMENT)  
═══════════════════════════════════════════════════════════════════════════════

THESE ARE NOT GUIDELINES. THESE ARE REQUIREMENTS. Code review will block any   
PR violating these rules. No exceptions. No "just this once."

4.1 TypeScript Strict Mode (Frontend \+ Backend)

RULE: All TypeScript must compile with:  
  ├─ strict: true  
  ├─ noUncheckedIndexedAccess: true  
  ├─ exactOptionalPropertyTypes: true  
  ├─ noUnusedLocals: true  
  └─ noUnusedParameters: true

FORBIDDEN:  
  ✗ // @ts-ignore (never)  
  ✗ any type (never)  
  ✗ Object type (use Record\<string, unknown\> instead)  
  ✗ Function type without params (use (...args: unknown\[\]) \=\> unknown)

ENFORCEMENT: GitHub Actions runs \`tsc \--noEmit\` on every PR.   
            If it fails, PR cannot merge.

4.2 Database Access Pattern (Backend \+ AI Service)

RULE: All database access MUST use Drizzle ORM.  
      No exceptions. No raw SQL strings.

FORBIDDEN:  
  ✗ db.raw("SELECT ...")  
  ✗ new Client().query("SELECT ...")  
  ✗ Sequelize, TypeORM, or any other ORM

REQUIRED:  
  ✓ import { db } from '@/db'  
  ✓ db.select().from(projects).where(...).limit(1)  
  ✓ Use sql\`\` template tag if complex query needed

DEFENSE IN DEPTH:  
  Every query MUST include workspaceId filter:  
    
  ✗ WRONG:  
    const flags \= await db.select().from(scope\_flags)  
      .where(eq(scope\_flags.project\_id, projectId));  
    
  ✓ CORRECT:  
    const flags \= await db.select().from(scope\_flags)  
      .innerJoin(projects, eq(projects.id, scope\_flags.project\_id))  
      .where(and(  
        eq(scope\_flags.project\_id, projectId),  
        eq(projects.workspace\_id, workspaceId)  // ALWAYS include  
      ));

ENFORCEMENT: Code review checks every query. PR blocks if workspaceId missing.

4.3 AI Operations Pattern (Backend \+ AI Service)

RULE: No direct Anthropic SDK calls in apps/web or apps/api.  
      All AI calls dispatched as BullMQ jobs to apps/ai service.

FORBIDDEN:  
  ✗ import { Anthropic } from '@anthropic-ai/sdk' in apps/api/src  
  ✗ await anthropic.messages.create(...) in route handler  
  ✗ Synchronous AI calls (never await API response)

REQUIRED:  
  ✓ Dispatch BullMQ job: queue.add('scope\_check', { message\_id })  
  ✓ AI worker processes job asynchronously  
  ✓ Results stored in database  
  ✓ Real-time push to client when complete

TIMEOUT HANDLING:  
  ✗ No infinite waits for AI operations  
  ✓ All AI operations have timeout: 30 seconds max  
  ✓ Job fails after 3 retries → escalate to ops

ENFORCEMENT: GitHub Actions scans for Anthropic imports in forbidden directories.  
            PR blocks if violation detected.

4.4 File Upload Pattern (Backend)

RULE: Files NEVER uploaded directly to API.  
      Always use presigned URLs.

FLOW:  
  1\. Client requests presigned URL: GET /api/uploads/presigned-url  
  2\. API returns: { url, expires\_at, object\_key }  
  3\. Client uploads directly to R2: PUT to presigned URL (no API involvement)  
  4\. Client confirms upload: POST /api/uploads/:objectKey/confirm  
  5\. API verifies object exists in R2, stores reference in DB

FORBIDDEN:  
  ✗ Accept file in request body (multipart/form-data with file bytes)  
  ✗ Pass file bytes through API server  
  ✗ Store temporary files on API disk

ENFORCEMENT: Route handlers reject file content in request body.  
            Middleware checks Content-Type and rejects multipart without object\_key.

4.5 Client-Side Secrets Pattern (Frontend)

RULE: Only NEXT\_PUBLIC\_ prefixed variables allowed in apps/web/src.  
      Any other secret \= security violation.

FORBIDDEN SECRETS (if found in client code, PR blocked):  
  ✗ ANTHROPIC\_API\_KEY  
  ✗ SUPABASE\_SERVICE\_ROLE\_KEY  
  ✗ STRIPE\_SECRET\_KEY  
  ✗ DATABASE\_URL  
  ✗ R2\_SECRET\_ACCESS\_KEY  
  ✗ RESEND\_API\_KEY

REQUIRED:  
  ✓ Move to API route if secret operation needed  
  ✓ Call API from client (never call external service directly)

EXAMPLE:  
  ✗ WRONG:  
    // In apps/web/src/lib/stripe.ts  
    const stripe \= Stripe(process.env.STRIPE\_SECRET\_KEY)  // CLIENT-SIDE\!  
    
  ✓ CORRECT:  
    // In apps/api/src/routes/stripe.route.ts  
    const stripe \= Stripe(process.env.STRIPE\_SECRET\_KEY)  // Server-side  
      
    // In apps/web/src/hooks/useStripe.ts  
    await fetch('/api/stripe/create-intent')  // Call API, not Stripe directly

ENFORCEMENT: GitHub Actions scans for non-NEXT\_PUBLIC\_ env vars in apps/web/src.  
            Sentry flags if secrets detected in client errors.  
            PR blocks if violation detected.

4.6 Audit Logging Pattern (Backend)

RULE: Every mutation (create, update, delete) writes to audit\_log.  
      Same DB transaction. Atomic.

REQUIRED:  
  ✓ After every create/update/delete, call writeAuditLog()  
  ✓ Pass: action, entity\_type, entity\_id, metadata  
  ✓ Within same transaction as mutation

EXAMPLE:  
\`\`\`typescript  
  await db.transaction(async (tx) \=\> {  
    // Mutate  
    const flag \= await tx.insert(scope\_flags).values(...).returning();  
      
    // Log (same transaction)  
    await writeAuditLog(tx, {  
      action: 'created',  
      entity\_type: 'scope\_flag',  
      entity\_id: flag.id,  
      metadata: { confidence: flag.confidence, severity: flag.severity }  
    });  
  });  
\`\`\`

ENFORCEMENT: Code review checks every mutating operation has audit\_log write.  
            PR blocks if audit logging missing.  
            Axiom alerts if audit\_log write fails (data integrity risk).

4.7 Testing Pattern (Frontend \+ Backend)

RULE: All P0 features require BOTH unit test AND E2E test.  
      Tests must pass in CI before PR can merge.

REQUIRED COVERAGE:  
  ├─ packages/db: 80% unit test coverage (query helpers, audit log)  
  ├─ apps/api/services: 80% unit test coverage (all business logic)  
  ├─ apps/web/components: 60% unit test coverage (critical only)  
  └─ E2E: All P0 happy path \+ error path (Playwright)

TEST NAMING:  
  ├─ Unit tests: {feature}.service.test.ts (same file directory as source)  
  ├─ E2E tests: {feature}-flow.spec.ts (apps/web/tests/e2e/)  
  └─ Fixtures: fixtures/{feature}.ts (test data setup)

ENFORCEMENT: GitHub Actions runs tests on every PR.   
            PR blocks if tests fail.  
            Coverage reports generated; targets enforced.

4.8 Error Handling at Route Level (Backend)

RULE: Route handlers must NOT throw exceptions.  
      All errors caught and handled with proper HTTP response.

REQUIRED:  
  ✓ try-catch at route level  
  ✓ Transform exception to AppError  
  ✓ Return JSON response with error code \+ message  
  ✓ Log error to Sentry

EXAMPLE:  
\`\`\`typescript  
  app.post('/scope-flags/:id/confirm', async (c) \=\> {  
    try {  
      const flagId \= c.req.param('id');  
      const flag \= await scopeFlagService.confirmFlag(flagId);  
      return c.json({ status: 'success', data: flag });  
    } catch (err) {  
      if (err instanceof ScopeAmbiguityError) {  
        return c.json(  
          { error: err.code, message: err.message },  
          { status: 400 }  
        );  
      }  
      // Unexpected error  
      Sentry.captureException(err, { tags: { route: '/scope-flags/:id/confirm' } });  
      return c.json(  
        { error: 'INTERNAL\_ERROR', message: 'Something went wrong' },  
        { status: 500 }  
      );  
    }  
  });  
\`\`\`

ENFORCEMENT: Code review checks every route has try-catch.  
            PR blocks if exception handling missing.

═══════════════════════════════════════════════════════════════════════════════  
                  SECTION 5: DATA MODEL & SCHEMA (COMPLETE)  
═══════════════════════════════════════════════════════════════════════════════

5.1 Core Tables (Drizzle Schema)

workspaces (Agency account)  
  ├─ id: uuid (primary)  
  ├─ name: varchar (agency name)  
  ├─ plan: enum ('solo' | 'studio' | 'agency')  
  ├─ stripe\_customer\_id: varchar (unique)  
  ├─ stripe\_subscription\_id: varchar (nullable)  
  ├─ branding\_json: jsonb ({ logo\_url, primary\_color, secondary\_color })  
  ├─ settings\_json: jsonb ({ reminder\_schedule, auto\_hold\_threshold })  
  ├─ created\_at: timestamp (server-side default)  
  ├─ updated\_at: timestamp (auto-update on every change)  
  ├─ deleted\_at: timestamp (nullable, soft delete)  
  └─ indexes: UNIQUE(stripe\_customer\_id), (created\_at DESC)

users (Team members)  
  ├─ id: uuid (primary)  
  ├─ workspace\_id: uuid (foreign key → workspaces, CASCADE delete)  
  ├─ email: varchar (unique per workspace)  
  ├─ hashed\_password: varchar (bcrypt hash)  
  ├─ role: enum ('owner' | 'admin' | 'member' | 'viewer')  
  ├─ created\_at: timestamp  
  └─ deleted\_at: timestamp (nullable, soft delete)

clients (End-user clients)  
  ├─ id: uuid (primary)  
  ├─ workspace\_id: uuid (foreign key)  
  ├─ name: varchar (client company name)  
  ├─ email: varchar (primary contact)  
  ├─ portal\_token: varchar (hashed UUID, unique)  
  ├─ token\_expires\_at: timestamp  
  ├─ created\_at: timestamp  
  └─ deleted\_at: timestamp (soft delete)

projects (Client engagement)  
  ├─ id: uuid (primary)  
  ├─ workspace\_id: uuid (foreign key)  
  ├─ client\_id: uuid (foreign key → clients)  
  ├─ sow\_id: uuid (foreign key → statements\_of\_work, nullable)  
  ├─ status: enum ('draft' | 'active' | 'completed' | 'paused')  
  ├─ created\_at: timestamp  
  ├─ updated\_at: timestamp  
  ├─ deleted\_at: timestamp  
  └─ indexes: (workspace\_id, status), (client\_id, created\_at DESC)

scope\_interviews (Pre-project data collection)  
  ├─ id: uuid (primary)  
  ├─ project\_id: uuid (foreign key)  
  ├─ project\_type: enum ('brand', 'web', 'logo', 'print', 'packaging')  
  ├─ answers\_json: jsonb ({ question\_key: answer, ... })  
  ├─ completed\_at: timestamp  
  └─ created\_at: timestamp

statements\_of\_work (Master scope document)  
  ├─ id: uuid (primary)  
  ├─ project\_id: uuid (foreign key)  
  ├─ raw\_text: text (original uploaded/pasted SOW)  
  ├─ source\_file\_url: varchar (R2 URL to original PDF/text)  
  ├─ parsed\_at: timestamp  
  ├─ status: enum ('draft' | 'reviewing' | 'active' | 'archived')  
  ├─ created\_at: timestamp  
  └─ updated\_at: timestamp

scope\_clauses (Parsed SOW components)  
  ├─ id: uuid (primary)  
  ├─ sow\_id: uuid (foreign key)  
  ├─ clause\_type: enum ('deliverable' | 'exclusion' | 'revision' |   
  │                     'timeline' | 'payment')  
  ├─ content: text (full clause text)  
  ├─ examples\_json: jsonb ({ example\_1, example\_2, ... })  
  ├─ is\_active: boolean (only active clauses used for flag detection)  
  ├─ created\_at: timestamp  
  └─ indexes: (sow\_id, clause\_type), (sow\_id, is\_active)

scope\_meters (Visual scope health tracking)  
  ├─ id: uuid (primary)  
  ├─ project\_id: uuid (foreign key, unique)  
  ├─ total\_deliverables: integer  
  ├─ deliverables\_complete: integer  
  ├─ revision\_limit: integer  
  ├─ revisions\_used: integer  
  ├─ updated\_at: timestamp  
  └─ no indexes (rarely queried, updated frequently)

messages (Client communication)  
  ├─ id: uuid (primary)  
  ├─ project\_id: uuid (foreign key)  
  ├─ sender\_type: enum ('client' | 'agency')  
  ├─ sender\_id: varchar (user\_id if agency, 'client' if client)  
  ├─ content: text (message body)  
  ├─ message\_type: enum ('text' | 'system')  
  ├─ created\_at: timestamp  
  └─ indexes: (project\_id, created\_at DESC)

scope\_flags (Flagged out-of-scope requests)  
  ├─ id: uuid (primary)  
  ├─ message\_id: uuid (foreign key)  
  ├─ project\_id: uuid (foreign key)  
  ├─ sow\_clause\_id: uuid (foreign key → scope\_clauses)  
  ├─ confidence: decimal (0.0–1.0)  
  ├─ severity: enum ('low' | 'medium' | 'high')  
  ├─ status: enum ('pending' | 'reviewed' | 'confirmed' | 'dismissed' |   
  │              'options\_sent' | 'resolved')  
  ├─ created\_at: timestamp  
  ├─ updated\_at: timestamp  
  └─ indexes: (project\_id, status, created\_at DESC)

scope\_options (Multi-option CO framework)  
  ├─ id: uuid (primary)  
  ├─ flag\_id: uuid (foreign key)  
  ├─ option\_letter: enum ('A' | 'B' | 'C')  
  ├─ title: varchar  
  ├─ description: text  
  ├─ estimated\_hours: decimal  
  ├─ price: decimal (in cents; 1200 \= $12.00)  
  ├─ currency: enum ('USD' | 'EUR' | 'GBP')  
  ├─ created\_at: timestamp  
  └─ no indexes (small table, rarely filtered)

change\_orders (Scope addition contracts)  
  ├─ id: uuid (primary)  
  ├─ scope\_flag\_id: uuid (foreign key)  
  ├─ option\_id: uuid (foreign key → scope\_options, nullable)  
  ├─ title: varchar  
  ├─ description: text  
  ├─ estimated\_hours: decimal  
  ├─ price: decimal (in cents)  
  ├─ currency: enum  
  ├─ status: enum ('draft' | 'sent' | 'pending\_signature' | 'accepted' |   
  │              'declined')  
  ├─ signed\_at: timestamp (nullable)  
  ├─ signed\_by\_name: varchar (nullable)  
  ├─ pdf\_url: varchar (R2 URL to signed PDF)  
  ├─ stripe\_payment\_intent\_id: varchar (nullable)  
  ├─ created\_at: timestamp  
  ├─ updated\_at: timestamp  
  └─ indexes: (scope\_flag\_id, status), (created\_at DESC)

client\_behavior\_models (Per-client ML features)  
  ├─ id: uuid (primary)  
  ├─ client\_id: uuid (foreign key, unique)  
  ├─ acceptance\_rate: decimal (0.0–1.0)  
  ├─ avg\_negotiation\_rounds: decimal  
  ├─ price\_sensitivity\_pct: decimal (% discount before acceptance)  
  ├─ typical\_response\_hours: integer  
  ├─ preferred\_channel: enum ('email' | 'portal')  
  ├─ total\_cos: integer (denominator for acceptance rate)  
  ├─ updated\_at: timestamp  
  └─ model\_version: integer (for retraining)

retainer\_tracking (Retainer client analytics)  
  ├─ id: uuid (primary)  
  ├─ project\_id: uuid (foreign key)  
  ├─ workspace\_id: uuid (foreign key)  
  ├─ month: date (YYYY-MM-01)  
  ├─ monthly\_oos\_requests: integer  
  ├─ monthly\_oos\_value: decimal (sum of all OOS request values)  
  ├─ trend\_json: jsonb ({ 3mo\_avg, 6mo\_avg, trend: 'up' | 'down' })  
  ├─ recommended\_increase: decimal (nullable)  
  └─ created\_at: timestamp

audit\_log (Immutable audit trail)  
  ├─ id: uuid (primary)  
  ├─ workspace\_id: uuid (foreign key)  
  ├─ actor\_id: uuid (user\_id, nullable if system action)  
  ├─ entity\_type: varchar (projects, flags, change\_orders, etc.)  
  ├─ entity\_id: uuid  
  ├─ action: varchar (created, updated, deleted, confirmed, dismissed)  
  ├─ old\_state: jsonb (previous values, nullable)  
  ├─ new\_state: jsonb (new values)  
  ├─ metadata\_json: jsonb (context, reason, etc.)  
  ├─ created\_at: timestamp (server-side, immutable)  
  └─ indexes: (workspace\_id, entity\_type, entity\_id), (created\_at DESC)

rate\_cards (Pricing templates)  
  ├─ id: uuid (primary)  
  ├─ workspace\_id: uuid (foreign key)  
  ├─ service\_type: varchar (brand, web, logo, etc.)  
  ├─ hourly\_rate: decimal (in cents; 8500 \= $85/hr)  
  ├─ created\_at: timestamp  
  └─ updated\_at: timestamp

5.2 Index Strategy (Performance)

Mandatory indexes:

\-- Projects  
CREATE INDEX ON projects(workspace\_id, status, created\_at DESC);

\-- Scope flags (for feed, real-time updates)  
CREATE INDEX ON scope\_flags(project\_id, status, created\_at DESC);

\-- Messages (for inbox rendering)  
CREATE INDEX ON messages(project\_id, created\_at DESC);

\-- Scope clauses (for flag detection)  
CREATE INDEX ON scope\_clauses(sow\_id, is\_active);

\-- Change orders (for client history)  
CREATE INDEX ON change\_orders(scope\_flag\_id);

\-- Audit log (for compliance queries)  
CREATE INDEX ON audit\_log(workspace\_id, entity\_type, entity\_id);  
CREATE INDEX ON audit\_log(created\_at DESC);

\-- Rate cards (for CO pricing)  
CREATE INDEX ON rate\_cards(workspace\_id, service\_type);

5.3 RLS Policies (Multi-tenant Isolation)

All tables with workspace\_id require RLS policy:

CREATE POLICY workspace\_isolation ON {table\_name}  
  USING (workspace\_id \=   
    (SELECT workspace\_id FROM users WHERE id \= auth.uid())  
  );

Portal access (clients) uses project\_id scope, validated server-side (no RLS   
needed; token authentication instead).

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 6: API SPECIFICATION (COMPLETE)  
═══════════════════════════════════════════════════════════════════════════════

6.1 Project Management Endpoints

POST /api/projects  
  ├─ Auth: JWT (agency user)  
  ├─ Body: { client\_id, project\_type }  
  ├─ Returns: { id, workspace\_id, status, created\_at }  
  ├─ Errors: 400 (invalid client), 401 (auth), 409 (duplicate)  
  └─ Audit: { action: 'created', entity\_type: 'projects', entity\_id }

GET /api/projects  
  ├─ Auth: JWT  
  ├─ Query: { status?, limit, offset }  
  ├─ Returns: \[{ id, name, client\_name, status, sow\_status, ... }\]  
  └─ Pagination: { total, limit, offset }

GET /api/projects/:id  
  ├─ Auth: JWT  
  ├─ Returns: { id, client, sow, status, scope\_meter, ... }  
  └─ Errors: 404 (not found), 403 (not in workspace)

PATCH /api/projects/:id  
  ├─ Auth: JWT  
  ├─ Body: { status? }  
  ├─ Audit: { action: 'updated', old\_state, new\_state }  
  └─ Returns: updated project

DELETE /api/projects/:id  
  ├─ Auth: JWT (owner only)  
  ├─ Soft delete: deleted\_at \= NOW()  
  └─ Audit: { action: 'deleted', entity\_id }

6.2 SOW Management Endpoints

POST /api/sow/upload  
  ├─ Auth: JWT  
  ├─ Body: FormData { file (PDF/text), project\_id }  
  ├─ Logic:  
  │  1\. Upload file to R2 (presigned URL)  
  │  2\. Create statements\_of\_work record (status: draft)  
  │  3\. Dispatch BullMQ job: { job\_type: 'parse\_sow' }  
  │  4\. Return job\_id (client polls for completion)  
  └─ Returns: { sow\_id, job\_id, status: 'parsing' }

GET /api/sow/:id  
  ├─ Auth: JWT  
  ├─ Returns: { id, project\_id, status, clauses: \[...\], extracted\_at, ... }  
  └─ Clauses grouped by type (deliverable, exclusion, revision, etc.)

PATCH /api/sow/:id/clauses/:clauseId  
  ├─ Auth: JWT  
  ├─ Body: { content?, examples? }  
  ├─ Audit: clause update  
  └─ Returns: updated clause

POST /api/sow/:id/activate  
  ├─ Auth: JWT  
  ├─ Logic:  
  │  1\. Mark SOW status \= 'active'  
  │  2\. Mark all clauses is\_active \= true  
  │  3\. Create scope\_meters record  
  │  4\. Disable previous SOW (if exists)  
  ├─ Audit: { action: 'activated', entity\_id, metadata: { clause\_count } }  
  └─ Returns: { status: 'active', clauses\_active\_count }

6.3 Scope Flag & Analysis Endpoints

POST /api/messages/:projectId  
  ├─ Auth: JWT (agency) or token (client)  
  ├─ Body: { content, sender\_type }  
  ├─ Logic:  
  │  1\. Store message in messages table  
  │  2\. If sender \= client AND sow.status \= active:  
  │     └─ Dispatch BullMQ job: { job\_type: 'scope\_check' }  
  ├─ Returns: { message\_id, status: 'stored' }  
  └─ Subabase real-time: Both parties see message immediately

GET /api/scope-flags/:projectId  
  ├─ Auth: JWT  
  ├─ Query: { status?, severity? }  
  ├─ Returns: \[{ id, message, confidence, status, severity, ... }\]  
  └─ Real-time: Supabase subscription pushes new flags

POST /api/scope-flags/:id/confirm  
  ├─ Auth: JWT  
  ├─ Logic:  
  │  1\. Update flag status \= 'confirmed'  
  │  2\. Dispatch BullMQ job: { job\_type: 'generate\_options' }  
  ├─ Returns: { flag\_id, status: 'confirmed' }  
  └─ Audit: { action: 'confirmed', entity\_id }

POST /api/scope-flags/:id/dismiss  
  ├─ Auth: JWT  
  ├─ Body: { reason }  
  ├─ Logic:  
  │  1\. Update flag status \= 'dismissed'  
  │  2\. Log reason in metadata  
  │  3\. ML model learns: "This was not actually out-of-scope"  
  ├─ Audit: { action: 'dismissed', metadata: { reason } }  
  └─ Returns: { flag\_id, status: 'dismissed' }

POST /api/scope-flags/:id/snooze  
  ├─ Auth: JWT  
  ├─ Logic: Schedule BullMQ delayed job (24h) to re-surface flag  
  └─ Returns: { flag\_id, resurfaced\_at: tomorrow }

GET /api/scope-options/:flagId  
  ├─ Returns: \[{ id, letter, title, price, description }\]  
  └─ Sorted: By probability client accepts

6.4 Change Order Endpoints

POST /api/change-orders  
  ├─ Auth: JWT  
  ├─ Body: { option\_id, scope\_flag\_id }  
  ├─ Logic:  
  │  1\. Create change\_orders record (status: draft)  
  │  2\. Optionally generate PDF (if auto\_generate \= true)  
  ├─ Returns: { id, status: 'draft' }  
  └─ Audit: { action: 'created', entity\_type: 'change\_orders' }

GET /api/change-orders/:id  
  ├─ Auth: JWT or token (client)  
  ├─ Returns: { id, title, description, price, status, signed\_at, ... }  
  └─ Client sees: read-only view \+ signature field

PATCH /api/change-orders/:id  
  ├─ Auth: JWT (agency only, before sending)  
  ├─ Body: { title?, description?, price?, ... }  
  ├─ Validation: Only allows edits if status \= 'draft'  
  └─ Returns: updated CO

POST /api/change-orders/:id/send  
  ├─ Auth: JWT  
  ├─ Logic:  
  │  1\. Dispatch Resend email (CHANGE\_ORDER\_01 template)  
  │  2\. Generate PDF (server-side React → PDF)  
  │  3\. Store PDF in R2 (private ACL)  
  │  4\. Create Stripe payment intent (1.5% optional fee)  
  │  5\. Mark CO status \= 'sent'  
  ├─ Audit: { action: 'sent', entity\_id }  
  └─ Returns: { id, status: 'sent', pdf\_url\_expires\_at }

POST /api/change-orders/:id/accept  
  ├─ Auth: token (client)  
  ├─ Body: { signed\_by\_name }  
  ├─ Logic:  
  │  1\. Update CO: status \= 'accepted', signed\_at \= NOW(), signed\_by\_name  
  │  2\. Charge Stripe (if payment\_intent exists)  
  │  3\. Update SOW scope (add new clauses)  
  │  4\. Dispatch Slack notification  
  │  5\. Dispatch agency email confirmation  
  ├─ Audit: { action: 'accepted', metadata: { signed\_by\_name } }  
  └─ Returns: { id, status: 'accepted', pdf\_download\_url }

POST /api/change-orders/:id/decline  
  ├─ Auth: token (client)  
  ├─ Body: { reason }  
  ├─ Logic:  
  │  1\. Update CO status \= 'declined'  
  │  2\. Notify agency  
  ├─ Audit: { action: 'declined', metadata: { reason } }  
  └─ Returns: { id, status: 'declined' }

6.5 Rate Card Management

GET /api/rate-cards  
  ├─ Auth: JWT  
  ├─ Returns: \[{ id, service\_type, hourly\_rate }\]  
  └─ Sorted by service\_type

POST /api/rate-cards  
  ├─ Auth: JWT (owner)  
  ├─ Body: { service\_type, hourly\_rate }  
  └─ Returns: created rate card

PATCH /api/rate-cards/:id  
  ├─ Auth: JWT (owner)  
  ├─ Body: { hourly\_rate }  
  └─ Returns: updated rate card

6.6 Real-Time Subscriptions (WebSocket, Supabase)

subscribe('scope\_flags', { project\_id })  
  ├─ Events: INSERT | UPDATE  
  ├─ Payload: { id, status, confidence, severity, ... }  
  └─ Client UI updates immediately without polling

subscribe('change\_orders', { project\_id })  
  ├─ Events: INSERT | UPDATE  
  └─ Payload: { id, status, signed\_at, ... }

subscribe('messages', { project\_id })  
  ├─ Events: INSERT  
  └─ Payload: { id, content, sender\_type, created\_at }

6.7 Error Response Format (All Endpoints)

HTTP 400 (Bad Request):  
\`\`\`json  
{  
  "error": "INVALID\_PROJECT\_TYPE",  
  "message": "project\_type must be one of: brand, web, logo, print, packaging"  
}  
\`\`\`

HTTP 401 (Unauthorized):  
\`\`\`json  
{  
  "error": "UNAUTHORIZED",  
  "message": "JWT token missing or invalid"  
}  
\`\`\`

HTTP 403 (Forbidden):  
\`\`\`json  
{  
  "error": "WORKSPACE\_ISOLATION\_VIOLATION",  
  "message": "You do not have access to this resource"  
}  
\`\`\`

HTTP 404 (Not Found):  
\`\`\`json  
{  
  "error": "RESOURCE\_NOT\_FOUND",  
  "message": "Scope flag with id 'flag\_123' not found"  
}  
\`\`\`

HTTP 500 (Internal Server Error):  
\`\`\`json  
{  
  "error": "INTERNAL\_ERROR",  
  "message": "Something went wrong. Error ID: err\_abc123 (for support)"  
}  
\`\`\`

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 7: AI PROCESSING PIPELINES (STEP-BY-STEP)  
═══════════════════════════════════════════════════════════════════════════════

All AI operations follow this pattern:  
  1\. Dispatch BullMQ job (non-blocking)  
  2\. Worker processes asynchronously  
  3\. Store results in database  
  4\. Real-time push to client

7.1 SOW Parsing Pipeline

Trigger: POST /api/sow/upload { file, project\_id }

Step 1: API (Hono route handler)  
  ├─ Validate file (PDF or text)  
  ├─ Upload to R2 (presigned URL flow)  
  ├─ Create statements\_of\_work record (status: 'draft')  
  └─ Dispatch BullMQ job:  
     queue.add('parse\_sow', { sow\_id }, { attempts: 3, backoff: exponential })

Step 2: AI Worker (FastAPI BullMQ worker)  
  ├─ Fetch sow\_id from job  
  ├─ Retrieve SOW text from R2  
  ├─ If PDF: Use PyMuPDF to extract text  
  ├─ If text file: Read directly  
  │  
  ├─ Construct Claude prompt:  
  │  System: "You are a contract parser for creative SOWs..."  
  │  Input: Full SOW text  
  │  Output schema (tool\_use):  
  │    {  
  │      "deliverables": \[  
  │        { "name": "Logo system", "description": "...", "examples": \[...\] }  
  │      \],  
  │      "exclusions": \[  
  │        { "item": "Social media templates", "reason": "..." }  
  │      \],  
  │      "revision\_limits": { "limit": 2, "scope\_per\_round": "..." },  
  │      "timeline": { "start": "2026-01-15", "end": "2026-03-28" },  
  │      "payment\_terms": { "total": 12000, "schedule": "50/50 split" }  
  │    }  
  │  
  ├─ Call Claude API (claude-sonnet-4-6, tool\_use mode)  
  ├─ Validate output against Pydantic schema  
  ├─ Store in database:  
  │  1\. Update sow: status \= 'parsed', parsed\_at \= NOW()  
  │  2\. Create scope\_clauses records (one per clause)  
  │     \- Each clause has clause\_type enum, content, examples\_json  
  │  
  ├─ Log operation (Axiom):  
  │  {  
  │    "operation": "parse\_sow",  
  │    "sow\_id": "sow\_123",  
  │    "status": "success",  
  │    "clauses\_parsed": 15,  
  │    "duration\_ms": 5200,  
  │    "model": "claude-sonnet-4-6",  
  │    "tokens\_used": 2340  
  │  }  
  │  
  └─ Return job status: success

Step 3: Real-time push (Supabase)  
  └─ Triggers sow.UPDATE event  
     Client receives: { sow\_id, status: 'parsed', clause\_count: 15 }  
     Frontend shows: SOW review editor with all clauses grouped by type

Error Handling:  
  ├─ If parse fails: Retry 3 times (exponential backoff)  
  ├─ If all retries fail: Store error in job metadata, notify agency via Slack  
  ├─ Agency can manually input SOW if AI parsing fails

7.2 Scope Flag Detection Pipeline

Trigger: POST /api/messages/:projectId { content, sender\_type }

Step 1: API route handler  
  ├─ Store message in database (messages table)  
  ├─ If message.sender\_type \= 'client' AND sow.status \= 'active':  
  └─ Dispatch BullMQ job:  
     queue.add('scope\_check', { message\_id, project\_id },   
               { priority: high, attempts: 3, timeout: 10000 })

Step 2: AI Worker (FastAPI)  
  ├─ Fetch message \+ project \+ active SOW clauses  
  ├─ Construct Claude prompt:  
  │  System: "You are a scope enforcement AI..."  
  │  Context: \[List all active SOW clauses with full text\]  
  │  Client message: \[User's request\]  
  │  Output schema (tool\_use):  
  │    {  
  │      "is\_in\_scope": boolean,  
  │      "confidence": 0.82,  // 0.0–1.0  
  │      "matching\_clauses": \[  
  │        { "clause\_id": "...", "clause\_type": "exclusion", "relevance": 0.85 }  
  │      \],  
  │      "severity": "high",  // low | medium | high  
  │      "explanation": "...",  
  │      "suggested\_response": "Love that idea\! Here's how we can make it..."  
  │    }  
  │  
  ├─ Call Claude API (fast, sub-5s target)  
  ├─ Validate output schema  
  ├─ Logic:  
  │  IF is\_in\_scope \= true:  
  │    └─ No flag created; message marked in-scope  
  │  ELSE IF is\_in\_scope \= false AND confidence \> 0.60:  
  │    ├─ Create scope\_flags record  
  │    │  \- confidence, severity, suggested\_response stored  
  │    │  \- status \= 'pending'  
  │    ├─ Log to Axiom: { operation: 'scope\_check', is\_flagged: true,   
  │    │                  confidence, severity }  
  │    └─ Dispatch Subabase real-time push (both parties notified)  
  │  ELSE IF confidence ≤ 0.60:  
  │    └─ No flag created (ambiguous, requires human review)  
  │  
  └─ Return job status

Step 3: Real-time push (simultaneous bilateral notification)  
    
  Agency dashboard:  
  └─ Subabase subscription fires:  
     new scope\_flags INSERT event  
     ScopeFlagCard appears in feed (red, high visibility)  
     Nav badge increments (🔴 red)  
    
  Client portal:  
  └─ Subabase subscription fires:  
     System message appears in inbox  
     Message: "This request appears to fall outside your agreement.   
              \[Agency\] has been notified and will follow up with options."  
     Color: Amber (not accusatory)

SLA: \<5 seconds p95 from message submission to both parties seeing update  
     Axiom alert if exceeds 7 seconds

Error Handling:  
  ├─ If Claude API returns error: Retry with exponential backoff  
  ├─ If retries fail: Flag as pending\_review (requires human)  
  ├─ Axiom alert sent (dev team) to investigate

7.3 Scope Options Generation Pipeline

Trigger: Agency clicks \[Confirm & Generate Options\] on scope flag

Step 1: API route handler  
  ├─ Update flag: status \= 'confirmed'  
  └─ Dispatch BullMQ job:  
     queue.add('generate\_options', { flag\_id }, { attempts: 2, timeout: 5000 })

Step 2: AI Worker (FastAPI)  
  ├─ Fetch flag \+ message \+ SOW clauses \+ rate\_cards  
  ├─ Retrieve client\_behavior\_model (if exists)  
  ├─ Construct Claude prompt:  
  │  System: "You are a pricing strategist..."  
  │  Context:   
  │    \- Original scope clause that was violated  
  │    \- Client's request (what they asked for)  
  │    \- Agency's rate card  
  │    \- Client's history (if available)  
  │  Output schema (tool\_use):  
  │    {  
  │      "option\_a": {  
  │        "title": "Full Social Templates Package",  
  │        "description": "20 templates, all platforms, Figma \+ PDF",  
  │        "estimated\_hours": 16,  
  │        "price\_cents": 136000  // $1,360  
  │      },  
  │      "option\_b": { ... },  
  │      "option\_c": { ... },  
  │      "reasoning": "Option A is full scope. Option C is budget-friendly..."  
  │    }  
  │  
  ├─ Auto-calculate prices from rate card (overridable)  
  ├─ Store scope\_options records (3 options, linked to flag\_id)  
  ├─ Fetch client\_behavior\_model:  
  │  \- Prediction: "This client accepts \<$1,200 with 90% confidence"  
  │  \- Store prediction in metadata  
  │  
  ├─ Return options with prediction metadata  
  └─ Axiom log: { operation: 'generate\_options', option\_count: 3, duration\_ms }

Step 3: Agency dashboard  
  └─ Modal appears with:  
     \- 3 draft options  
     \- Client behavior insight ("This client accepts Option C with 95%   
       confidence")  
     \- Edit buttons (agency can customize all fields)  
     \- \[Send These Options to Client\]

7.4 Change Order Generation Pipeline

Trigger: Client selects one option from 3 presented

Step 1: API route handler  
  ├─ Client submits: selected\_option\_id  
  └─ Dispatch BullMQ job:  
     queue.add('generate\_change\_order', { option\_id }, { attempts: 2 })

Step 2: AI Worker (FastAPI)  
  ├─ Fetch option \+ scope\_flag \+ client \+ SOW  
  ├─ Construct Claude prompt:  
  │  System: "Generate a professional change order..."  
  │  Context: Option details, original scope clause, client name  
  │  Output schema:  
  │    {  
  │      "title": "Change Order: Social Media Templates",  
  │      "work\_description": "Professional description of what's included",  
  │      "estimated\_hours": 16,  
  │      "price\_cents": 136000,  
  │      "revised\_timeline": "Delivery by Feb 25, 2026",  
  │      "impact": "Revised project completion: Mar 28 (unchanged)"  
  │    }  
  │  
  ├─ Call Claude API (formal, professional tone)  
  ├─ Create change\_orders record:  
  │  \- All fields editable (agency can customize before sending)  
  │  \- status \= 'draft'  
  │  \- pdf\_url \= null (generated on send)  
  ├─ Generate Stripe payment intent (1.5% optional fee, not charged yet)  
  └─ Axiom log

Step 3: Agency notification  
  └─ In-app notification: "Change order ready for review"  
     Modal/inline editor opens with all CO fields editable  
     \[Send to Client\] button triggers CO sending

Step 4 (On Client Accept):  
  ├─ Client types name → \[Accept & Pay\] activates  
  ├─ POST /api/change-orders/:id/accept { signed\_by\_name }  
  ├─ API logic:  
  │  1\. Update CO: status \= 'accepted', signed\_at \= NOW()  
  │  2\. Charge Stripe (if payment\_intent exists)  
  │  3\. BullMQ job: 'activate\_change\_order'  
  └─ AI Worker activates CO:  
     ├─ Update SOW scope: Add new scope\_clauses for accepted additions  
     ├─ Update revision limits (if applicable)  
     ├─ Recalculate scope\_meters  
     └─ Log to audit\_log

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 8: FRONTEND IMPLEMENTATION GUIDE  
═══════════════════════════════════════════════════════════════════════════════

8.1 Folder Structure (apps/web/src)

app/  
├─ (auth)/                              // Login, register routes  
│  ├─ page.tsx                         // Login page  
│  ├─ register/page.tsx               // Registration  
│  └─ forgot-password/page.tsx        // Password reset  
│  
├─ (dashboard)/                        // Agency dashboard route group  
│  ├─ layout.tsx                      // Dashboard layout (sidebar, nav)  
│  ├─ page.tsx                        // Dashboard home  
│  ├─ projects/  
│  │  ├─ page.tsx                    // Projects list  
│  │  ├─ \[id\]/                       // Project detail  
│  │  │  ├─ page.tsx                // Project overview  
│  │  │  ├─ scope/page.tsx          // SOW management  
│  │  │  ├─ messages/page.tsx       // Client inbox  
│  │  │  └─ change-orders/page.tsx  // CO history  
│  │  └─ new/page.tsx               // Create new project  
│  │  
│  ├─ scope-flags/  
│  │  ├─ page.tsx                   // Scope flags feed  
│  │  └─ \[id\]/page.tsx              // Flag detail \+ options editor  
│  │  
│  ├─ settings/  
│  │  ├─ page.tsx                   // Workspace settings  
│  │  ├─ branding/page.tsx          // Logo, colors, domain  
│  │  └─ rate-cards/page.tsx        // Pricing setup  
│  │  
│  └─ change-orders/page.tsx         // All COs (agency-wide view)  
│  
├─ portal/  
│  ├─ \[token\]/                       // Dynamic route per client project  
│  │  ├─ layout.tsx                 // Portal layout (white-label)  
│  │  ├─ page.tsx                   // Portal entry / redirect  
│  │  ├─ scope/page.tsx             // What's included (client view)  
│  │  ├─ messages/page.tsx          // Client inbox  
│  │  └─ change-order/\[coId\]/       // View & sign CO  
│  │  
│  └─ not-found.tsx                 // Invalid token handling  
│  
└─ api/                             // Next.js API routes (proxy to Hono)  
   ├─ \[...slug\]/route.ts          // Catch-all proxy to API server

components/  
├─ dashboard/  
│  ├─ ProjectCard.tsx              // List item in projects  
│  ├─ ProjectDetail.tsx            // Full project view  
│  ├─ Dashboard.tsx                // Home page overview  
│  ├─ MetricCard.tsx               // KPI card (active projects, etc.)  
│  └─ Sidebar.tsx                  // Navigation sidebar  
│  
├─ scope-flag/  
│  ├─ ScopeFlagCard.tsx            // Flag in feed  
│  ├─ ScopeFlagDetail.tsx          // Full flag with AI response  
│  ├─ ScopeOptionsEditor.tsx       // Edit 3 options before sending  
│  └─ ScopeFlagFeed.tsx            // Real-time list  
│  
├─ change-order/  
│  ├─ ChangeOrderReview.tsx        // Agency preview  
│  ├─ ChangeOrderSignature.tsx     // Client signature screen  
│  └─ ChangeOrderPDF.tsx           // PDF renderer  
│  
├─ sow/  
│  ├─ SOWUploader.tsx              // File upload  
│  ├─ SOWReview.tsx                // Clause editor (accordion by type)  
│  ├─ SOWClauseEditor.tsx          // Inline edit single clause  
│  └─ SOWMeter.tsx                 // Visual scope progress  
│  
├─ portal/  
│  ├─ PortalLayout.tsx             // Client portal layout  
│  ├─ PortalBranding.tsx           // Inject agency colors/logo  
│  ├─ ClientInbox.tsx              // Messages thread  
│  ├─ ScopeDetails.tsx             // Included/excluded list  
│  └─ RevisionCounter.tsx          // Progress bar \+ at-limit modal  
│  
└─ shared/  
   ├─ Button.tsx                   // Radix UI button wrapper  
   ├─ Input.tsx                    // Radix input wrapper  
   ├─ Modal.tsx                    // Radix dialog wrapper  
   ├─ Badge.tsx                    // Status badges  
   ├─ Card.tsx                     // Card container  
   └─ LoadingSpinner.tsx           // Generic loading state

hooks/  
├─ useProjects.ts                   // React Query hook for projects list/detail  
├─ useScopeFlags.ts                // Real-time scope flags (Subabase subscription)  
├─ useChangeOrders.ts              // CO management  
├─ useSOW.ts                        // SOW operations  
├─ usePortalProject.ts             // Client portal project (token auth)  
├─ useAuth.ts                       // Auth context \+ Subabase session  
├─ useWorkspace.ts                 // Workspace settings  
└─ useRealtime.ts                  // Subabase real-time subscription helper

stores/  
├─ authStore.ts                     // Zustand: Auth state (user, session)  
├─ workspaceStore.ts              // Zustand: Workspace (plan, branding)  
├─ uiStore.ts                      // Zustand: UI state (sidebar open, modals)  
└─ notificationStore.ts            // Zustand: Notifications \+ badge counts

lib/  
├─ api.ts                           // Fetch wrapper (auth headers, errors)  
├─ constants.ts                     // Enums, config values  
├─ formatters.ts                    // Currency, date, confidence formatting  
├─ validators.ts                    // Zod schemas for client-side validation  
└─ theme.ts                         // CSS variables, color mappings

types/  
├─ api.ts                           // TypeScript types for API responses  
├─ domain.ts                        // Domain models (Project, ScopeFlag, etc.)  
└─ portal.ts                        // Portal-specific types

8.2 Key Implementation Patterns

State Management:  
  ├─ Zustand for global UI state (sidebar, auth, notifications)  
  ├─ React Query for server state (projects, flags, COs)  
  ├─ Form state via React Hook Form (not in Zustand)  
  └─ Real-time subscriptions via Subabase (automatic updates)

Real-time Updates (Critical):  
  ├─ Connect Subabase subscription in useEffect  
  ├─ Listen for INSERT/UPDATE events on relevant tables  
  ├─ Update React Query cache on events (refetchQueries if needed)  
  ├─ No polling; WebSocket-based only  
    
  Example:  
\`\`\`typescript  
  useEffect(() \=\> {  
    const channel \= supabase  
      .channel(\`scope\_flags:${projectId}\`)  
      .on('postgres\_changes',   
        { event: '\*', schema: 'public', table: 'scope\_flags' },  
        (payload) \=\> {  
          queryClient.invalidateQueries(\['scope-flags', projectId\]);  
        }  
      )  
      .subscribe();  
      
    return () \=\> channel.unsubscribe();  
  }, \[projectId\]);  
\`\`\`

Form Handling:  
  ├─ All forms use React Hook Form \+ Zod  
  ├─ Validation runs on change (not just submit)  
  ├─ Errors displayed inline (below field)  
  ├─ Submit button disabled until valid  
  └─ API errors mapped back to field errors

Async Operations:  
  ├─ Use React Query mutations (useMutation)  
  ├─ Show loading state during request  
  ├─ Show success toast on completion  
  ├─ Show error alert on failure (with user-facing message)  
  ├─ Never block UI (all requests async)

Client Portal Specifics:  
  ├─ No authentication required (token-based)  
  ├─ Portal token extracted from URL  
  ├─ usePortalProject hook handles token auth  
  ├─ Branding injected via CSS variables (server-side, no client manipulation)  
  ├─ Single project per URL (no multi-project navigation)

8.3 Component Implementation Examples

ScopeFlagCard Component:  
\`\`\`typescript  
// apps/web/src/components/scope-flag/ScopeFlagCard.tsx  
import React from 'react';  
import { ScopeFlag, SowClause } from '@/types/domain';  
import { Badge } from '@/components/shared/Badge';  
import { Button } from '@/components/shared/Button';

interface ScopeFlagCardProps {  
  flag: ScopeFlag;  
  clause: SowClause;  
  onConfirm: () \=\> void;  
  onDismiss: () \=\> void;  
  onSnooze: () \=\> void;  
}

export const ScopeFlagCard: React.FC\<ScopeFlagCardProps\> \= ({  
  flag,  
  clause,  
  onConfirm,  
  onDismiss,  
  onSnooze,  
}) \=\> {  
  const severityColor \= {  
    high: '\#DC2626',  
    medium: '\#D97706',  
    low: '\#2563EB',  
  }\[flag.severity\];

  const confidencePercentage \= Math.round(flag.confidence \* 100);

  return (  
    \<div  
      style={{ borderLeft: \`4px solid ${severityColor}\` }}  
      className="bg-white rounded-lg p-4 shadow-sm"  
    \>  
      \<div className="flex justify-between items-start mb-3"\>  
        \<div\>  
          \<Badge severity={flag.severity}\>{flag.severity.toUpperCase()}\</Badge\>  
          \<p className="text-sm text-gray-600 mt-1"\>  
            {flag.project\_name} · {flag.created\_at\_relative}  
          \</p\>  
        \</div\>  
      \</div\>

      \<div className="mb-4"\>  
        \<p className="font-medium text-gray-900 mb-2"\>Client message:\</p\>  
        \<div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm"\>  
          {flag.message\_text}  
        \</div\>  
      \</div\>

      \<div className="mb-4"\>  
        \<p className="font-medium text-gray-900 mb-2"\>SOW Clause:\</p\>  
        \<div className="bg-gray-100 p-3 rounded font-mono text-sm"\>  
          {clause.content}  
        \</div\>  
      \</div\>

      \<div className="mb-4"\>  
        \<p className="text-sm font-medium mb-1"\>  
          Confidence: {confidencePercentage}%  
        \</p\>  
        \<div className="w-full bg-gray-300 rounded-full h-2"\>  
          \<div  
            className="h-2 rounded-full bg-red-600"  
            style={{ width: \`${confidencePercentage}%\` }}  
          /\>  
        \</div\>  
      \</div\>

      \<div className="bg-blue-50 p-3 rounded mb-4"\>  
        \<p className="text-sm text-gray-700"\>  
          \<strong\>AI Suggested:\</strong\> {flag.suggested\_response}  
        \</p\>  
      \</div\>

      \<div className="flex gap-2"\>  
        \<Button onClick={onConfirm} className="flex-1"\>  
          🔴 Confirm & Generate Options  
        \</Button\>  
        \<Button onClick={onDismiss} variant="secondary"\>  
          ✓ In-Scope  
        \</Button\>  
        \<Button onClick={onSnooze} variant="tertiary"\>  
          ⏰ Snooze  
        \</Button\>  
      \</div\>  
    \</div\>  
  );  
};  
\`\`\`

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 9: SECURITY & COMPLIANCE CHECKLIST  
═══════════════════════════════════════════════════════════════════════════════

9.1 Authentication & Authorization

✓ Supabase Auth for agency users (JWT tokens, 1h expiry, auto-refresh)  
✓ Portal token (UUID v4) for client access (hashed in DB, unique per project)  
✓ Role-based access control (owner, admin, member, viewer)  
✓ All API routes require auth middleware  
✓ Client portal routes require token middleware  
✓ JWT validation on every protected request

9.2 Data Protection

✓ TLS 1.3 for all HTTPS connections  
✓ PostgreSQL encryption at rest (Subabase)  
✓ R2 AES-256 encryption at rest  
✓ Sensitive fields encrypted (portal tokens via scrypt)  
✓ No secrets in error messages  
✓ No sensitive data in logs (sanitize before logging)

9.3 Multi-tenant Isolation

✓ RLS policy on every table with workspace\_id  
✓ Application-layer workspaceId filter on every query  
✓ Defense-in-depth: both RLS \+ app filter required  
✓ No cross-workspace data access possible  
✓ Portal tokens scoped to single project

9.4 Rate Limiting

✓ Public portal endpoints: 10 submissions/hour/IP (Cloudflare edge)  
✓ API endpoints: 100 req/min/user (Redis rate limiter)  
✓ BullMQ: max 5 concurrent Claude API calls (prevent quota exhaustion)  
✓ Exponential backoff on 429 errors

9.5 Audit Logging

✓ Every mutation writes to audit\_log (same transaction)  
✓ audit\_log is immutable (append-only, server-side timestamp)  
✓ 7-year retention for compliance  
✓ All sensitive actions logged (approvals, dismissals, COs)  
✓ Actor identity always captured

9.6 Stripe Integration

✓ API key environment variable (server-side only)  
✓ Webhook signature validation (Stripe-Signature header)  
✓ Idempotent payment charge creation (same idempotency key \= safe retry)  
✓ No credit card data stored (Stripe handles PCI compliance)

9.7 Secret Management

✓ All secrets in environment variables (never in code)  
✓ Railway secrets for backend API  
✓ Vercel secrets for frontend (if needed)  
✓ Database credentials only in Subabase connection string  
✓ API key rotation planned (every 90 days)

9.8 File Upload Security

✓ Presigned URLs only (no direct file upload to API)  
✓ File type validation (PDF, text only)  
✓ File size limit (500MB max for deliverables)  
✓ Virus scan integration (if available, not critical for MVP)  
✓ R2 private ACL for sensitive files (PDFs)

9.9 GDPR / Privacy Compliance

✓ Privacy Policy published (Standard template)  
✓ Data Deletion API (DELETE /api/users/:id/data)  
✓ Data Export API (GET /api/users/:id/data/export)  
✓ 30-day deletion window (soft delete, then purge)  
✓ GDPR Data Processing Agreement (DPA) for enterprise customers

9.10 Security Scanning

✓ GitHub Actions secret scanner (blocks commits with secrets)  
✓ Sentry error tracking (no sensitive data in exceptions)  
✓ Dependabot (dependency vulnerability scanning)  
✓ OWASP Top 10 checklist (annually)  
✓ Penetration testing (pre-launch and annually)

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 10: TESTING STRATEGY (Complete)  
═══════════════════════════════════════════════════════════════════════════════

10.1 Unit Testing (Vitest \+ Jest)

Target Coverage: 80% for packages/db, apps/api/services

Test Categories:

A) Database Queries (packages/db)  
   ├─ query returns correct data  
   ├─ query respects workspace\_id filter  
   ├─ query handles null/edge cases  
   ├─ indexes improve query performance  
   └─ soft delete works (deleted\_at honored)

B) Service Logic (apps/api/services)  
   ├─ Positive path (happy case)  
   ├─ Negative path (error cases)  
   ├─ Input validation  
   ├─ Authorization checks  
   └─ Audit log written

C) Validators (Zod schemas)  
   ├─ Valid input passes  
   ├─ Invalid input fails with proper error  
   ├─ Type safety preserved  
   └─ Custom validators work

Test Structure:  
\`\`\`typescript  
// apps/api/src/services/scope-flag.service.test.ts  
import { describe, it, expect, beforeEach, afterEach } from 'vitest';  
import { scopeFlagService } from './scope-flag.service';  
import { db } from '@/db';

describe('ScopeFlagService', () \=\> {  
  describe('confirmFlag', () \=\> {  
    it('should confirm flag and create change order', async () \=\> {  
      // Setup  
      const flag \= await createTestFlag();  
        
      // Act  
      const result \= await scopeFlagService.confirmFlag(flag.id);  
        
      // Assert  
      expect(result.status).toBe('confirmed');  
      expect(result.updated\_at).toBeDefined();  
        
      // Verify audit log  
      const audit \= await db.select()  
        .from(audit\_log)  
        .where(eq(audit\_log.entity\_id, flag.id))  
        .limit(1);  
        
      expect(audit\[0\].action).toBe('confirmed');  
    });

    it('should throw error if flag already confirmed', async () \=\> {  
      const flag \= await createTestFlag({ status: 'confirmed' });  
      await expect(  
        scopeFlagService.confirmFlag(flag.id)  
      ).rejects.toThrow('FLAG\_ALREADY\_CONFIRMED');  
    });  
  });  
});  
\`\`\`

10.2 Integration Testing (Supertest \+ Vitest)

Test API endpoints with real database:

\`\`\`typescript  
// apps/api/src/routes/scope-flags.route.test.ts  
import { describe, it, expect, beforeEach } from 'vitest';  
import { request } from 'supertest';  
import app from '@/main';

describe('POST /api/scope-flags/:id/confirm', () \=\> {  
  it('should confirm flag and generate options', async () \=\> {  
    const { flag, workspaceId, jwt } \= await setupTestData();  
      
    const res \= await request(app)  
      .post(\`/api/scope-flags/${flag.id}/confirm\`)  
      .set('Authorization', \`Bearer ${jwt}\`)  
      .expect(200);  
      
    expect(res.body.data.status).toBe('confirmed');  
  });

  it('should reject with 401 if not authenticated', async () \=\> {  
    const { flag } \= await setupTestData();  
      
    await request(app)  
      .post(\`/api/scope-flags/${flag.id}/confirm\`)  
      .expect(401);  
  });

  it('should reject with 403 if not in workspace', async () \=\> {  
    const flag \= await createTestFlag({ workspace\_id: 'ws\_other' });  
    const { jwt } \= await setupTestData({ workspace\_id: 'ws\_mine' });  
      
    await request(app)  
      .post(\`/api/scope-flags/${flag.id}/confirm\`)  
      .set('Authorization', \`Bearer ${jwt}\`)  
      .expect(403);  
  });  
});  
\`\`\`

10.3 E2E Testing (Playwright)

Happy path \+ error path for each P0 feature:

\`\`\`typescript  
// apps/web/tests/e2e/scope-flag-flow.spec.ts  
import { test, expect } from '@playwright/test';

test.describe('Scope Flag Flow', () \=\> {  
  test('agency confirms flag and client accepts CO', async ({ page }) \=\> {  
    // 1\. Login as agency  
    await page.goto('/');  
    await page.fill('\[name="email"\]', 'agency@example.com');  
    await page.fill('\[name="password"\]', 'password123');  
    await page.click('\[type="submit"\]');  
      
    // 2\. Navigate to project with scope flag  
    await page.click('\[href="/projects"\]');  
    await page.click('\[data-project-id="proj\_123"\]');  
      
    // 3\. Verify flag appears  
    await expect(page.locator('text=SCOPE FLAG')).toBeVisible();  
      
    // 4\. Click confirm  
    await page.click('button:has-text("Confirm & Generate Options")');  
      
    // 5\. Verify options modal  
    const modal \= page.locator('\[role="dialog"\]');  
    await expect(modal.locator('text=OPTION A')).toBeVisible();  
    await expect(modal.locator('text=OPTION B')).toBeVisible();  
    await expect(modal.locator('text=OPTION C')).toBeVisible();  
      
    // 6\. Send options  
    await page.click('\[role="dialog"\] button:has-text("Send")');  
      
    // 7\. Login as client  
    await page.context().clearCookies();  
    await page.goto(\`/portal/${PORTAL\_TOKEN}\`);  
      
    // 8\. View options in inbox  
    await expect(page.locator('text=Option A')).toBeVisible();  
      
    // 9\. Select Option C  
    await page.click('\[data-option="C"\]');  
      
    // 10\. Sign CO  
    await page.fill('\[name="signed\_by\_name"\]', 'John Smith');  
    await page.click('button:has-text("Accept & Pay")');  
      
    // 11\. Verify success  
    await expect(page.locator('text=Change order accepted')).toBeVisible();  
  });  
});  
\`\`\`

10.4 Test Coverage Tracking

CI/CD enforces coverage:  
  ├─ Fail if coverage \< 80% (packages/db, services)  
  ├─ Fail if any P0 feature lacks E2E test  
  ├─ Coverage report uploaded to Codecov  
  └─ GitHub PR shows coverage delta

═══════════════════════════════════════════════════════════════════════════════  
               SECTION 11: CI/CD PIPELINE & DEPLOYMENT  
═══════════════════════════════════════════════════════════════════════════════

11.1 GitHub Actions Workflow

On Pull Request:  
  1\. TypeScript compiler (tsc \--noEmit)  
  2\. ESLint \+ Prettier  
  3\. Unit tests (Vitest)  
  4\. Integration tests (Supertest)  
  5\. E2E tests (Playwright)  
  6\. Secret scan (no API keys)  
  7\. Build Docker image  
  8\. Deploy preview environment

All must pass before merge.

On Merge to Main:  
  1\. All PR checks must pass  
  2\. Build production images  
  3\. Deploy to staging  
  4\. Full E2E test suite vs staging  
  5\. Manual approval gate required

Production Deployment (Wednesday 06:00–08:00 UTC):  
  1\. Deploy to Vercel Production (frontend)  
  2\. Deploy to Railway Production (API \+ AI)  
  3\. Run smoke test suite (10 critical flows)  
  4\. Monitor Sentry error rate (30 min)  
  5\. Auto-rollback if error rate \> 0.5% above baseline  
  6\. Slack notification (\#deployments)

11.2 Environment Variables

.env.production:

NEXT\_PUBLIC\_API\_URL=[https://api.scopeiq.com](https://api.scopeiq.com) NEXT\_PUBLIC\_SUPABASE\_URL=https://\[project\].supabase.co NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=\[key\]

SUPABASE\_SERVICE\_ROLE\_KEY=\[key\] DATABASE\_URL=postgresql://...

ANTHROPIC\_API\_KEY=\[key\]

R2\_ACCOUNT\_ID=\[id\] R2\_ACCESS\_KEY\_ID=\[key\] R2\_SECRET\_ACCESS\_KEY=\[secret\] R2\_BUCKET\_NAME=scopeiq-files NEXT\_PUBLIC\_R2\_PUBLIC\_URL=[https://files.scopeiq.com](https://files.scopeiq.com)

UPSTASH\_REDIS\_REST\_URL=\[url\] UPSTASH\_REDIS\_REST\_TOKEN=\[token\]

STRIPE\_SECRET\_KEY=\[key\] STRIPE\_WEBHOOK\_SECRET=\[key\] NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY=\[key\]

RESEND\_API\_KEY=\[key\]

SENTRY\_DSN=\[dsn\] AXIOM\_TOKEN=\[token\] AXIOM\_DATASET=scopeiq-logs

11.3 Deployment Checklist (Pre-Launch)

Before going live:  
  ├─ \[ \] All P0 features implemented \+ tested  
  ├─ \[ \] E2E test coverage 100% (P0 features)  
  ├─ \[ \] Security audit completed  
  ├─ \[ \] Performance SLAs validated (load test)  
  ├─ \[ \] Monitoring alerts configured (Sentry, Axiom, Uptime)  
  ├─ \[ \] Runbooks written (incident response)  
  ├─ \[ \] Support team trained  
  ├─ \[ \] Documentation complete  
  ├─ \[ \] Privacy Policy \+ ToS finalized  
  ├─ \[ \] Stripe production account configured  
  ├─ \[ \] DNS \+ HTTPS properly configured  
  ├─ \[ \] Database backups tested (restore from backup)  
  ├─ \[ \] Disaster recovery plan documented  
  └─ \[ \] Post-launch runbook prepared (first week ops)

═══════════════════════════════════════════════════════════════════════════════  
              SECTION 12: PERFORMANCE & MONITORING SLAs  
═══════════════════════════════════════════════════════════════════════════════

12.1 Performance SLAs (Product Commitments)

These are not aspirational. They are product guarantees.

Operation                           Target      Measurement    Alert Threshold  
────────────────────────────────────────────────────────────────────────────  
Scope meter load                    \<2s p95     Vercel RUM     \>3s  
SOW parsing                         \<30s p95    BullMQ metric  \>45s  
Scope flag detection                \<5s p95     Job duration   \>7s  
Bilateral notification push         \<500ms p95  DB → UI        \>1s  
Option generation                   \<5s p95     Job duration   \>8s  
Change order generation             \<5s p95     Job duration   \>8s  
Client behavior prediction          \<200ms      Lookup \+ ML    \>300ms  
Portal page load                    \<2s (4G)    Vercel RUM     \>3s  
API endpoint response time          \<300ms p95  Sentry APM     \>500ms  
File upload 500MB                   Async       No page block  N/A  
System uptime (paid plans)          99.5% mo    Vercel/Railway   
Change order acceptance rate        75%+ first  Flag → Accept  \<80% \= review  
────────────────────────────────────────────────────────────────────────────

12.2 Monitoring Setup

Frontend:  
  └─ Vercel Analytics (LCP, FCP, CLS)  
     Vercel Web Analytics dashboard  
     Alerts if LCP \> 2500ms for \>5% of users

Backend:  
  └─ Sentry APM (response time p95, error rate)  
     Alert if p95 \> 500ms  
     Alert if error rate \> 0.5%

AI Service:  
  └─ Axiom structured logging  
     Every job logged: operation, duration\_ms, model, tokens, status  
     Alert if scope\_check duration \> 7s  
     Alert if token usage abnormal (cost overrun detection)

Infrastructure:  
  └─ Healthchecks.io (external uptime monitoring)  
     Ping every 5 minutes  
     Alert if miss \>3 consecutive pings

Database:  
  └─ Subabase metrics dashboard  
     Monitor connection pool utilization  
     Alert if connections \> 40/50 max

12.3 Error Tracking

All errors captured in Sentry:  
  ├─ Error message \+ stack trace  
  ├─ User context (workspace\_id, user\_id if auth)  
  ├─ Request context (method, path, status code)  
  ├─ Environment (prod, staging, dev)  
  ├─ Sourcemaps enabled (stack traces in dev code)  
  └─ Release tracking (Git commit SHA)

Sentry alerts:  
  ├─ Error rate \> 1% overall  
  ├─ New error type (first occurrence)  
  ├─ Critical errors (5xx responses)  
  └─ Threshold exceeded (e.g., 429 rate limits)

12.4 Logging Strategy

Structured logging to Axiom:  
  └─ JSON format  
     timestamp, operation, workspace\_id, user\_id, status, duration\_ms,  
     error\_code (if failure), metadata

Examples:  
\`\`\`json  
  {  
    "timestamp": "2026-03-15T10:30:45.123Z",  
    "operation": "scope\_check",  
    "workspace\_id": "ws\_123",  
    "message\_id": "msg\_456",  
    "status": "success",  
    "confidence": 0.82,  
    "duration\_ms": 2345,  
    "model": "claude-sonnet-4-6",  
    "tokens\_used": 450  
  }  
\`\`\`

Query examples:  
  └─ "duration\_ms \> 7000" (slow scope checks)  
     "status \== 'error' AND operation \== 'generate\_options'" (failures)  
     "tokens\_used \> 5000 AND operation \== 'parse\_sow'" (cost overrun)

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 13: LAUNCH SEQUENCE & GATES  
═══════════════════════════════════════════════════════════════════════════════

Gate 0: Pre-Build Behavioral Assumption Test (Week 1–2)

Hypothesis: "When scope is crystal clear \+ scope additions presented as   
collaborative options, do freelancers accept COs at higher rates?"

Execution:  
  ├─ Recruit 20 freelancers ($7K+ scope creep loss in last 90 days)  
  ├─ Provide: Scope interview form \+ multi-option CO template  
  ├─ Duration: 30 days (let them run \~4-5 projects with new workflow)  
  ├─ Measure: CO acceptance rate (first offer, no negotiation)  
  ├─ Baseline: Industry standard \~50% acceptance after negotiation  
  ├─ Target: \>75% acceptance (first offer)  
    
  If \>75%: Core insight validated → proceed to full build  
  If 50-75%: Insight partially valid → iterate on framing before build  
  If \<50%: Problem isn't friction → pivot (not a ScopeIQ problem)

Cost: $2K (honorarium for 20 participants)  
Decision Point: No Sprint 1 starts without positive Gate 0 result

Gate 1: Scope Clarity MVP (Q3 2026\)

Features:  
  ├─ SOW generation (AI interview \+ detailed clauses)  
  ├─ Scope meter (visual tracking)  
  ├─ Client inbox (primary communication)  
  ├─ Scope flag detection (real-time analysis)  
  ├─ Change order automation  
  └─ White-label portal

Success Metrics:  
  ├─ 500+ active users (sign up and create project)  
  ├─ 100+ active projects (SOW created)  
  ├─ \>80% SOW clarity score (client satisfaction survey)  
  ├─ \<20% scope dispute rate (vs. 60% industry baseline)  
  ├─ NPS \>50  
  ├─ \<90% monthly churn (i.e., \>10% retention)  
  ├─ \>40% of COs accepted first offer (vs. 50% after negotiation industry baseline)  
    
  If ALL metrics met: Proceed to Gate 2 (Approval Portal)  
  If SOME metrics missed: Iterate on failing metrics (extend Gate 1\)  
  If MOST metrics missed: Product-market fit uncertain → pivot

Duration: 12 weeks  
Launch Target: September 2026  
Success Data: Community Slack, Reddit, Twitter (testimonials)

Gate 2: Approval Portal (Q4 2026\)

Features (in addition to Gate 1):  
  ├─ Deliverable tracking \+ approval workflow  
  ├─ Revision round counter  
  ├─ Automated reminder sequence  
  ├─ Team governance basics  
  └─ Scope meter (visual)

Success Metrics:  
  ├─ CO acceptance rate: 75%+ (maintained or improved)  
  ├─ Average negotiation cycles: \<1.5 (down from 2–3)  
  ├─ Scope flags/user/month: 3+ (usage indicates engagement)  
  ├─ Studio tier adoption: \>15% of users upgrade  
  ├─ NPS: \>55  
  ├─ Churn: \<5% monthly  
    
  Data required: Organic demand from Gate 1 users requesting these features  
                (support tickets, feature requests, qualitative feedback)  
    
  If demand \+ metrics strong: Proceed to Gate 3 (Brief Builder)  
  If demand weak: Skip to Phase 2 (skip Brief Builder, focus on intelligence)

Duration: 12 weeks  
Launch Target: December 2026

Gate 3: Brief Builder (Q1 2027\)

Features:  
  ├─ AI-guided intake interviews  
  ├─ Automated detailed SOW generation  
  └─ Client preview \+ approval

Success Metrics:  
  ├─ Brief clarity score: \>85% (pre-project ambiguity eliminated)  
  ├─ Scope dispute reduction: \>70% (vs. baseline)  
  ├─ Client satisfaction: NPS \>60  
    
  Data required: Organic demand from Approval Portal users for intake forms  
    
  Launch only if demand proven. If demand absent, skip to Intelligence Layer.

═══════════════════════════════════════════════════════════════════════════════  
              SECTION 14: TEAM COORDINATION & HANDOFF  
═══════════════════════════════════════════════════════════════════════════════

14.1 Team Structure (MVP)

Frontend Lead (1–2 engineers)  
  ├─ Next.js 14 implementation  
  ├─ Component library (Radix UI)  
  ├─ Real-time subscriptions (Subabase)  
  ├─ E2E tests (Playwright)  
  └─ Performance optimization (Vercel)

Backend Lead (1–2 engineers)  
  ├─ Hono API (routes \+ middleware)  
  ├─ Drizzle ORM (schema \+ migrations)  
  ├─ Authentication (Subabase Auth)  
  ├─ BullMQ job dispatch  
  └─ Integration tests (Supertest)

AI Lead (1 engineer)  
  ├─ FastAPI service  
  ├─ Claude integration  
  ├─ BullMQ workers  
  ├─ Prompt engineering  
  └─ Pydantic validation

Infrastructure Lead (0.5 FTE, shared)  
  ├─ Vercel deployment (frontend)  
  ├─ Railway deployment (API \+ AI)  
  ├─ GitHub Actions CI/CD  
  ├─ Monitoring setup (Sentry, Axiom)  
  └─ Database management (Subabase)

Product/Design Lead (0.5 FTE)  
  ├─ UI/UX validation (user testing)  
  ├─ Feature prioritization  
  ├─ Design system updates  
  └─ Launch planning

Total: 4–5 FTE for MVP build

14.2 Daily Standups

15 minutes, 9:00 AM UTC:  
  ├─ Frontend: What shipped, blockers, next  
  ├─ Backend: What shipped, blockers, next  
  ├─ AI: What shipped, blockers, next (include prompt changes)  
  ├─ Infrastructure: Any deployment issues  
  └─ Decision: If blocker can't unblock in 24h → escalate

Slack channel: \#scopeiq-standup

14.3 Weekly Syncs

Monday 2:00 PM UTC (1h):  
  ├─ Review: Last week's shipped features  
  ├─ Metrics: Gate 0/1 progress (if applicable)  
  ├─ Roadmap: Next week's priorities  
  ├─ Blockers: Any across-team issues  
  └─ Decisions: Major changes or pivots

14.4 Sprint Planning

2-week sprints, starting Monday:  
  ├─ Sprint 0 (Gate 0): Behavioral test setup  
  ├─ Sprint 1: Scope Clarity (SOW \+ interview \+ parser)  
  ├─ Sprint 2: Scope Evolution (inbox \+ flags \+ options)  
  ├─ Sprint 3: Team Governance (approval routing \+ audit)  
  ├─ Sprint 4: Monitoring \+ Deploy (SLAs \+ CI/CD \+ launch)  
  ├─ Sprint 5: Polish \+ Documentation  
  └─ Sprint 6: Gate 0 validation \+ Gate 1 feedback iteration

Sprint meeting (1h):  
  ├─ Retro (15m): What worked, what didn't  
  ├─ Planning (30m): Sprint goal \+ tasks \+ estimates  
  ├─ Commitment: Team commits to sprint goal  
  └─ Acceptance: Define "done" (tests \+ docs \+ deployed)

14.5 Code Review Standards

All PRs require:  
  ├─ 2 approvals (1 from same domain, 1 from different)  
  ├─ All tests passing (CI/CD gate)  
  ├─ No secret leaks (GitHub Action scan)  
  ├─ Absolute code rules compliance (Rule \#1–8 check)  
  ├─ Audit log written (for mutations)  
  └─ Documentation updated (if needed)

Review SLA: \<4 hours (blocking issue) or \<24 hours (non-blocking)

14.6 Handoff to Operations (Post-Launch)

Pre-launch (Week \-2):  
  ├─ Deploy documentation (runbooks, playbooks)  
  ├─ Support team training (how to debug, escalate)  
  ├─ Monitoring dashboards (Sentry, Axiom, Healthchecks)  
  ├─ Incident response procedures (who pages, how to rollback)  
  └─ Launch week schedule (on-call rotation)

On-call rotation (Week 1):  
  ├─ Frontend engineer (2h/day)  
  ├─ Backend engineer (2h/day)  
  ├─ AI engineer (1h/day for Claude-related issues)  
  └─ Escalation: Any major incident → whole team

Post-launch (Week 2+):  
  └─ Normal operations (no longer under "launch" procedures)

═══════════════════════════════════════════════════════════════════════════════  
         SECTION 15: TROUBLESHOOTING & EMERGENCY PROTOCOLS  
═══════════════════════════════════════════════════════════════════════════════

15.1 Common Issues

Issue: Scope flag detection slow (\>7s)  
  Root cause → High message volume, Claude API slow, database query slow  
  Troubleshoot:  
    1\. Check Axiom logs: Is it Claude API or job processing?  
    2\. If Claude: Increase max\_retries or switch to sonnet-4-5  
    3\. If job: Check BullMQ queue depth; scale workers  
    4\. If database: Run ANALYZE on scope\_clauses; add index if needed  
  Fix: Scale BullMQ workers, or enable Claude API batch processing

Issue: Change order not appearing in client portal  
  Root cause → Subabase subscription not firing, wrong table subscribed  
  Troubleshoot:  
    1\. Check change\_orders table: CO exists, correct project\_id?  
    2\. Check Subabase logs: Subscription events firing?  
    3\. Browser console: JavaScript errors?  
    4\. Test: Manually insert CO record, see if portal updates  
  Fix: Restart Subabase connection, or clear browser cache \+ reload

Issue: Stripe webhook not charging  
  Root cause → Webhook signature validation failing, wrong endpoint  
  Troubleshoot:  
    1\. Check Sentry: Any 400/401 errors on webhook endpoint?  
    2\. Check Stripe logs: Webhook delivery attempts?  
    3\. Verify: Webhook secret matches (.env variable)  
    4\. Test: Send test webhook from Stripe dashboard  
  Fix: Regenerate webhook secret, redeploy API

Issue: Portal branding not updating  
  Root cause → CSS variables not injected, cache stale  
  Troubleshoot:  
    1\. Browser DevTools: Check computed styles for CSS vars  
    2\. Check API: GET /api/workspaces/:id returns branding\_json?  
    3\. Page source: CSS var definitions in \<head\>?  
    4\. Cache: Hard refresh (Ctrl+Shift+R)  
  Fix: Clear R2 cache, purge Vercel edge cache

15.2 Emergency Protocols

P0 Incident (Service Down):  
  1\. Page on-call engineer (PagerDuty)  
  2\. Open incident channel: \#incident-channel  
  3\. Assess: Frontend? Backend? AI? Database?  
  4\. Rollback last deploy: \`git revert \<commit\>\`  
  5\. If unsure: Roll back (restore known-good version)  
  6\. Notify customers (status page \+ email)  
  7\. Root cause analysis (post-incident)

P1 Incident (Degraded Performance):  
  1\. Monitor for 15 minutes: Does it resolve itself?  
  2\. If not: Engage on-call engineer  
  3\. Scale infrastructure (Vercel auto-scale, Railway scale container)  
  4\. Check: Claude API rate limits, database load  
  5\. Communicate ETA to users

Data Loss / Corruption:  
  1\. STOP: Do not continue operations  
  2\. Restore from most recent backup (Subabase automated daily)  
  3\. Assess: What data lost/corrupted? How far back?  
  4\. Roll forward: Apply audit\_log to bring backup current  
  5\. Verify: All data integrity checks pass  
  6\. Resume operations

Security Breach / Unauthorized Access:  
  1\. ISOLATE: Remove API key, rotate secrets  
  2\. ASSESS: What was accessed? Who accessed it?  
  3\. NOTIFY: Customers affected, regulatory (if required)  
  4\. REMEDIATE: Fix vulnerability, re-deploy  
  5\. AUDIT: Full audit log review for suspicious activity

15.3 Escalation Path

Level 1 (On-call engineer): First responder, assess issue  
Level 2 (Team lead): If on-call can't resolve in 30m, escalate  
Level 3 (CTO): If team lead can't resolve in 60m, escalate  
Level 4 (CEO): If CTO needs business decision (customer communication, downtime window)

All escalations logged in incident channel \+ post-incident meeting within 24h.

═══════════════════════════════════════════════════════════════════════════════  
                SECTION 16: POST-LAUNCH OPERATIONS  
═══════════════════════════════════════════════════════════════════════════════

16.1 Day-1 Operations Checklist

  ├─ \[ \] Monitor error rates (Sentry) \- should be \<0.1% for normal traffic  
  ├─ \[ \] Monitor performance (Axiom) \- all operations within SLA  
  ├─ \[ \] Check database connections \- no exhaustion  
  ├─ \[ \] Monitor Stripe charges \- successful, no failed payments  
  ├─ \[ \] Monitor email delivery (Resend) \- high delivery rate  
  ├─ \[ \] Check real-time subscriptions \- messages/flags pushing immediately  
  ├─ \[ \] Monitor R2 upload throughput \- no bottlenecks  
  ├─ \[ \] Check GitHub Actions \- all deployments successful  
  └─ \[ \] Slack channel \#operations-daily standup

16.2 Week-1 Operations

  Daily:  
  ├─ 9:00 AM: Review overnight error logs (Sentry)  
  ├─ 2:00 PM: Check morning metrics (Axiom, Vercel Analytics)  
  ├─ 5:00 PM: Review change\_order acceptance rate (target: \>75%)  
  └─ End of day: Slackbot summary (\#operations-daily)

  Weekly (Friday):  
  ├─ Full system health review  
  ├─ Customer feedback synthesis  
  ├─ Scaling decisions (if needed)  
  ├─ Post-launch retrospective (what went well, what didn't)  
  └─ Plan next week's improvements

═══════════════════════════════════════════════════════════════════════════════ SECTION 16: POST-LAUNCH OPERATIONS (CONTINUED) ═══════════════════════════════════════════════════════════════════════════════

16.3 Ongoing Monitoring (Continued)

Daily metrics to track: ├─ Error rate (Sentry): Target \<0.1% for P95 ├─ P95 latency per operation (Axiom): │ ├─ Scope check: \<5s │ ├─ Option generation: \<5s │ ├─ CO generation: \<5s │ └─ Portal load: \<2s ├─ Uptime percentage (Healthchecks.io): Target 99.5%+ ├─ CO acceptance rate (custom SQL): Target 75%+ ├─ New signups (analytics) ├─ Active users (weekly) ├─ Churn rate (monthly): Target \<5% ├─ NPS score (weekly survey) ├─ Support ticket volume \+ resolution time └─ Stripe revenue (daily)

Weekly review (Friday): ├─ All daily metrics aggregated ├─ Trend analysis (week-over-week) ├─ Customer feedback patterns (support tickets, NPS comments) ├─ Performance trends (degrading? improving?) ├─ Feature usage (which features most used?) └─ Roadmap impact (adjust based on data)

Monthly review: ├─ Cohort analysis (Gate 1 users: retention, LTV?) ├─ Churn analysis (why are users leaving?) ├─ NPS trends ├─ MRR (monthly recurring revenue) ├─ Infrastructure costs ├─ Database size growth └─ Plan scaling if needed

16.4 Feedback Loop Integration

Customer feedback → Product roadmap:

Every week: ├─ Review support tickets (Slack \#support) ├─ Extract feature requests \+ pain points ├─ Categorize: Bug | Enhancement | Feature Request └─ Triage: P0 (production bug) → fix ASAP P1 (feature request, \>3 votes) → sprint P2 (nice-to-have) → backlog

Monthly: ├─ NPS analysis: Detractors → call \+ listen ├─ Feature usage analysis: What's not being used? Why? ├─ Customer case studies: Early wins to document for case studies └─ Roadmap adjustment: Reflect learnings in next sprint

Quarterly: ├─ Board review: Metrics vs. Gate 1 targets ├─ Investor update: Key learnings \+ traction ├─ Strategic decision: Proceed to next gate? Iterate? Pivot?

16.5 Scaling Timeline (Predictive)

If usage grows as expected (500 users → 2,000 users):

Q4 2026 (Months 4–6): ├─ Database read replicas needed (Subabase) ├─ BullMQ worker scaling (may need 2→5 workers) ├─ CDN optimization (Cloudflare cache rules) └─ No architectural changes (current stack handles 10K users)

Q1 2027 (Months 7–9): ├─ If \>10K users: Shard workspaces (optional) ├─ ML model training (client behavior model) needs infra ├─ Consider: Dedicated Claude API account (volume discounts) └─ Database optimization: Aggressive indexing

Q2 2027 (Months 10–12): ├─ API rate limiting enforcement (required at scale) ├─ Message queue (RabbitMQ?) if BullMQ insufficient ├─ Data warehouse (ClickHouse?) for analytics └─ ML model serving infra (if Intelligence Layer live)

No changes needed in Q3/Q4 2026 (MVP phase). Revisit at Gate 2\.

16.6 Customer Success Programs

30-day onboarding (after signup): ├─ Day 1: Welcome email \+ docs link ├─ Day 3: Check-in: "Have you created your first project?" ├─ Day 7: First project review call (if \>1 project created) ├─ Day 14: "First scope flag" milestone celebration ├─ Day 21: "First change order accepted" milestone celebration ├─ Day 30: NPS survey \+ product feedback survey

Ongoing engagement: ├─ Monthly tips newsletter (best practices) ├─ Feature announcements (Slack, email) ├─ Community Slack channel (\#scopeiq-users) ├─ Office hours (bi-weekly, 30m, Q\&A) └─ User testimonials (recorded case studies)

Churn prevention: ├─ If no activity \>7 days: Automated email "We miss you\!" ├─ If NPS \<30: Outreach call within 24h (understand dissatisfaction) ├─ If account marked for deletion: Last-mile offer (discount, feature trial)

16.7 Incident Response Documentation

Every incident (even minor): ├─ Document in incident log (Google Doc) ├─ Root cause analysis (what failed?) ├─ Timeline (when detected? when resolved?) ├─ Impact (users affected? data loss?) ├─ Resolution (what did we do?) ├─ Prevention (how do we prevent recurrence?) └─ Owner (who owns follow-up fix?)

Post-incident meeting (within 24h): ├─ Blameless retrospective (not "who failed" but "what failed?") ├─ Team learns (root cause identified) ├─ Action items (fixes \+ preventions assigned) └─ Ticket created (in GitHub/ClickUp for follow-up)

Patterns tracked: ├─ If same issue \>2x: Escalate to P0 fix ├─ If pattern detected: System-wide review needed └─ If external service fails: Mitigation strategy needed (e.g., Anthropic API down)

═══════════════════════════════════════════════════════════════════════════════ SECTION 17: FINAL LAUNCH CHECKLIST ═══════════════════════════════════════════════════════════════════════════════

Before Q3 2026 public launch, verify:

PRODUCT COMPLETENESS: ├─ \[ \] All P0 features implemented (SOW, flags, options, COs, portal) ├─ \[ \] All P1 features implemented (team governance, audit log) ├─ \[ \] No known critical bugs (Sentry clean) ├─ \[ \] E2E test coverage 100% (P0 \+ P1) ├─ \[ \] Performance SLAs validated (load test at 10x expected traffic) └─ \[ \] Usability tested with 10+ real users (not internal)

SECURITY & COMPLIANCE: ├─ \[ \] Penetration test completed (external firm) ├─ \[ \] All secrets rotated (API keys, DB passwords, etc.) ├─ \[ \] RLS policies enabled on all tables ├─ \[ \] Audit logging comprehensive (tested restore from audit log) ├─ \[ \] HTTPS \+ TLS 1.3 everywhere ├─ \[ \] Privacy Policy \+ ToS finalized \+ legal review ├─ \[ \] Data Processing Agreement (DPA) template prepared ├─ \[ \] GDPR Data Deletion API tested └─ \[ \] No secrets in error logs or client code

INFRASTRUCTURE & MONITORING: ├─ \[ \] Vercel production env configured ├─ \[ \] Railway production env configured ├─ \[ \] Database backups tested (restore process verified) ├─ \[ \] Disaster recovery runbook written ├─ \[ \] Monitoring alerts configured (Sentry, Axiom, Healthchecks) ├─ \[ \] On-call rotation schedule published ├─ \[ \] Incident response runbook written ├─ \[ \] Slack integrations working (notifications, alerts) └─ \[ \] CI/CD pipeline tested (deploy from main → prod)

PAYMENTS & BILLING: ├─ \[ \] Stripe production account configured ├─ \[ \] All subscription plans live (Solo, Studio, Agency) ├─ \[ \] Optional 1.5% CO fee configured ├─ \[ \] Invoice generation tested ├─ \[ \] Tax calculation configured (if applicable) ├─ \[ \] Webhook signature validation working ├─ \[ \] Refund process documented └─ \[ \] Payment failure email templates tested

COMMUNICATIONS: ├─ \[ \] Welcome email template finalized ├─ \[ \] Onboarding email sequence ready (5 emails) ├─ \[ \] Documentation published (help docs, FAQ) ├─ \[ \] Video tutorials recorded (3–5 core features) ├─ \[ \] Blog post announcing launch written ├─ \[ \] Community Slack channel created ├─ \[ \] Status page configured (uptime.com or Vercel) ├─ \[ \] Support email configured (support@scopeiq.com) └─ \[ \] Support ticket system ready (Slack integration)

MARKETING & LAUNCH: ├─ \[ \] Landing page finalized (if not MVP feature) ├─ \[ \] Waitlist emails sent (if waitlist used) ├─ \[ \] Early access cohort identified (20–50 beta users) ├─ \[ \] Case study interviews scheduled (post-launch) ├─ \[ \] Twitter/LinkedIn launch posts scheduled ├─ \[ \] ProductHunt launch coordinated (if targeting) ├─ \[ \] Customer testimonials collected (3–5 ready) └─ \[ \] Press release written (if targeting media)

TEAM READINESS: ├─ \[ \] Support team trained (troubleshooting guide) ├─ \[ \] Runbooks distributed to all team members ├─ \[ \] On-call schedule confirmed (first week) ├─ \[ \] Launch day procedures documented (what happens hour-by-hour) ├─ \[ \] Communication channels active (\#scopeiq-internal, \#operations-daily) └─ \[ \] Post-launch retro scheduled (day after launch)

FINAL SIGN-OFF: ├─ \[ \] CTO approval: System production-ready ├─ \[ \] CEO approval: Business ready ├─ \[ \] Legal approval: Compliant \+ safe └─ \[ \] GO / NO-GO decision: Proceed to launch?

═══════════════════════════════════════════════════════════════════════════════ SECTION 18: SUCCESS METRICS & TRACKING ═══════════════════════════════════════════════════════════════════════════════

18.1 Gate 1 Success Definition (Q3 2026\)

MUST-HAVE METRICS (all required to proceed): ├─ 500+ monthly active users (sign up \+ create project) ├─ 100+ concurrent active projects (SOW generation) ├─ \<20% scope dispute rate (vs. 60% industry baseline) ├─ \>80% client SOW clarity satisfaction (survey, 1–10 scale) ├─ NPS \>50 (target promoters) ├─ \<90% monthly churn (i.e., retention \>10%) └─ \>40% CO acceptance on first offer (no negotiation)

VALIDATION DATA SOURCES: ├─ Authentication logs (MAU count) ├─ Projects table (active project count) ├─ Scope flags table (disputes flagged vs. total project months) ├─ In-app survey (SOW clarity, 1–10 rating scale) ├─ NPS survey (monthly email to all users) ├─ Change orders table (accepted vs. total, first-offer acceptance) └─ Subscription table (churn \= cancelation / total active accounts)

TRACKING DASHBOARD: └─ Google Sheets or Metabase ├─ Row: Weekly data point ├─ Columns: MAU | Active Projects | Dispute % | Clarity Score | NPS | │ Churn % | CO Accept % ├─ Updated: Every Friday └─ Target: All metrics green (pass threshold) by Week 12

IF GATE 1 SUCCEEDS: ├─ Announcement to team \+ investors ├─ Case study interviews begin ├─ Roadmap moves to Gate 2 (Approval Portal)

IF GATE 1 FAILS (any metric): ├─ Diagnosis: Which metric failed? Why? ├─ Iteration: What change would fix it? ├─ Timeline: 2–4 week iteration before re-evaluation └─ Decision: Proceed to Gate 2 partial? Full reset? Pivot?

18.2 Monitoring Dashboards (Real-Time)

OPERATIONAL DASHBOARD (daily): ├─ System uptime (% last 24h) ├─ Error rate (% of requests with error) ├─ P95 latency (all operations) ├─ New signups (last 24h) ├─ Active users (last 7 days) ├─ Revenue (MRR current month) └─ Support tickets (backlog count)

PRODUCT DASHBOARD (weekly): ├─ MAU trend (7-day rolling avg) ├─ Projects created (last 7 days) ├─ Scope flags generated (last 7 days) ├─ Change orders generated (last 7 days) ├─ CO acceptance rate (last 7 days) ├─ Average scope clarity score ├─ NPS score └─ Customer feedback theme (bugs, features, praise)

FINANCIAL DASHBOARD (weekly): ├─ MRR (current month, trending) ├─ Churn rate (% month-over-month) ├─ LTV estimate (CAC payback period) ├─ Plan distribution (% Solo vs. Studio vs. Agency) ├─ Optional revenue (1.5% CO fees) └─ COGS (Anthropic API \+ Infrastructure)

18.3 Quarterly Business Review (QBR) Template

Every quarter (after each gate):

METRICS REVIEW: ├─ Revenue: MRR, ARR, churn, LTV, CAC ├─ Customers: New signups, active, NPS, support volume ├─ Product: Feature usage, bugs, deprecations ├─ Operations: Uptime, incidents, performance └─ Team: Velocity, quality, morale

LEARNINGS: ├─ What worked (double down) ├─ What didn't (fix or abandon) ├─ Surprises (positive or negative) └─ Customer feedback patterns (common requests, pain points)

ROADMAP ADJUSTMENT: ├─ Next quarter priorities (based on learnings) ├─ Gate evaluation (ready for next gate or iterate?) ├─ Headcount planning (hiring for scale?) ├─ Budget forecast (CAC, COGS, runway) └─ Key bets (high-risk, high-reward initiatives?)

═══════════════════════════════════════════════════════════════════════════════ SECTION 19: KNOWLEDGE TRANSFER & RUNBOOKS ═══════════════════════════════════════════════════════════════════════════════

19.1 Critical Runbooks (Must Exist Pre-Launch)

RUNBOOK 1: Deployment Process ├─ Prerequisites (all tests passing, PR approved) ├─ Step 1: Merge to main ├─ Step 2: GitHub Actions triggers ├─ Step 3: Vercel deploys frontend (verify no errors) ├─ Step 4: Railway deploys API (verify no errors) ├─ Step 5: Railway deploys AI service (verify no errors) ├─ Step 6: Smoke tests run (10 critical flows) ├─ Step 7: Verify uptime monitoring (all green) ├─ Step 8: Slack notification sent (\#deployments) └─ Rollback: If error within 30m, run rollback script

RUNBOOK 2: Scope Flag Detection Slow (\>7s) ├─ Diagnosis: Check Axiom logs for duration breakdown ├─ If Claude API slow: │ └─ Check Anthropic status page │ If degraded: Notify team, monitor │ If normal: Retry job (exponential backoff) ├─ If BullMQ worker slow: │ └─ Check Rails status (queue depth) │ If \>100 jobs: Scale workers (Railway UI → scale container) │ If \<100: Check worker logs for errors ├─ If database slow: │ └─ Run ANALYZE on scope\_clauses table │ Check query plan (explain analyze) │ If index missing: Add index \+ reanalyze └─ Prevention: Set alert if p95 \> 7s (Axiom)

RUNBOOK 3: Client Portal Not Loading ├─ Diagnosis: Portal URL returns 404 or blank? ├─ If 404: │ └─ Check portal\_token in URL (valid UUID?) │ Check database: SELECT \* FROM clients WHERE portal\_token \= ? │ If token not found: Token may be expired (90 days) │ If token found: Check project (still exists?) ├─ If blank: │ └─ Check browser console (JavaScript errors?) │ Check network tab (API calls failing?) │ Check API logs (403 Unauthorized? 500 error?) │ If 403: Token auth middleware issue → check middleware │ If 500: API error → check Sentry └─ Prevention: Test portal with expired token weekly

RUNBOOK 4: Stripe Payment Failed ├─ Diagnosis: Check Sentry (payment error logs)? ├─ Customer reports CO accepted but not charged: │ ├─ Check change\_orders table (stripe\_payment\_intent\_id set?) │ ├─ Check Stripe dashboard (intent exists, status?) │ ├─ If status \= 'succeeded' but CO shows unpaid: │ │ └─ Database write failed after Stripe succeeded (race condition) │ │ Manually mark CO.status \= 'accepted' in DB │ │ Verify audit log written │ │ Customer gets CO PDF (regenerate if needed) │ └─ If status \= 'failed': │ └─ Check failure reason (insufficient funds, card declined, etc.) │ Send customer email: "Payment failed, please retry" │ Offer alternative: Bank transfer, invoice (for agencies) └─ Prevention: Test Stripe webhook signature validation in CI

RUNBOOK 5: Database Connection Pool Exhausted ├─ Diagnosis: API requests return 503 (Service Unavailable) ├─ Check Supabase metrics (connection count near limit?) ├─ If yes: │ ├─ Kill idle connections (psql command) │ ├─ Scale API container (Railway: increase replicas) │ ├─ Reduce connection pool size (temporary config change) │ └─ Alert: Check API logs for query leaks │ Are connections not being released after queries? └─ Root cause: Likely slow query hanging connections Investigate with EXPLAIN ANALYZE (slow query log)

RUNBOOK 6: Data Loss / Backup Restore ├─ CRITICAL: Do NOT attempt to continue normal operations ├─ Step 1: Announce outage (status page \+ email all users) ├─ Step 2: Determine what was lost (accidental deletion? corruption?) ├─ Step 3: Identify restore point (most recent backup before incident) ├─ Step 4: Supabase: Restore from backup │ └─ Subabase Dashboard → Backups → Select restore point → Restore │ (this may take 5–30 minutes) ├─ Step 5: Verify data integrity │ └─ Spot-check: Query a few projects, scope flags, change orders ├─ Step 6: Apply audit log (bring backup current) │ └─ Any changes after restore point: Manually re-apply if needed ├─ Step 7: Resume operations │ └─ Monitor Sentry \+ Axiom for 1 hour (verify all systems working) └─ Step 8: Post-incident review (why did loss happen?)

19.2 Developer Guides

GUIDE 1: Adding a New AI Operation ├─ Step 1: Write Pydantic schema for input \+ output ├─ Step 2: Write Claude prompt (system \+ user message template) ├─ Step 3: Implement BullMQ worker in apps/ai/workers/{operation}.worker.ts ├─ Step 4: Add job dispatch in apps/api/services/{domain}.service.ts ├─ Step 5: Write tests (unit test for prompt, integration test for flow) ├─ Step 6: Log operation to Axiom (duration, tokens, status) ├─ Step 7: Document: What is this operation for? Expected latency? └─ Step 8: Code review \+ merge

GUIDE 2: Adding a New API Endpoint ├─ Step 1: Define route in apps/api/routes/{domain}.route.ts ├─ Step 2: Add request/response type to packages/types/api.ts ├─ Step 3: Implement route handler (auth → validation → service call → response) ├─ Step 4: Add error handling (catch \+ Sentry) ├─ Step 5: Write integration test (happy path \+ error path) ├─ Step 6: Write frontend hook (apps/web/hooks/use{DomainName}.ts) ├─ Step 7: Add workspace\_id filter (defense-in-depth) ├─ Step 8: Write audit log (if mutation) └─ Step 9: Code review \+ merge

GUIDE 3: Database Schema Change ├─ Step 1: Modify Drizzle schema (apps/db/schema.ts) ├─ Step 2: Run: `pnpm db:generate` (generates migration) ├─ Step 3: Review migration (apps/db/migrations/xxxx.sql) ├─ Step 4: Test migration locally: `pnpm db:migrate` ├─ Step 5: If existing data: Write data migration script ├─ Step 6: Test data migration (local \+ staging) ├─ Step 7: Staging deployment: Run migration ├─ Step 8: Production deployment: Schedule migration (maintenance window) └─ Step 9: Monitor: Check query performance (new indexes needed?)

═══════════════════════════════════════════════════════════════════════════════ SECTION 20: FINAL WORD ═══════════════════════════════════════════════════════════════════════════════

20.1 Core Principles (Read Every Day)

1. SCOPE IS NOT A TECHNOLOGY PROBLEM It's a HUMAN problem (confrontation friction). Our job is to remove confrontation via collaboration. Everything we build should be measured against: "Does this reduce friction?"

2. BILLING WHAT YOU BUILT REQUIRES TRUST Trust is earned by: Clear scope \+ no surprises \+ fast resolution Every feature should strengthen trust between agency \+ client. If a feature creates doubt or friction, cut it.

3. SIMPLICITY \> PERFECTION Ship MVP with 80% features, not 100% features with 0 users. Real users teach us what matters. Perfection on wrong features \= waste. Iterate based on data, not assumptions.

4. OPERATIONS MATTER MORE THAN FEATURES Reliable system \> fancy features. Uptime \> new AI prompt. Happy customers \> shipped feature. If choosing between new feature and operational excellence, pick operations.

5. DEFEND MULTI-TENANT ISOLATION RELIGIOUSLY One workspace accessing another \= business-ending bug. Every query must have workspace\_id filter. Every code review checks for this. Every merge passes automated security scan. No exceptions.

20.2 If You Get Stuck

Issue: "I don't know how to implement X" Solution: Read Section 3 (Patterns), then Section 6 (API Spec), then Section 7 (Pipelines). Pattern already exists. Follow it.

Issue: "This should be faster" Solution: Check Section 12 (SLAs). If exceeding SLA, create performance ticket. If meeting SLA, ship it.

Issue: "I think we should add feature Y" Solution: Does it increase CO acceptance rate? Does it reduce churn? If no: Add to backlog, don't build now. If yes: Create feature ticket with data justification.

Issue: "Production is down" Solution: Read Section 15 (Emergency Protocols). Execute incident protocol. Don't think. Just execute.

Issue: "A customer is angry" Solution: Listen. Don't defend. Understand root cause. Then read Section 16 (Post-Launch) for resolution paths.

20.3 Deployment Day (Q3 2026\)

7:00 AM UTC: Full team online. Coffee in hand. Calm. 7:15 AM UTC: Final checklist review (Section 17). Green light? 7:30 AM UTC: Deploy to production. Monitor Sentry \+ Axiom. 8:00 AM UTC: If all green: Announce to community (\#scopeiq-users Slack) 8:30 AM UTC: Monitor support channel. Any early issues? 5:00 PM UTC: Day 1 retro. What surprised us? What went well?

First week: ├─ Monitor every metric obsessively ├─ Respond to every support question in \<2h ├─ Fix any P0 bugs within 2h ├─ Celebrate early wins with team └─ Take notes for post-launch retro

20.4 Long-Term Vision (12+ Months)

Phase 1 (Q3 2026): Scope Clarity MVP └─ "I'll never lose money to scope creep again"

Phase 2 (Q4 2026): Approval Portal └─ "My team can review and approve without me"

Phase 3 (Q1 2027): Brief Builder \+ Intelligence └─ "My system knows which clients will negotiate \+ how to win them over"

Phase 4 (Q2 2027): Integrations \+ API └─ "ScopeIQ is the backbone of my entire business operations"

Phase 5 (Q3 2027+): Adjacent Markets └─ "Consultants, agencies, enterprises all use ScopeIQ"

Each phase moves us closer to the vision: "ScopeIQ is the operating system for collaborative scope economics. Agencies stop losing revenue to scope creep. Clients stop feeling tricked. Both parties build trust."

20.5 You've Got This

Building ScopeIQ is hard. You will face: ├─ Days when features seem impossible ├─ Users who discover edge cases ├─ Metrics that don't match expectations ├─ Days when you question if this will work └─ Moments of doubt

But remember:

The core insight is REAL. Freelancers DO lose 15–25% of revenue to scope creep. This problem is NOT solved by any existing tool. When scope is clear \+ scope additions are collaborative, people accept COs.

You are building something that matters.

Every line of code moves us closer to a world where creative professionals stop sacrificing their mental health and revenue to avoid confrontation.

That's worth fighting for.

Ship it. Monitor it. Learn from it. Iterate.

Welcome to ScopeIQ.

═══════════════════════════════════════════════════════════════════════════════ END OF MASTER SYSTEM PROMPT v2.0 PRODUCTION READY Q3 2026 LAUNCH ═══════════════════════════════════════════════════════════════════════════════

NEXT STEPS:

1. Print this document (Section 1–20)  
2. Every engineer reads in full BEFORE starting work  
3. Questions → Slack \#scopeiq-engineering  
4. Deviations → Escalate to Lead Architect (do NOT merge)  
5. Update document when decisions change (timestamp \+ author)  
6. Reference this document in every PR / code review

This is the source of truth. This is non-negotiable. This is how ScopeIQ ships production-ready in Q3 2026\.

Questions? Read again. The answer is here.

Good luck. Ship fast. Build trust.

—Novabots Engineering

