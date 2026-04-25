import { pgTable, text, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

export const projectIntelligenceEventTypeEnum = pgEnum("project_intelligence_event_type", [
  "brief_submitted",
  "brief_scored",
  "brief_clarified",
  "deliverable_uploaded",
  "deliverable_approved",
  "revision_requested",
  "scope_flag_created",
  "scope_flag_confirmed",
  "scope_flag_dismissed",
  "change_order_generated",
  "change_order_accepted",
  "change_order_declined",
  "message_sent",
  "message_out_of_scope",
  "sow_uploaded",
  "sow_activated",
  "sow_updated",
]);

export const projectIntelligenceEntityTypeEnum = pgEnum("project_intelligence_entity_type", [
  "brief",
  "deliverable",
  "scope_flag",
  "change_order",
  "message",
  "sow",
]);

export const projectIntelligence = pgTable(
  "project_intelligence",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id").notNull(),
    clientId: text("client_id"),
    eventType: projectIntelligenceEventTypeEnum("event_type").notNull(),
    entityType: projectIntelligenceEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    summary: text("summary").notNull(),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("idx_pi_workspace").on(table.workspaceId),
    projectIdx: index("idx_pi_project").on(table.projectId),
    clientIdx: index("idx_pi_client").on(table.clientId),
    eventTypeIdx: index("idx_pi_event_type").on(table.eventType),
    createdAtIdx: index("idx_pi_created_at").on(table.createdAt),
  }),
);

export type ProjectIntelligence = typeof projectIntelligence.$inferSelect;
export type NewProjectIntelligence = typeof projectIntelligence.$inferInsert;
export type ProjectIntelligenceEventType = (typeof projectIntelligenceEventTypeEnum.enumValues)[number];
export type ProjectIntelligenceEntityType = (typeof projectIntelligenceEntityTypeEnum.enumValues)[number];
