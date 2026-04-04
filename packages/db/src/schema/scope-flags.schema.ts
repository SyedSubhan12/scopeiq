import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { flagSeverityEnum, flagStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';
import { sowClauses } from './sow-clauses.schema';

export const scopeFlags = pgTable(
  "scope_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    sowClauseId: uuid("sow_clause_id").references(() => sowClauses.id),
    severity: flagSeverityEnum("severity").notNull().default("medium"),
    status: flagStatusEnum("status").notNull().default("pending"),
    title: text("title").notNull(),
    description: text("description"),
    aiReasoning: text("ai_reasoning"),
    evidence: jsonb("evidence").default({}),
    flaggedBy: uuid("flagged_by"),
    resolvedBy: uuid("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_scope_flags_project").on(table.projectId),
    pendingIdx: index("idx_scope_flags_pending")
      .on(table.projectId)
      .where(sql`status = 'pending'`),
    workspaceIdx: index("idx_scope_flags_workspace").on(table.workspaceId),
  }),
);

export type ScopeFlag = typeof scopeFlags.$inferSelect;
export type NewScopeFlag = typeof scopeFlags.$inferInsert;
