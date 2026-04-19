# AGENT-FE: Frontend Architecture Audit
**Date:** 2026-04-10 | **Scope:** `apps/web/src/`

## Routing Audit

| Route | Expected | Status | Severity | Notes |
|---|---|---|---|---|
| `(auth)/login` | Email + Google + magic link | ✅ EXISTS | — | |
| `(auth)/register` | Name, email, password | ✅ EXISTS | — | |
| `(auth)/forgot-password` | Password reset flow | ❌ MISSING | 🔴 CRITICAL | No self-service password recovery |
| `(auth)/invite/[token]` | Team invite acceptance | ✅ EXISTS | — | |
| `(dashboard)/` | Dashboard overview | ✅ EXISTS | — | |
| `(dashboard)/projects` | Project list + detail | ✅ EXISTS | — | |
| `(dashboard)/briefs` | Brief list + detail | ✅ EXISTS | — | |
| `(dashboard)/scope-flags` | Scope flag feed | ✅ EXISTS | — | |
| `(dashboard)/change-orders` | Change order list | ✅ EXISTS | — | |
| `(dashboard)/settings` | Workspace settings | ✅ EXISTS | — | |
| `(onboarding)/` | 5-step onboarding shell | ✅ EXISTS | — | |
| `(portal)/portal/[portalToken]` | White-label client portal | ✅ EXISTS | — | Nested one extra level vs spec |
| `(portal)/portal/[token]/review/[id]` | Deliverable review + annotation | ✅ EXISTS | — | |
| `(portal)/portal/[token]/change-order/[id]` | Change order portal | ✅ EXISTS | — | |

## Component Inventory

### Brief Builder
| Component | Status | Severity | Notes |
|---|---|---|---|
| BriefForm / IntakeForm (multi-step, RHF+Zod) | ✅ EXISTS | — | Auto-save draft every 10s |
| BriefScoreDisplay / ClarityScoreRing | ✅ EXISTS | — | rAF count-up animation |
| BriefFlagCard | ✅ EXISTS | — | Hardcoded `bg-red-100` instead of CSS var tokens |
| BriefHoldState | ✅ EXISTS | — | Framer Motion, `useReducedMotion` |
| BriefVersionHistory (submissions) | ⚠️ PARTIAL | 🟡 MEDIUM | Template diff panel exists; no per-submission version history |
| **FormBuilder (DnD Kit drag-drop)** | ⚠️ PARTIAL | 🟠 HIGH | Uses arrow-button reordering, NOT DnD Kit; `@dnd-kit` not installed |
| FormFieldEditor | ✅ EXISTS | — | |
| FormPreview | ✅ EXISTS | — | |

### Approval Portal
| Component | Status | Severity | Notes |
|---|---|---|---|
| DeliverableCard | ✅ EXISTS | — | |
| DeliverableViewer (8 formats) | ✅ EXISTS | — | image, PDF, video, Figma, Loom, YouTube, Office, link |
| AnnotationCanvas (SVG, x%/y%) | ✅ EXISTS | — | Correct `getBoundingClientRect()` % calculation |
| CommentPanel / FeedbackPanel (threaded) | ✅ EXISTS | — | Resolve + thread replies |
| RevisionCounter (color states) | ✅ EXISTS | — | Green/amber/red, at-limit modal via Zustand |
| **ApprovalReminderConfig** | ⚠️ PARTIAL | 🟠 HIGH | Settings save to `localStorage` ONLY — not API-persisted |
| PortalBrandingConfig | ⚠️ PARTIAL | 🔵 LOW | Inline in workspace settings, not a standalone component |

### Scope Guard
| Component | Status | Severity | Notes |
|---|---|---|---|
| ScopeFlagFeed / ScopeFlagList (real-time) | ✅ EXISTS | — | `useRealtimeScopeFlags` scoped to `workspace_id` |
| ScopeFlagCard (severity border, confidence, 3 actions) | ✅ EXISTS | — | Uses `flag: any` prop type |
| ScopeFlagDetail | ✅ EXISTS | — | Also uses `flag: any` |
| ChangeOrderEditor (line items, pricing, preview) | ✅ EXISTS | — | |
| **ChangeOrderPDF** | ❌ MISSING | 🟠 HIGH | No PDF library installed; preview is screen-only |
| MessageIngestInput | ✅ EXISTS | — | |
| ScopeMeterBar | ✅ EXISTS | — | Both linear and semi-circle variants |
| **SOWUploader** | ⚠️ PARTIAL | 🟡 MEDIUM | File upload mode sends placeholder string, not file bytes |

### Shared
| Component | Status | Severity | Notes |
|---|---|---|---|
| AuditLogTimeline (named) | ❌ MISSING | 🔵 LOW | `ActivityLogTab` serves purpose but reads from notifications API |
| MetricCard / MetricCardGrid | ✅ EXISTS | — | Framer Motion entrance |
| StatusBadge (shared/) | ❌ MISSING | 🔵 LOW | Brief-specific version exists; no generic shared one |
| NavigationBadge (named) | ❌ MISSING | 🔵 LOW | Sidebar badges exist but not named component |

## State Management
| Store | Status |
|---|---|
| `useWorkspaceStore` | ✅ Complete — plan, branding, onboarding |
| `useUIStore` | ✅ Complete — sidebar, modal, activeProjectId |
| `useNotificationStore` | ✅ Complete — Zustand/persist, 100-item cap |
| `useRevisionLimitModal` | ✅ Bonus store |

## React Query Hooks
All required hooks exist: `useBriefs`, `useDeliverables`, `useScopeFlags`, `useChangeOrders`, `useSOW`, `usePortalProject`, `useFeedback`, `usePortalFeedback`. ✅

## Performance Issues
| Issue | Severity |
|---|---|
| Logo upload sends base64 through API (FileReader.readAsDataURL) | 🟠 HIGH |
| SOW file never reaches server (placeholder string sent) | 🟡 MEDIUM |
| Deliverable file uploads use presigned R2 URL correctly | ✅ PASS |
| All realtime subscriptions scoped to `workspace_id` | ✅ PASS |

## Type Safety
- 23 occurrences of `flag: any` across ScopeGuard components
- `ScopeFlag` interface exists in `useScopeFlags.ts` — not being imported

## Design Token Violations
- **197 hardcoded Tailwind color classes** (`bg-red-100`, `text-emerald-600`, etc.)
- 3 hardcoded hex values in `ScopeMeter.tsx`
- Should use `rgb(var(--status-red))` etc.

## CI / Test Infrastructure
- `playwright.config.ts` ✅
- `vitest.config.ts` ✅
- `.github/workflows/` ❌ MISSING — no CI pipeline defined at repo root
