import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { briefTemplateStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';

export const briefTemplates = pgTable(
  "brief_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    fieldsJson: jsonb("fields_json").notNull().default([]),
    brandingJson: jsonb("branding_json").notNull().default({}),
    isDefault: boolean("is_default").notNull().default(false),
    status: briefTemplateStatusEnum("status").notNull().default("draft"),
    clarityThreshold: integer("clarity_threshold"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceStatusIdx: index("idx_brief_templates_workspace_status").on(
      table.workspaceId,
      table.status,
    ),
  }),
);

export type BriefTemplate = typeof briefTemplates.$inferSelect;
export type NewBriefTemplate = typeof briefTemplates.$inferInsert;
