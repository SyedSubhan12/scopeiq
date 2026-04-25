import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { messageSourceEnum, messageStatusEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';

export interface MessageAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    authorId: uuid("author_id"),
    authorName: text("author_name"),
    source: messageSourceEnum("source").notNull(),
    status: messageStatusEnum("status").notNull().default("pending_check"),
    body: text("body").notNull(),
    // Portal Tier 1 columns
    authorType: text("author_type").notNull().default("agency"),
    readAt: timestamp("read_at", { withTimezone: true }),
    threadId: text("thread_id"),
    attachmentsJson: jsonb("attachments_json").$type<MessageAttachment[]>(),
    scopeCheckStatus: text("scope_check_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_messages_project").on(table.projectId),
    workspaceIdx: index("idx_messages_workspace").on(table.workspaceId),
    statusIdx: index("idx_messages_status").on(table.status),
    createdIdx: index("idx_messages_created").on(table.projectId, table.createdAt),
    threadIdx: index("idx_messages_thread").on(table.threadId),
    readAtIdx: index("idx_messages_read_at").on(table.readAt),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
