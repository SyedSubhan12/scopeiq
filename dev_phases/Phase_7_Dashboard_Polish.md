# PHASE 7 — Dashboard, Onboarding, Billing & Polish
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 4-5 days | Depends on: Phases 3, 4, 5, 6

---

## CONTEXT

This is the final phase. It ties everything together: the dashboard overview with real-time metrics, onboarding flow for new users, Stripe billing integration, workspace settings, and all the polish that makes ScopeIQ feel complete.

---

## FILES TO CREATE

### Dashboard Overview

```
1.  apps/web/src/hooks/useDashboard.ts                         — Aggregated dashboard data query
2.  apps/web/src/components/shared/DashboardOverview.tsx        — Main dashboard page layout
3.  apps/web/src/components/shared/MetricCardGrid.tsx           — 2x2 bento grid: Active Projects, Awaiting Approval, Scope Flags, MRR
4.  apps/web/src/components/shared/RecentActivity.tsx           — Activity feed with timeline (from audit_log)
5.  apps/web/src/components/shared/ScopeFlagsSummary.tsx        — Top scope flags requiring action (from dashboard)
6.  apps/web/src/components/shared/UpcomingDeadlines.tsx        — Projects with approaching deadlines
7.  apps/web/src/app/(dashboard)/page.tsx                       — UPDATE: replace placeholder with full dashboard
```

### Dashboard API

```
8.  apps/api/src/services/dashboard.service.ts                 — Aggregate queries for dashboard metrics
9.  apps/api/src/routes/dashboard.route.ts                     — GET /dashboard (single endpoint, aggregated data)
```

### Onboarding Flow

```
10. apps/web/src/components/shared/OnboardingChecklist.tsx     — Floating checklist overlay (4 steps)
11. apps/web/src/components/shared/OnboardingStep.tsx          — Individual step with check/progress state
12. apps/web/src/components/shared/WelcomeScreen.tsx           — Full-screen welcome on first login
13. apps/web/src/hooks/useOnboarding.ts                        — Track progress via workspace.onboarding_progress
```

### Stripe Billing Integration

```
14. apps/api/src/routes/billing.route.ts                       — POST /billing/checkout (create Stripe checkout session)
                                                                  POST /billing/portal (create Stripe billing portal session)
                                                                  GET /billing/status (current plan + usage)
15. apps/api/src/routes/webhook-stripe.route.ts                — POST /webhooks/stripe (verify signature, handle events)
16. apps/api/src/services/billing.service.ts                   — Handle subscription lifecycle events
17. apps/web/src/components/shared/PricingTable.tsx            — 3-tier pricing display (Solo/Studio/Agency)
18. apps/web/src/components/shared/PlanBadge.tsx               — Current plan indicator in sidebar
19. apps/web/src/components/shared/UpgradePrompt.tsx           — Contextual upgrade prompt (when hitting plan limits)
20. apps/web/src/hooks/useBilling.ts                           — Billing status + checkout session creation
```

### Settings Pages

```
21. apps/web/src/app/(dashboard)/settings/page.tsx             — UPDATE: full settings page
22. apps/web/src/app/(dashboard)/settings/workspace/page.tsx   — Workspace name, logo, brand color
23. apps/web/src/app/(dashboard)/settings/billing/page.tsx     — Current plan, usage, upgrade/manage subscription
24. apps/web/src/app/(dashboard)/settings/rate-card/page.tsx   — Rate card management
25. apps/web/src/app/(dashboard)/settings/reminders/page.tsx   — Default reminder schedule configuration
26. apps/web/src/app/(dashboard)/settings/team/page.tsx        — Team members (invite, roles) — stub for v1.0
```

### Email Templates (Resend React Email)

```
27. apps/api/src/emails/welcome.tsx                            — Welcome email after signup
28. apps/api/src/emails/brief-clarification.tsx                — Brief held — clarification questions
29. apps/api/src/emails/deliverable-ready.tsx                  — New deliverable ready for review
30. apps/api/src/emails/approval-reminder.tsx                  — Reminder sequence (3 templates)
31. apps/api/src/emails/scope-flag-alert.tsx                   — New scope flag detected
32. apps/api/src/emails/change-order-sent.tsx                  — Change order sent to client
33. apps/api/src/emails/change-order-accepted.tsx              — Client accepted change order
```

### Notification System

```
34. apps/web/src/components/shared/NotificationBell.tsx        — Bell icon with unread count badge
35. apps/web/src/components/shared/NotificationDropdown.tsx    — Dropdown list of recent notifications
36. apps/web/src/hooks/useNotifications.ts                     — Supabase real-time subscription for notifications
37. apps/web/src/stores/notification.store.ts                  — Zustand store for notification state
```

### Project Audit Log Tab

```
38. apps/web/src/components/shared/AuditTimeline.tsx           — Visual timeline of all project actions
39. apps/web/src/app/(dashboard)/projects/[id]/log/page.tsx    — Audit log tab within project detail
```

### Final Polish

```
40. apps/web/src/components/shared/EmptyState.tsx              — Reusable empty state with illustration slot
41. apps/web/src/components/shared/ConfirmDialog.tsx           — Confirmation modal for destructive actions
42. apps/web/src/components/shared/CelebrationAnimation.tsx   — Confetti/checkmark for first scope flag, first approval
43. apps/web/src/app/not-found.tsx                             — Custom 404 page
44. apps/web/src/app/error.tsx                                 — Custom error boundary
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Dashboard Overview Layout

From Wireframes document, Screen 1:

```
┌───────────────────────────────────────────────────────────┐
│  Good morning, {name}. You have {n} scope flags.         │
│──────────────────────────────────────────────────────────│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Active   │  │ Awaiting │  │ Scope    │  │ MRR     │  │
│  │ Projects │  │ Approval │  │ Flags 🔴 │  │         │  │
│  │    12    │  │     4    │  │    2     │  │ $8,400  │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
│──────────────────────────────────────────────────────────│
│  RECENT ACTIVITY          │  SCOPE FLAGS — ACTION REQ.    │
│  ─────────────────────    │  ─────────────────────────    │
│  ✓ Acme approved Logo v3  │  🔴 Acme Corp — HIGH          │
│  ● Brief: TechStart       │  [View Flag] [Send CO]        │
│  → CO sent: MiniCo        │  🟡 TechStart — MEDIUM        │
│                            │  [View Flag] [Dismiss]        │
│  UPCOMING DEADLINES        │                               │
│  MiniCo — 3 days           │                               │
│  Acme revision — 5 days    │                               │
└────────────────────────────┴───────────────────────────────┘
```

### Dashboard API (Single Aggregated Query)

```typescript
// GET /v1/dashboard returns:
{
  data: {
    greeting: "Good morning, James",
    metrics: {
      active_projects: 12,
      awaiting_approval: 4,
      pending_scope_flags: 2,
      mrr: 8400,
      mrr_change_pct: 12
    },
    urgent_flags: [
      { id, project_name, client_name, message_preview, confidence, severity, created_at }
    ],
    recent_activity: [
      { id, action, entity_type, description, actor_name, created_at }
    ],
    upcoming_deadlines: [
      { project_id, project_name, milestone, due_date, days_remaining }
    ]
  }
}
```

### Onboarding Checklist (4 Steps)

```typescript
// From SOP-01:
// Step 1: Upload logo & set brand color ──→ workspace.onboarding_progress.branding = true
// Step 2: Create first project           ──→ workspace.onboarding_progress.first_project = true
// Step 3: Set up Brief Builder template  ──→ workspace.onboarding_progress.first_template = true
// Step 4: Upload or paste SOW            ──→ workspace.onboarding_progress.first_sow = true

// Checklist appears as floating card in bottom-right corner
// Dismissable but re-accessible from settings
// Shows progress ring (0/4 → 4/4)
// Each step links directly to the relevant page
// Celebration animation on completion (confetti)
// Target: <30 minutes from signup to first scope flag
```

### Stripe Billing Integration

```typescript
// Product IDs configured in Stripe:
// - prod_solo:   $79/mo  → Solo plan
// - prod_studio: $129/mo → Studio plan
// - prod_agency: $199/mo → Agency plan (note: PRD says $149, Business Plan says $199 — use $199)

// Webhook events to handle:
// checkout.session.completed → create workspace, set plan, store stripe_customer_id
// customer.subscription.updated → update plan, update features JSONB
// customer.subscription.deleted → downgrade to free/cancel
// invoice.payment_failed → flag workspace, send dunning email
// invoice.paid → clear payment failure flag

// Feature gating via workspace.features JSONB:
// Solo:   { max_users: 1, max_clients: 5, white_label: false, api_access: false, custom_domain: false }
// Studio: { max_users: 5, max_clients: 20, white_label: true, api_access: false, custom_domain: true }
// Agency: { max_users: -1, max_clients: -1, white_label: true, api_access: true, custom_domain: true }
```

### Real-Time Notifications (Supabase)

```typescript
// Subscribe to Supabase real-time changes on relevant tables:
// - scope_flags (new flags for this workspace)
// - approval_events (client approved/requested changes)
// - change_orders (client accepted/declined)
// - briefs (new submission or score complete)

// Notification format:
interface Notification {
  id: string;
  type: "scope_flag" | "approval" | "change_order" | "brief_scored";
  title: string;
  body: string;
  project_id: string;
  entity_id: string;
  read: boolean;
  created_at: string;
}

// Bell icon shows unread count
// Dropdown shows last 10 notifications
// Click navigates to relevant entity
```

### Email Templates (React Email + Resend)

All emails use React Email components for consistent rendering. Template structure:

```typescript
// Base template: Agency logo at top, ScopeIQ footer
// Brand color used for accent elements
// CTA button links directly to the relevant portal/dashboard page
// All emails include "View in ScopeIQ" link + unsubscribe

// Welcome email includes:
// - Login link
// - 3-step quick start guide
// - Calendly link for optional onboarding call
```

---

## ACCEPTANCE CRITERIA

- [ ] Dashboard loads in <2 seconds with all metrics
- [ ] Metric cards animate count-up on page load (stagger-slow)
- [ ] Scope flags surface with direct action buttons on dashboard
- [ ] Onboarding checklist tracks progress across sessions
- [ ] Time to first value: <30 minutes from signup
- [ ] Stripe checkout creates subscription and sets plan
- [ ] Stripe webhook updates plan and feature flags
- [ ] All 7 email templates render correctly in Gmail, Outlook, Apple Mail
- [ ] Real-time notifications appear within 2 seconds of event
- [ ] Audit log timeline shows all project actions with timestamps
- [ ] Settings pages allow branding, rate card, and reminder configuration
- [ ] Empty states shown for all zero-data screens with relevant CTAs

## FINAL VERIFICATION (ENTIRE APPLICATION)

```bash
# Full build
pnpm build

# Full type check
pnpm typecheck

# Full lint
pnpm lint

# All unit tests
pnpm test

# All E2E tests
pnpm e2e

# Manual smoke test:
# 1. Register new account
# 2. Complete onboarding (logo, project, template, SOW)
# 3. Client submits brief via portal
# 4. AI scores brief
# 5. Upload deliverable for review
# 6. Client leaves annotated feedback
# 7. Client message triggers scope flag
# 8. Confirm flag → send change order
# 9. Client accepts change order
# 10. Dashboard shows all metrics correctly
```

## COMMIT

```
feat(dashboard): add dashboard overview with metrics, activity feed, and scope flags
feat(onboarding): add 4-step onboarding checklist with progress tracking
feat(billing): add Stripe checkout, webhook handling, and plan management
feat(email): add all 7 transactional email templates
feat(notifications): add real-time notification system with Supabase subscriptions
```
