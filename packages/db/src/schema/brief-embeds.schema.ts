import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.schema";

export const briefEmbeds = pgTable(
  "brief_embeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    token: text("token").notNull().unique(),
    formConfigJson: jsonb("form_config_json").notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceIdx: index("idx_brief_embeds_workspace").on(table.workspaceId),
    tokenIdx: index("idx_brief_embeds_token").on(table.token),
  }),
);

export type BriefEmbed = typeof briefEmbeds.$inferSelect;
export type NewBriefEmbed = typeof briefEmbeds.$inferInsert;
