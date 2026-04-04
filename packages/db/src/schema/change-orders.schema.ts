import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { changeOrderStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';
import { scopeFlags } from './scope-flags.schema';

export const changeOrders = pgTable(
  "change_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    scopeFlagId: uuid("scope_flag_id").references(() => scopeFlags.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    amount: integer("amount"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    status: changeOrderStatusEnum("status").notNull().default("draft"),
    lineItemsJson: jsonb("line_items_json").default([]),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_change_orders_project").on(table.projectId),
    workspaceStatusIdx: index("idx_change_orders_workspace_status").on(
      table.workspaceId,
      table.status,
    ),
  }),
);

export type ChangeOrder = typeof changeOrders.$inferSelect;
export type NewChangeOrder = typeof changeOrders.$inferInsert;
