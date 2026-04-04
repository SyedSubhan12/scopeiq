# PHASE 6 — Client Portal (White-Label)
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 4-5 days | Depends on: Phases 3, 4, 5

---

## CONTEXT

The Client Portal is the client-facing half of ScopeIQ. It's a white-label interface branded with the agency's logo and colors. Clients access it via unique project-scoped tokens (no account required). The portal has maximum 3 actions per screen, uses plain English, and shows zero ScopeIQ branding on paid plans.

Portal URL pattern: `{workspace_slug}.scopeiq.com/{project_portal_token}`
Custom domain: `portal.agency.com/{project_portal_token}` (Studio+ plans)

---

## FILES TO CREATE

### Portal Pages (apps/web/src/app/portal/)

```
1.  apps/web/src/app/portal/layout.tsx                        — Portal layout: agency logo, brand color, no sidebar
2.  apps/web/src/app/portal/[token]/page.tsx                  — Portal home: tab navigation (Brief / Review Work / Messages)
3.  apps/web/src/app/portal/[token]/brief/page.tsx            — Brief submission form (multi-step wizard)
4.  apps/web/src/app/portal/[token]/review/page.tsx           — Deliverable review with annotation
5.  apps/web/src/app/portal/[token]/review/[deliverableId]/page.tsx — Single deliverable review
6.  apps/web/src/app/portal/[token]/change-order/[id]/page.tsx — View and accept/decline change order
7.  apps/web/src/app/portal/[token]/clarification/page.tsx    — Brief clarification request (when score < threshold)
8.  apps/web/src/app/portal/[token]/approved/page.tsx         — Confirmation page after approval
```

### Portal Components

```
9.  apps/web/src/components/portal/PortalHeader.tsx           — Agency logo + project name, brand-colored
10. apps/web/src/components/portal/PortalTabs.tsx             — Tab navigation: Brief, Review Work, Messages (max 3)
11. apps/web/src/components/portal/BriefWizard.tsx            — Multi-step paginated form (max 5 questions per step)
12. apps/web/src/components/portal/BriefProgressBar.tsx       — Step X of Y with percentage fill
13. apps/web/src/components/portal/ClientDeliverableViewer.tsx — Simplified viewer for clients (annotation enabled)
14. apps/web/src/components/portal/ClientFeedbackForm.tsx     — Pin comments + overall feedback textarea
15. apps/web/src/components/portal/ClientRevisionCounter.tsx  — Larger counter bar with "X rounds remaining" text
16. apps/web/src/components/portal/ClientApproveReject.tsx    — Two-button pattern: Approve / Request Changes
17. apps/web/src/components/portal/ChangeOrderView.tsx        — Read-only CO view with Accept/Decline buttons
18. apps/web/src/components/portal/ChangeOrderSignature.tsx   — Typed name + timestamp as legal acceptance
19. apps/web/src/components/portal/ClarificationForm.tsx      — Show flagged fields with AI questions, let client re-answer
20. apps/web/src/components/portal/PoweredByBadge.tsx         — "Powered by ScopeIQ" watermark (hidden on Studio+ plans)
```

### Portal Auth & Middleware

```
21. apps/web/src/lib/portal-auth.ts                           — Validate portal token, fetch project + workspace branding
22. apps/web/src/hooks/usePortalProject.ts                    — React Query hook for portal project data
23. apps/web/src/hooks/usePortalDeliverables.ts               — Deliverables list for portal view
```

### Portal API Routes (Backend)

These routes use portal_token auth instead of JWT:

```
24. apps/api/src/routes/portal.route.ts                       — GET /portal/:token (project info + branding)
25. UPDATE apps/api/src/routes/portal-deliverable.route.ts    — Already created in Phase 4, add portal context
26. UPDATE apps/api/src/routes/portal-change-order.route.ts   — Already created in Phase 5, add portal context
```

### White-Label Configuration

```
27. apps/web/src/lib/portal-theme.ts                          — Generate CSS variables from workspace brand_color
```

### E2E Test

```
28. apps/web/tests/e2e/client-portal-flow.spec.ts
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Portal Authentication (No Account Required)

Clients access the portal via a unique token URL. No login, no signup, no cookies. The token is project-scoped.

```typescript
// apps/web/src/lib/portal-auth.ts
export async function getPortalProject(token: string) {
  const response = await fetch(`${API_BASE}/v1/portal/${token}`);
  if (!response.ok) throw new Error("Invalid portal link");

  // Returns: project info + workspace branding (logo, color, name)
  // Does NOT return sensitive workspace data
  return response.json();
}
```

### White-Label Theming

The portal's primary color is dynamically set from the workspace's `brand_color`:

```typescript
// apps/web/src/lib/portal-theme.ts
export function generatePortalTheme(brandColor: string): Record<string, string> {
  // Convert hex to RGB for CSS variable usage
  const r = parseInt(brandColor.slice(1, 3), 16);
  const g = parseInt(brandColor.slice(3, 5), 16);
  const b = parseInt(brandColor.slice(5, 7), 16);

  return {
    "--portal-primary": `${r} ${g} ${b}`,
    "--portal-primary-hover": lightenColor(brandColor, 15),
    "--portal-primary-light": lightenColor(brandColor, 85),
  };
}

// Apply in portal layout:
// <div style={generatePortalTheme(workspace.brandColor) as CSSProperties}>
```

### Portal Layout Structure

From Wireframes document — Client Portal navigation:

```
┌──────────────────────────────────────────────────┐
│ [Agency Logo]           Project: {project name}   │
│─────────────────────────────────────────────────  │
│   [ Brief ]  ─────  [ Review Work ]  ─────       │
│   (Only show tabs relevant to current state)      │
│─────────────────────────────────────────────────  │
│                                                   │
│              ACTIVE TAB CONTENT                   │
│                                                   │
│                                                   │
│              ──────────────────                   │
│              [Powered by ScopeIQ]                 │
│              (hidden on Studio+ plans)            │
└───────────────────────────────────────────────────┘
```

### Brief Wizard (Multi-Step Form)

```typescript
// Paginated form — max 4-5 questions per step
// Progress bar shows completion percentage
// Steps auto-calculated from template fields_json
// "Back" and "Next Step" navigation
// Final step: "Submit Brief" button
// After submit: show confirmation + "You'll receive a confirmation email"
```

### Client Deliverable Review

```typescript
// Two-action pattern ONLY: [✓ Approve This Version] [↩ Request Changes]
// No ambiguity, no third option
// Revision counter prominently shown at top: "Revision round X of Y — X rounds remaining"
// When at revision limit: modal appears before "Request Changes" explaining additional rounds are billable
// Pin annotations work identically to agency view
// Overall feedback textarea at bottom
```

### Change Order Accept/Decline

```typescript
// Read-only view of: title, work description, pricing, revised timeline
// Two buttons: [Accept] [Decline]
// Accept flow: typed name input (serves as signature) + "I agree" checkbox → POST
// Decline flow: optional reason textarea → POST
// After acceptance: confirmation page with "Your SOW has been updated" message
```

### "Powered by ScopeIQ" Badge Logic

```typescript
// Show on Solo plan workspaces
// Hide on Studio and Agency plans
// Check: workspace.plan !== "solo"
// When hidden: CSS class removes the badge entirely (not just opacity)
// Automated screenshot test validates no ScopeIQ branding on paid plans
```

---

## DESIGN PRINCIPLES (from Wireframes)

1. **Maximum 3 actions per screen** — no decision overload
2. **No jargon** — plain English only ("Tell us about your project" not "Submit intake form")
3. **Agency branding fills the header** — client should feel they're using the agency's tool
4. **Single-project scoped** — clients never see multi-project navigation
5. **Tab steps only show phases relevant to current project state**

---

## ACCEPTANCE CRITERIA

- [ ] Portal accessible without any account or login
- [ ] Agency logo and brand color applied to all portal pages
- [ ] No ScopeIQ branding visible on Studio+ plans
- [ ] Maximum 3 actions per screen
- [ ] Brief submission works with paginated wizard
- [ ] Deliverable review with pin annotations functional
- [ ] Revision counter visible and accurate
- [ ] Change order accept/decline with typed signature
- [ ] Custom domain support (CNAME → Cloudflare)
- [ ] Mobile-responsive at 375px width

## COMMIT

```
feat(portal): add white-label client portal with brief submission, review, and change order acceptance
```
