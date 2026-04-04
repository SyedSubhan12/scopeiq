import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { projectStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { clients } from './clients.schema';
import { statementsOfWork } from './statements-of-work.schema';

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    sowId: uuid("sow_id").references(() => statementsOfWork.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("draft"),
    budget: integer("budget"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    portalToken: varchar("portal_token", { length: 64 }).unique(),
    portalEnabled: varchar("portal_enabled", { length: 5 }).default("false"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceStatusIdx: index("idx_projects_workspace_status").on(table.workspaceId, table.status),
    clientIdx: index("idx_projects_client").on(table.clientId),
    portalTokenIdx: uniqueIndex("idx_projects_portal_token").on(table.portalToken),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
