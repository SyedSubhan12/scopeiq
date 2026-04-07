import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { briefStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';
import { briefTemplates } from './brief-templates.schema';
import { briefTemplateVersions } from './brief-template-versions.schema';
import { users } from './users.schema';

export const briefs = pgTable(
  "briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    version: integer("version").notNull().default(1),
    templateId: uuid("template_id").references(() => briefTemplates.id),
    templateVersionId: uuid("template_version_id").references(() => briefTemplateVersions.id),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    status: briefStatusEnum("status").notNull().default("pending_score"),
    scopeScore: integer("scope_score"),
    scoringResultJson: jsonb("scoring_result_json"),
    submittedBy: uuid("submitted_by"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    scoredAt: timestamp("scored_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    projectIdx: index("idx_briefs_project").on(table.projectId),
    workspaceStatusIdx: index("idx_briefs_workspace_status").on(table.workspaceId, table.status),
    projectVersionIdx: index("idx_briefs_project_version").on(table.projectId, table.version),
  }),
);

export type Brief = typeof briefs.$inferSelect;
export type NewBrief = typeof briefs.$inferInsert;
