import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { briefs } from "./briefs.schema";
import { briefVersions } from "./brief-versions.schema";
import { users } from "./users.schema";

export const briefClarificationRequests = pgTable(
  "brief_clarification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    briefVersionId: uuid("brief_version_id").references(() => briefVersions.id, { onDelete: "set null" }),
    status: varchar("status", { length: 32 }).notNull().default("open"),
    message: text("message"),
    requestedBy: uuid("requested_by").references(() => users.id),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    briefStatusIdx: index("idx_brief_clarification_requests_brief_status").on(
      table.briefId,
      table.status,
    ),
    workspaceBriefIdx: index("idx_brief_clarification_requests_workspace_brief").on(
      table.workspaceId,
      table.briefId,
    ),
  }),
);

export type BriefClarificationRequest = typeof briefClarificationRequests.$inferSelect;
export type NewBriefClarificationRequest = typeof briefClarificationRequests.$inferInsert;
