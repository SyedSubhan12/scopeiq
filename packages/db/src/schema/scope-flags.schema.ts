import { pgTable, uuid, text, timestamp, jsonb, index, doublePrecision } from "drizzle-orm/pg-core";
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
    messageText: text("message_text").notNull(),
    confidence: doublePrecision("confidence").notNull(),
    severity: flagSeverityEnum("severity").notNull().default("medium"),
    status: flagStatusEnum("status").notNull().default("pending"),
    title: text("title").notNull(),
    description: text("description"),
    suggestedResponse: text("suggested_response"),
    aiReasoning: text("ai_reasoning"),
    matchingClausesJson: jsonb("matching_clauses_json").default([]),
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
    workspaceStatusIdx: index("idx_scope_flags_workspace_status").on(table.workspaceId, table.status),
  }),
);

export type ScopeFlag = typeof scopeFlags.$inferSelect;
export type NewScopeFlag = typeof scopeFlags.$inferInsert;
