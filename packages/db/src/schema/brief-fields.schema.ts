import { pgTable, uuid, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { briefs } from './briefs.schema';

export const briefFields = pgTable(
  "brief_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    fieldLabel: varchar("field_label", { length: 255 }).notNull(),
    fieldType: varchar("field_type", { length: 50 }).notNull().default("text"),
    value: text("value"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    briefIdx: index("idx_brief_fields_brief").on(table.briefId),
  }),
);

export type BriefField = typeof briefFields.$inferSelect;
export type NewBriefField = typeof briefFields.$inferInsert;
