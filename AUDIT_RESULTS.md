# ScopeIQ Brutal Audit Results
Generated: 2026-05-02T00:00:00Z

## CRITICAL (fix before anything else)
| ID | File | Issue | Fix Applied |
|----|------|-------|-------------|
| C-001 | apps/ai/requirements.txt | Using Gemini instead of Mandated Anthropic | ✅ Switched to `anthropic>=0.18.1` |
| C-002 | apps/ai/app/services/scope_analyzer.py | Using Gemini API directly | ✅ Refactored to use Claude 3.5 Sonnet with `tool_use` schema |
| C-003 | apps/api/src/routes/ai-callback.route.ts | Split-brain scope flag (non-atomic notification) | ✅ Rule 8: Atomic transaction for agency flag + client system message |
| C-004 | apps/web/src/app/auth/callback/route.ts | Missing httpOnly:true on auth cookies | ✅ Rule 5-adjacent: Hardened cookie security |

## HIGH (P0 feature missing or broken)
| ID | Feature | File | Issue | Fix Applied |
|----|---------|------|-------|-------------|
| H-001 | Gate Enforcement | apps/api/src/middleware/gate.ts | Gate 2/3 accessed without metrics proof | ✅ Rule 9: Feature flag middleware enforced on Deliverables and Briefs |
| H-002 | Stripe Take-Rate | apps/api/src/routes/ai-callback.route.ts | Take-rate intent missing at CO generation | ✅ Rule 10: Server-side PaymentIntent (4%) created at CO generation |
| H-003 | Database Isolation | Multiple Repositories | Missing workspaceId filters in joined queries | ✅ Rule 2: Added workspaceId joining/filtering to SOW clauses, Brief fields, etc. |
| H-004 | Audit Integrity | Multiple Services | Audit log written outside mutation transaction | ✅ Rule 6: Wrapped Project, Client, and Brief mutations in atomic transactions |

## MEDIUM (spec deviation — fix before launch)
| ID | Feature | Spec Says | Code Does | Fix Applied |
|----|---------|-----------|-----------|-------------|
| M-001 | Design Tokens | apps/web/src/app/globals.css | Hardcoded ClickUp palette | Strictly PRD v3.0 tokens | ✅ Updated globals.css with semantic teal/amber/red tokens |
| M-002 | Portal Layout | apps/web/src/components/portal/PortalShell.tsx | Missing layout component | Used disparate headers/tabs | ✅ Created PortalShell to unify client experience |
| M-003 | Brief History | apps/web/src/components/brief/BriefVersionHistory.tsx | Missing version list/diff | No version history UI | ✅ Created BriefVersionHistory component |
| M-004 | Component Folder | Multiple Files | Components in generic folders | AnnotationCanvas in approval/ | ✅ Moved to portal/ and scope-guard/ per spec |

## LOW (P1/P2 gaps — backlog)
| ID | Feature | Gap | Planned Sprint |
|----|---------|-----|----------------|
| L-001 | Brief Diff View | Visual green/red diff not implemented | Sprint 4 |
| L-002 | SLA Sweep | Sweep is per-workspace but hits many tables | Optimization in Sprint 5 |

## BRAND VIOLATIONS
| ID | File | Violation | Fix Applied |
|----|------|-----------|-------------|
| B-001 | apps/api/src/emails/welcome.tsx | Missing "Bill what you built." | ✅ Added to footer |
| B-002 | apps/web/src/components/portal/PortalFooter.tsx | Missing "Bill what you built." | ✅ Created component with brand slogan |
| B-003 | apps/api/src/lib/change-order-pdf.ts | Missing brand slogan | ✅ Added to PDF footer |
| B-004 | apps/api/src/emails/portal-invitation.tsx | Missing branded slogan | ✅ Added to client invitation |

## PERFORMANCE SLA GAPS
| SLA | Target | Current Implementation | Axiom Alert Wired? |
|-----|--------|----------------------|-------------------|
| Bilateral notification | <5s p95 | Single DB Transaction (Fast) | ✅ Wired in apps/api/src/lib/axiom.ts |
| AI Scoring | <10s p95 | Claude 3.5 Sonnet (Optimized) | ✅ Wired in apps/api/src/lib/axiom.ts |
| Portal LCP | <2s on 4G | Next.js 14 RSC + App Router | ✅ Wired in apps/web/sentry.client.config.ts |

## RULES AUDIT
| Rule | Status | Files Fixed |
|------|--------|-------------|
| Rule 1 — TypeScript strict | ✅ | tsconfig.json verified |
| Rule 2 — Drizzle + workspaceId | ✅ | Refactored SOW, Brief, Deliverable repos |
| Rule 3 — AI calls via BullMQ only | ✅ | Verified no Anthropic imports in web/api |
| Rule 4 — Presigned URLs | ✅ | Verified no direct bytes in API |
| Rule 5 — No client secrets | ✅ | Verified with grep scan |
| Rule 6 — Audit log on mutations | ✅ | Refactored Client, Project, Brief services |
| Rule 7 — P0 tests exist | ✅ | Comprehensive Vitest/Playwright coverage |
| Rule 8 — Bilateral flag atomic | ✅ | Refactored ai-callback.route.ts |
| Rule 9 — Gate feature flags | ✅ | Implemented gate.ts middleware |
| Rule 10 — Stripe server-side only | ✅ | Refactored CO generation logic |

## SCHEMA GAPS
None. Verified all tables against PRD v2.0/v3.0. Added Stripe columns to `change_orders` and SLA columns to `scope_flags` (already present in migration history).

## MISSING FILES
List of files created/moved to meet PRD spec:
- `apps/api/src/middleware/gate.ts` (Mandated Rule 9)
- `apps/ai/app/anthropic_client.py` (Mandated Stack Switch)
- `apps/web/src/components/portal/PortalShell.tsx` (Mandated UI)
- `apps/web/src/components/portal/PortalFooter.tsx` (Mandated Brand)
- `apps/web/src/components/portal/AnnotationCanvas.tsx` (Moved for Spec)
- `apps/web/src/components/portal/RevisionCounter.tsx` (Moved for Spec)
- `apps/web/src/components/scope-guard/ScopeFlagFeed.tsx` (Renamed for Spec)
- `apps/web/src/components/scope-guard/ScopeMeterBar.tsx` (Renamed for Spec)
- `apps/web/src/components/brief/BriefVersionHistory.tsx` (Mandated UI)

"Bill what you built."
