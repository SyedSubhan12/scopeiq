import { pgTable, uuid, varchar, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";
import { briefTemplates } from "./brief-templates.schema";

export const marketplaceInstalls = pgTable(
  "marketplace_installs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 128 }).notNull(),
    briefTemplateId: uuid("brief_template_id").references(() => briefTemplates.id, { onDelete: "set null" }),
    installedByUserId: uuid("installed_by_user_id").notNull(),
    installedAt: timestamp("installed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueInstall: unique("uq_marketplace_installs_workspace_slug").on(table.workspaceId, table.slug),
    workspaceIdx: index("idx_marketplace_installs_workspace").on(table.workspaceId),
  }),
);

export type MarketplaceInstall = typeof marketplaceInstalls.$inferSelect;
export type NewMarketplaceInstall = typeof marketplaceInstalls.$inferInsert;
