---
name: ScopeIQ Frontend Architecture
description: Core architecture facts about the ScopeIQ web app — routes, stores, patterns
type: project
---

Three product modules: Brief Builder, Approval Portal, Scope Guard.

Route groups: `(auth)/`, `(dashboard)/`, `(onboarding)/`, `(portal)/[portalToken]/`.
Portal is at `(portal)/portal/[portalToken]/page.tsx` (main entry) and `(portal)/[portalToken]/review/[deliverableId]/page.tsx` (per-deliverable review).

Stores: `useWorkspaceStore` (workspace.store.ts), `useUIStore` (ui.store.ts), `useNotificationStore` (notification.store.ts), `useRevisionLimitModal` (revision-limit-modal.store.ts).

Real-time: `useRealtimeScopeFlags`, `useRealtimeApprovalEvents`, `useRealtimeDashboardMetrics` — all in dashboard layout, scoped to workspace_id.

Deliverable uploads use presigned R2 URLs (3-step: get-url → PUT → confirm). SOW file mode sends placeholder text, not actual file content — server side handles extraction.

**Why:** Helps orient toward existing patterns without re-reading the whole tree.
**How to apply:** Use these entry points as the starting context for any feature work.
