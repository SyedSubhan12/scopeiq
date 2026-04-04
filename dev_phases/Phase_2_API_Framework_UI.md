# PHASE 2 — API Framework & Shared UI Components
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 3-4 days | Depends on: Phase 1

---

## CONTEXT

Database and auth are complete. Now build the API framework layer (CRUD for workspaces, projects, clients) and the shared UI component library. After this phase, the agency dashboard shell exists with sidebar navigation, and all core entities are manageable via API.

---

## FILES TO CREATE

### API — Repositories (Data Access Layer)

Each repository encapsulates ALL Drizzle queries for one entity. Every query MUST include `workspaceId` in the WHERE clause.

```
1.  apps/api/src/repositories/workspace.repository.ts
2.  apps/api/src/repositories/project.repository.ts
3.  apps/api/src/repositories/client.repository.ts
4.  apps/api/src/repositories/rate-card.repository.ts
5.  apps/api/src/repositories/audit-log.repository.ts
```

### API — Services (Business Logic)

Services call repositories and dispatch BullMQ jobs. They handle authorization checks (role verification) and call `writeAuditLog()` within the same transaction for mutations.

```
6.  apps/api/src/services/workspace.service.ts
7.  apps/api/src/services/project.service.ts
8.  apps/api/src/services/client.service.ts
9.  apps/api/src/services/rate-card.service.ts
10. apps/api/src/services/audit-log.service.ts
```

### API — Zod Schemas

```
11. apps/api/src/routes/workspace.schemas.ts   — updateWorkspace, uploadLogo request schemas
12. apps/api/src/routes/project.schemas.ts     — createProject, updateProject, listProjects query params
13. apps/api/src/routes/client.schemas.ts      — createClient, updateClient
14. apps/api/src/routes/rate-card.schemas.ts   — createRateCardItem, updateRateCardItem
```

### API — Route Handlers

```
15. apps/api/src/routes/workspace.route.ts     — GET /workspaces/me, PATCH /workspaces/me, POST /workspaces/me/logo
16. apps/api/src/routes/project.route.ts       — GET /projects, POST /projects, GET /projects/:id, PATCH /projects/:id, DELETE /projects/:id
17. apps/api/src/routes/client.route.ts        — GET /clients, POST /clients, GET /clients/:id, PATCH /clients/:id
18. apps/api/src/routes/rate-card.route.ts     — GET /rate-card, POST /rate-card, PATCH /rate-card/:id, DELETE /rate-card/:id
19. apps/api/src/routes/audit-log.route.ts     — GET /audit-log (admin only, with filters)
```

### API — Infrastructure

```
20. apps/api/src/lib/queue.ts                  — BullMQ queue initialization, dispatchJob() helper
21. apps/api/src/lib/storage.ts                — R2/MinIO presigned URL generation helper
22. apps/api/src/lib/pagination.ts             — Cursor-based pagination helper (parseCursor, buildPaginatedResponse)
23. apps/api/src/index.ts                      — UPDATE: mount all new routes on the Hono app
```

### API — Unit Tests

```
24. apps/api/src/services/project.service.test.ts
25. apps/api/src/services/client.service.test.ts
```

### Shared UI Components (packages/ui/src/)

Build the core component library with ScopeIQ design tokens. All components use Radix UI primitives with Tailwind + CSS variables for styling.

```
26. packages/ui/src/button.tsx                 — Primary, Secondary, Danger, Ghost variants + sizes + loading state
27. packages/ui/src/input.tsx                  — Text input with label, error state, helper text
28. packages/ui/src/textarea.tsx               — Multiline input
29. packages/ui/src/select.tsx                 — Radix Select with ScopeIQ styling
30. packages/ui/src/badge.tsx                  — Status badges: approved, in_review, pending, flagged, draft (with color tokens)
31. packages/ui/src/card.tsx                   — Base card with hover elevation + ScopeFlagCard variant
32. packages/ui/src/metric-card.tsx            — Number + label + trend arrow (animated count-up)
33. packages/ui/src/dialog.tsx                 — Radix Dialog with ScopeIQ styling
34. packages/ui/src/dropdown-menu.tsx          — Radix DropdownMenu
35. packages/ui/src/avatar.tsx                 — User avatar with initials fallback
36. packages/ui/src/skeleton.tsx               — Skeleton loading with shimmer animation
37. packages/ui/src/toast.tsx                  — Toast notification system (success, error, info)
38. packages/ui/src/index.ts                   — UPDATE: export all components
```

### Frontend — Dashboard Shell

```
39. apps/web/src/app/(dashboard)/layout.tsx            — Dashboard layout: sidebar (240px) + main content area
40. apps/web/src/components/shared/Sidebar.tsx          — Navigation sidebar with items: Dashboard, Projects, Briefs, Scope Flags, Clients, Change Orders, Settings + badge counts
41. apps/web/src/components/shared/TopBar.tsx           — Top bar: search, notification bell (with count), user avatar dropdown
42. apps/web/src/components/shared/NavItem.tsx          — Single nav item with icon, label, optional badge count
43. apps/web/src/app/(dashboard)/page.tsx               — Dashboard overview placeholder (will be built in Phase 7)
44. apps/web/src/app/(dashboard)/projects/page.tsx      — Projects list page
45. apps/web/src/app/(dashboard)/projects/[id]/page.tsx — Project detail page (tabbed: Brief, Deliverables, Scope Guard, Change Orders, Log)
46. apps/web/src/app/(dashboard)/clients/page.tsx       — Clients list page
47. apps/web/src/app/(dashboard)/settings/page.tsx      — Settings page (workspace, branding, rate card)
```

### Frontend — React Query Hooks

```
48. apps/web/src/hooks/useWorkspace.ts         — getWorkspace, updateWorkspace mutations
49. apps/web/src/hooks/useProjects.ts          — listProjects (paginated), getProject, createProject, updateProject, deleteProject
50. apps/web/src/hooks/useClients.ts           — listClients, createClient
51. apps/web/src/hooks/useRateCard.ts          — listRateCard, createRateCardItem
```

### Frontend — Zustand Stores

```
52. apps/web/src/stores/ui.store.ts            — sidebarOpen, activeProjectId, activeTab
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Repository Pattern Example (project.repository.ts)

```typescript
import { db } from "@novabots/db";
import { projects, clients } from "@novabots/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export const projectRepository = {
  async list(workspaceId: string, options: { status?: string; cursor?: string; limit?: number }) {
    const limit = options.limit ?? 20;
    const query = db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        budget: projects.budget,
        startDate: projects.startDate,
        endDate: projects.endDate,
        createdAt: projects.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
        },
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(
        and(
          eq(projects.workspaceId, workspaceId),  // ALWAYS include workspaceId
          isNull(projects.deletedAt),
          options.status ? eq(projects.status, options.status) : undefined,
          options.cursor ? gt(projects.id, options.cursor) : undefined,
        ),
      )
      .orderBy(desc(projects.createdAt))
      .limit(limit + 1);  // Fetch one extra to determine has_more

    const results = await query;
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1]!.id : null,
        has_more: hasMore,
      },
    };
  },

  async getById(workspaceId: string, projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),  // ALWAYS
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);
    return project ?? null;
  },

  // ... create, update, softDelete methods
};
```

### Button Component Example (packages/ui/src/button.tsx)

```typescript
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-mid shadow-sm",
        secondary: "border border-primary text-primary bg-white hover:bg-primary-light",
        danger: "bg-status-red text-white hover:bg-red-700",
        ghost: "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base font-semibold",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
```

### Sidebar Navigation Items

```typescript
const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects", countKey: "activeProjects" },
  { href: "/briefs", icon: FileText, label: "Briefs", countKey: "pendingBriefs" },
  { href: "/scope-flags", icon: ShieldAlert, label: "Scope Flags", countKey: "pendingFlags", urgent: true },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/change-orders", icon: FileSignature, label: "Change Orders", countKey: "pendingCOs" },
  // --- separator ---
  { href: "/settings", icon: Settings, label: "Settings" },
];
```

---

## VERIFICATION

```bash
pnpm typecheck
pnpm test
pnpm dev

# Test API endpoints
curl -H "Authorization: Bearer <jwt>" http://localhost:4000/v1/projects
curl -H "Authorization: Bearer <jwt>" http://localhost:4000/v1/clients

# Test frontend
# Navigate to http://localhost:3000
# Should see dashboard shell with sidebar navigation
# Projects list page should load (empty state)
```

## COMMIT

```
feat(api): add core CRUD routes for projects, clients, workspaces, rate card
feat(ui): add shared component library with Button, Badge, Card, Input, Skeleton
feat(web): add dashboard shell with sidebar navigation and projects/clients pages
```
