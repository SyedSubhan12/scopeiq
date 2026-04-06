import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { messageSourceEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    authorId: uuid("author_id"),
    authorName: text("author_name"),
    source: messageSourceEnum("source").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_messages_project").on(table.projectId),
    workspaceIdx: index("idx_messages_workspace").on(table.workspaceId),
    createdIdx: index("idx_messages_created").on(table.projectId, table.createdAt),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
