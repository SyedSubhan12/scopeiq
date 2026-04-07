import { pgTable, uuid, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { briefClarificationRequests } from "./brief-clarification-requests.schema";

export const briefClarificationItems = pgTable(
  "brief_clarification_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => briefClarificationRequests.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    fieldLabel: varchar("field_label", { length: 255 }).notNull(),
    prompt: text("prompt").notNull(),
    severity: varchar("severity", { length: 16 }).notNull().default("medium"),
    sourceFlagId: varchar("source_flag_id", { length: 100 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    requestOrderIdx: index("idx_brief_clarification_items_request_order").on(
      table.requestId,
      table.sortOrder,
    ),
  }),
);

export type BriefClarificationItem = typeof briefClarificationItems.$inferSelect;
export type NewBriefClarificationItem = typeof briefClarificationItems.$inferInsert;
