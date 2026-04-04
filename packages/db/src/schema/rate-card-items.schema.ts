import { pgTable, uuid, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { workspaces } from './workspaces.schema';

export const rateCardItems = pgTable(
  "rate_card_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    unit: varchar("unit", { length: 50 }).notNull().default("hour"),
    rateInCents: integer("rate_in_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceIdx: index("idx_rate_card_items_workspace").on(table.workspaceId),
  }),
);

export type RateCardItem = typeof rateCardItems.$inferSelect;
export type NewRateCardItem = typeof rateCardItems.$inferInsert;
