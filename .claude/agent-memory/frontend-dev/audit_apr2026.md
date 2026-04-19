---
name: April 2026 Frontend Audit Findings
description: Key gaps and issues found in the April 10 2026 PRD compliance audit of apps/web/
type: project
---

Key gaps found during full PRD audit on 2026-04-10:

MISSING:
- Password reset route (`(auth)/forgot-password/` or similar) — no file exists at all
- DnD Kit drag-drop in FormBuilder — uses arrow-button reordering instead
- ChangeOrderPDF component — no PDF generation for change orders anywhere
- PortalBrandingConfig component — branding is configured in workspace settings page inline, no dedicated component
- AuditLogTimeline, NavigationBadge components in shared/ — these names don't exist; ActivityLogTab and NotificationBell serve these roles
- Messages tab in portal is a stub (empty state, no real messaging)

PARTIAL:
- Reminder settings page saves to localStorage only — not persisted to API
- Logo upload in workspace settings uses FileReader/base64 — not presigned URL
- ScopeFlag-related components use `flag: any` prop type in ScopeFlagCard, ScopeFlagDetail, ScopeFlagList, ChangeOrderList — 14 occurrences of `: any` across scope-guard/
- 197 hardcoded Tailwind semantic color classes (bg-red-, text-green-, bg-amber-, bg-emerald- etc.) instead of design token CSS vars across components
- SOW file upload mode sends a placeholder string `[File: filename]` rather than actual file content to the API

CONFIRMED WORKING:
- Presigned R2 upload flow for deliverables (3-step in useDeliverables.ts)
- Supabase realtime scoped to workspace_id for scope_flags, dashboard metrics, approval events
- Portal server-side CSS variable injection for branding (no FOUC)
- BriefHoldState, BriefFlagCard, ClarityScoreRing, FormBuilder (without DnD), FormPreview, FieldEditor all exist
- AnnotationCanvas (SVG overlay, click-to-pin, x%/y% coords) — complete
- FeedbackPanel (threaded comments, resolve, reply) — complete
- RevisionCounter with color states — complete
- ScopeFlagCard with 3 actions (confirm+generate CO, mark in-scope, dismiss with reason + snooze) — complete
- ScopeMeter + ScopeMeterBar — complete
- ChangeOrderEditor with line items, totals, preview dialog — complete
- All 3 Zustand stores present with correct shapes

**Why:** Documents the state of the codebase after the April 2026 audit so future sessions don't re-audit.
**How to apply:** Use as the gap list when prioritizing frontend work.
