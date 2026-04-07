import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { workspaces } from './workspaces.schema';
import { deliverables } from './deliverables.schema';

export const approvalEvents = pgTable(
  "approval_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    actorId: uuid("actor_id"),
    actorName: text("actor_name"),
    action: varchar("action", { length: 50 }).notNull(),
    comment: text("comment"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("idx_approval_events_workspace").on(table.workspaceId),
    deliverableIdx: index("idx_approval_events_deliverable").on(table.deliverableId),
    eventTypeIdx: index("idx_approval_events_type").on(table.workspaceId, table.eventType),
  }),
);

export type ApprovalEvent = typeof approvalEvents.$inferSelect;
export type NewApprovalEvent = typeof approvalEvents.$inferInsert;
