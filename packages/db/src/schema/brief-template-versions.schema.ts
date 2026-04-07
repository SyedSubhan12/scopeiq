import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { briefTemplates } from "./brief-templates.schema";
import { users } from "./users.schema";

export const briefTemplateVersions = pgTable(
  "brief_template_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    templateId: uuid("template_id").notNull().references(() => briefTemplates.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    fieldsJson: jsonb("fields_json").notNull().default([]),
    brandingJson: jsonb("branding_json").notNull().default({}),
    isDefault: boolean("is_default").notNull().default(false),
    templateStatus: varchar("template_status", { length: 32 }).notNull().default("published"),
    publishedBy: uuid("published_by").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    templateVersionIdx: index("idx_brief_template_versions_template_version").on(
      table.templateId,
      table.versionNumber,
    ),
    workspaceTemplateIdx: index("idx_brief_template_versions_workspace_template").on(
      table.workspaceId,
      table.templateId,
    ),
  }),
);

export type BriefTemplateVersion = typeof briefTemplateVersions.$inferSelect;
export type NewBriefTemplateVersion = typeof briefTemplateVersions.$inferInsert;
