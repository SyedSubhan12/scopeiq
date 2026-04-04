# ScopeIQ — Master Development Plan
## Cursor AI Agent Orchestration Guide
### Novabots Engineering | v1.0 | 2026

---

## HOW TO USE THIS DOCUMENT

This is the **master orchestration guide** for building ScopeIQ. It is accompanied by **8 self-contained phase prompt files** (Phase_0 through Phase_7). Each phase prompt is designed to be loaded into Cursor as a complete session context.

### Execution Rules for the AI Agent:
1. **Execute phases in order** — each phase depends on the previous
2. **Load the Master Prompt Document (`Novabots_ScopeIQ_MasterPrompt.docx`) as project-level context** in Cursor's `.cursorrules` file at all times
3. **Load ONE phase prompt per coding session** — do not combine phases
4. **Complete ALL files listed in a phase** before moving to the next
5. **Every file must be complete and immediately runnable** — no TODOs, no placeholders
6. **Run tests after each phase** to verify before proceeding
7. **Commit after each phase** with a conventional commit message

---

## PHASE DEPENDENCY MAP

```
Phase 0: Scaffolding ──┐
                        ├── Phase 1: Database & Auth ──┐
                        │                               ├── Phase 2: API Framework ──┐
                        │                               │                            ├── Phase 3: Brief Builder
                        │                               │                            ├── Phase 4: Approval Portal
                        │                               │                            ├── Phase 5: Scope Guard
                        │                               │                            │
                        │                               │                            ├── Phase 6: Client Portal
                        │                               │                            │   (depends on 3, 4, 5)
                        │                               │                            │
                        │                               │                            └── Phase 7: Dashboard & Polish
                        │                               │                                (depends on 3, 4, 5, 6)
```

Phases 3, 4, 5 can be built in parallel after Phase 2 is complete.
Phase 6 requires all three modules (3, 4, 5) to exist.
Phase 7 ties everything together with dashboard views and onboarding.

---

## PHASE SUMMARY TABLE

| Phase | Name | Duration | Files Created | Key Deliverables |
|-------|------|----------|---------------|------------------|
| 0 | Project Scaffolding | 2-3 days | ~25 config files | Turborepo monorepo, configs, Docker, env |
| 1 | Database & Auth | 3-4 days | ~20 files | Drizzle schemas, migrations, Supabase auth, RLS |
| 2 | API Framework & Shared | 3-4 days | ~30 files | Hono setup, middleware, shared UI components, error handling |
| 3 | Brief Builder | 5-7 days | ~35 files | Form builder, AI scoring, brief submission, hold flow |
| 4 | Approval Portal | 5-7 days | ~35 files | Deliverables, feedback, annotations, reminders |
| 5 | Scope Guard | 5-7 days | ~35 files | SOW parsing, flag detection, change orders |
| 6 | Client Portal | 4-5 days | ~20 files | White-label portal, client-facing review |
| 7 | Dashboard & Polish | 4-5 days | ~25 files | Dashboard overview, onboarding, Stripe billing, settings |
| **Total** | | **31-42 days** | **~225 files** | **Complete MVP** |

---

## TECH STACK QUICK REFERENCE

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router + RSC) | 14 |
| Styling | Tailwind CSS + CSS Variables | 3.4 |
| Components | Radix UI + custom layer | latest |
| State | Zustand (UI) + React Query v5 (server) | latest |
| Forms | React Hook Form + Zod | latest |
| Backend API | Node.js + Hono | 20 LTS + v4 |
| Validation | Zod (all schemas) | latest |
| ORM | Drizzle ORM | 0.30 |
| AI Service | Python + FastAPI | 3.12 + 0.110 |
| AI Model | Anthropic Claude (claude-sonnet-4-6) | latest |
| Database | PostgreSQL (Supabase) | 15 |
| Cache/Queue | Redis (Upstash) + BullMQ | latest |
| File Storage | Cloudflare R2 | latest |
| Auth | Supabase Auth (JWT) | latest |
| Payments | Stripe Billing | latest |
| Email | Resend | latest |
| Hosting | Vercel (web) + Railway (api, ai) | latest |

---

## 7 NON-NEGOTIABLE RULES (ENFORCE IN EVERY PHASE)

1. **TypeScript strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`, never `any` or `@ts-ignore`
2. **Database via Drizzle only** — no raw SQL, always include `workspaceId` in queries
3. **AI calls via AI Gateway only** — dispatch BullMQ jobs, never import Anthropic SDK in web/api
4. **File uploads via presigned URLs** — never accept file content in API request bodies
5. **No client-side secrets** — only `NEXT_PUBLIC_` vars in `apps/web`
6. **Every mutation writes to audit_log** — same transaction, use `writeAuditLog()` helper
7. **Tests for all P0 features** — Vitest unit + Playwright E2E, 80% coverage target

---

## VERIFICATION CHECKLIST (RUN AFTER EACH PHASE)

```bash
# TypeScript compilation
pnpm typecheck

# Lint check
pnpm lint

# Unit tests
pnpm test

# E2E tests (after Phase 3+)
pnpm e2e

# Build check
pnpm build
```

All must pass before proceeding to the next phase.

---

## REFERENCE DOCUMENTS

These documents provide the complete specification. Load relevant ones as context for each phase:

| Document | Use In Phase |
|----------|-------------|
| `Novabots_ScopeIQ_MasterPrompt.docx` | ALL phases (load as .cursorrules) |
| `ScopeIQ_DatabaseSchema.docx` | Phase 1, 2 |
| `ScopeIQ_API_Specification.docx` | Phase 2, 3, 4, 5, 6 |
| `Novabots_ScopeIQ_FeatureBreakdown.docx` | Phase 3, 4, 5 |
| `Novabots_ScopeIQ_SystemDesign.docx` | Phase 0, 1, 2 |
| `Novabots_ScopeIQ_Wireframes.docx` | Phase 3, 4, 5, 6, 7 |
| `ScopeIQ_DesignUXSpec.docx` | Phase 3, 4, 5, 6, 7 |
| `ScopeIQ_DevelopmentGuide.docx` | Phase 0 |
| `ScopeIQ_PRD.docx` | Phase 3, 4, 5 (acceptance criteria) |
| `ScopeIQ_SOPs.docx` | Phase 7 (onboarding flow) |
