import { pgTable, uuid, varchar, timestamp, integer, jsonb, text, index } from "drizzle-orm/pg-core";
import { briefStatusEnum } from "./enums";
import { briefs } from "./briefs.schema";
import { workspaces } from "./workspaces.schema";
import { users } from "./users.schema";

export const briefVersions = pgTable(
  "brief_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: briefStatusEnum("status").notNull(),
    scopeScore: integer("scope_score"),
    scoringResultJson: jsonb("scoring_result_json"),
    answersJson: jsonb("answers_json").notNull().default([]),
    attachmentsJson: jsonb("attachments_json").notNull().default([]),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewNote: text("review_note"),
    submittedBy: uuid("submitted_by"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    briefVersionIdx: index("idx_brief_versions_brief_version").on(table.briefId, table.versionNumber),
    workspaceBriefIdx: index("idx_brief_versions_workspace_brief").on(table.workspaceId, table.briefId),
  }),
);

export type BriefVersion = typeof briefVersions.$inferSelect;
export type NewBriefVersion = typeof briefVersions.$inferInsert;
