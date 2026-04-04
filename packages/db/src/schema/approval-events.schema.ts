import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { deliverables } from './deliverables.schema';

export const approvalEvents = pgTable(
  "approval_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id"),
    actorName: text("actor_name"),
    action: varchar("action", { length: 50 }).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    deliverableIdx: index("idx_approval_events_deliverable").on(table.deliverableId),
  }),
);

export type ApprovalEvent = typeof approvalEvents.$inferSelect;
export type NewApprovalEvent = typeof approvalEvents.$inferInsert;
