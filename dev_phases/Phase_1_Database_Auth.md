# PHASE 1 — Database Schema & Authentication
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 3-4 days | Depends on: Phase 0

---

## CONTEXT

Phase 0 is complete — the monorepo skeleton is running. Now build the complete database schema using Drizzle ORM and integrate Supabase Auth. After this phase, all 15 tables exist with indexes, RLS policies are configured, and users can register/login.

## PREREQUISITE STATE

- `pnpm dev` starts all 3 services
- Docker runs PostgreSQL, Redis, MinIO
- `packages/db` exists but has no schemas

---

## FILES TO CREATE

### Drizzle Schema Files (packages/db/schema/)

Create ONE file per domain entity. Each file exports the table definition and inferred TypeScript types.

```
1.  packages/db/schema/enums.ts              — All PostgreSQL enum definitions
2.  packages/db/schema/workspaces.schema.ts   — workspaces table
3.  packages/db/schema/users.schema.ts        — users table
4.  packages/db/schema/clients.schema.ts      — clients table
5.  packages/db/schema/projects.schema.ts     — projects table
6.  packages/db/schema/brief-templates.schema.ts
7.  packages/db/schema/briefs.schema.ts
8.  packages/db/schema/brief-fields.schema.ts
9.  packages/db/schema/deliverables.schema.ts
10. packages/db/schema/feedback-items.schema.ts
11. packages/db/schema/approval-events.schema.ts
12. packages/db/schema/reminder-logs.schema.ts
13. packages/db/schema/statements-of-work.schema.ts
14. packages/db/schema/sow-clauses.schema.ts
15. packages/db/schema/scope-flags.schema.ts
16. packages/db/schema/change-orders.schema.ts
17. packages/db/schema/rate-card-items.schema.ts
18. packages/db/schema/audit-log.schema.ts
19. packages/db/schema/index.ts              — Re-export everything
```

### Database Helpers (packages/db/src/)

```
20. packages/db/src/client.ts                — Drizzle client with connection pool (drizzle-orm/node-postgres)
21. packages/db/src/audit.ts                 — writeAuditLog(db, workspaceId, actorId, action, entityType, entityId, metadata) helper
22. packages/db/src/helpers.ts               — generatePortalToken(), generateUlid() helpers
23. packages/db/src/index.ts                 — Export db instance + all schemas + helpers
```

### Auth Middleware (apps/api/src/middleware/)

```
24. apps/api/src/middleware/auth.ts           — Supabase JWT verification middleware for Hono
25. apps/api/src/middleware/portal-auth.ts    — Portal token verification middleware (for client-facing endpoints)
```

### Auth Routes (apps/api/src/routes/)

```
26. apps/api/src/routes/auth.route.ts        — POST /auth/register, POST /auth/login (delegates to Supabase)
```

### Frontend Auth

```
27. apps/web/src/lib/supabase.ts             — Supabase client (browser) + server client
28. apps/web/src/app/(auth)/login/page.tsx    — Login page with email/password + magic link
29. apps/web/src/app/(auth)/register/page.tsx — Registration page
30. apps/web/src/app/(auth)/layout.tsx        — Auth layout (centered card, no sidebar)
31. apps/web/src/middleware.ts                — Next.js middleware: redirect unauthenticated to /login
```

### Seed Script

```
32. packages/db/src/seed.ts                  — Create test workspace, 3 users, 3 clients, 2 projects
```

---

## DETAILED SCHEMA SPECIFICATIONS

### enums.ts

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status_enum", [
  "draft", "active", "paused", "completed", "archived"
]);

export const briefStatusEnum = pgEnum("brief_status_enum", [
  "pending_score", "scored", "clarification_needed", "approved", "rejected"
]);

export const deliverableStatusEnum = pgEnum("deliverable_status_enum", [
  "not_started", "in_progress", "in_review", "revision_requested", "approved"
]);

export const deliverableTypeEnum = pgEnum("deliverable_type_enum", [
  "file", "figma", "loom", "youtube", "link"
]);

export const flagSeverityEnum = pgEnum("flag_severity_enum", [
  "low", "medium", "high"
]);

export const flagStatusEnum = pgEnum("flag_status_enum", [
  "pending", "confirmed", "dismissed", "snoozed"
]);

export const changeOrderStatusEnum = pgEnum("change_order_status_enum", [
  "draft", "sent", "accepted", "declined", "expired"
]);

export const clauseTypeEnum = pgEnum("clause_type_enum", [
  "deliverable", "revision_limit", "timeline", "exclusion", "payment_term", "other"
]);

export const userRoleEnum = pgEnum("user_role_enum", [
  "owner", "admin", "member", "viewer"
]);

export const planEnum = pgEnum("plan_enum", ["solo", "studio", "agency"]);

export const auditActionEnum = pgEnum("audit_action_enum", [
  "create", "update", "delete", "approve", "reject", "flag", "send", "dismiss"
]);

export const reminderStepEnum = pgEnum("reminder_step_enum", [
  "gentle_nudge", "deadline_warning", "silence_approval"
]);

export const messageSourceEnum = pgEnum("message_source_enum", [
  "portal", "email_forward", "manual_input"
]);
```

### workspaces.schema.ts (EXAMPLE — follow this pattern for ALL tables)

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { planEnum } from "./enums";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: planEnum("plan").notNull().default("solo"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 7 }).default("#0F6E56"),
  customDomain: varchar("custom_domain", { length: 255 }).unique(),
  settingsJson: jsonb("settings_json").default({}),
  onboardingProgress: jsonb("onboarding_progress").default({}),
  features: jsonb("features").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Inferred types
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

// Zod schemas for validation
export const insertWorkspaceSchema = createInsertSchema(workspaces);
export const selectWorkspaceSchema = createSelectSchema(workspaces);
```

### KEY TABLE RELATIONSHIPS

Follow the Database Schema document for all column definitions. Critical relationships:

- `users.workspace_id` → `workspaces.id` (REQUIRED on every table with tenant data)
- `projects.client_id` → `clients.id`
- `projects.sow_id` → `statements_of_work.id` (nullable)
- `briefs.project_id` → `projects.id`
- `brief_fields.brief_id` → `briefs.id`
- `deliverables.project_id` → `projects.id`
- `feedback_items.deliverable_id` → `deliverables.id`
- `scope_flags.project_id` → `projects.id`
- `scope_flags.sow_clause_id` → `sow_clauses.id`
- `change_orders.scope_flag_id` → `scope_flags.id`
- `sow_clauses.sow_id` → `statements_of_work.id`

### INDEXES TO CREATE

Add indexes using Drizzle's `.index()` method on each table. Critical indexes:

```typescript
// On projects table:
(table) => ({
  workspaceStatusIdx: index("idx_projects_workspace_status").on(table.workspaceId, table.status),
  clientIdx: index("idx_projects_client").on(table.clientId),
  portalTokenIdx: uniqueIndex("idx_projects_portal_token").on(table.portalToken),
})

// On scope_flags table:
(table) => ({
  projectIdx: index("idx_scope_flags_project").on(table.projectId),
  pendingIdx: index("idx_scope_flags_pending").on(table.projectId).where(sql`status = 'pending'`),
})

// On audit_log table:
(table) => ({
  workspaceIdx: index("idx_audit_log_workspace").on(table.workspaceId),
  entityIdx: index("idx_audit_log_entity").on(table.entityType, table.entityId),
  createdIdx: index("idx_audit_log_created").on(table.workspaceId, table.createdAt),
})
```

### writeAuditLog Helper (packages/db/src/audit.ts)

```typescript
import { db } from "./client";
import { auditLog } from "../schema/audit-log.schema";
import type { AuditAction } from "../schema/enums";

interface AuditLogParams {
  workspaceId: string;
  actorId: string | null;
  actorType?: "user" | "system" | "client";
  entityType: string;
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(
  trx: typeof db,  // Accept transaction or db instance
  params: AuditLogParams,
): Promise<void> {
  await trx.insert(auditLog).values({
    workspaceId: params.workspaceId,
    actorId: params.actorId,
    actorType: params.actorType ?? "user",
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    metadataJson: params.metadata ?? {},
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
```

### Auth Middleware (apps/api/src/middleware/auth.ts)

```typescript
import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import { UnauthorizedError } from "@novabots/types";
import { db } from "@novabots/db";
import { users } from "@novabots/db/schema";
import { eq } from "drizzle-orm";

// Extend Hono context with auth data
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    workspaceId: string;
    userRole: string;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Look up internal user record
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authUid, authUser.id))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError("User not found in database");
  }

  // Set context variables for downstream handlers
  c.set("userId", user.id);
  c.set("workspaceId", user.workspaceId);
  c.set("userRole", user.role);

  await next();
});
```

---

## VERIFICATION

```bash
# Generate and run migrations
pnpm --filter @novabots/db db:generate
pnpm --filter @novabots/db db:push

# Seed test data
pnpm --filter @novabots/db db:seed


# Verify tables exist
docker exec -it scopeiq-postgres-1 psql -U scopeiq -c "\dt"
# Should show all 15+ tables

# Type check
pnpm typecheck

# Start services and test auth
pnpm dev
# Register a user at http://localhost:3000/register
# Login at http://localhost:3000/login
```

## COMMIT

```
feat(db): add complete Drizzle schema with all 15 tables, auth middleware, and seed data
```
