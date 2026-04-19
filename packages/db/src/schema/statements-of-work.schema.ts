import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { workspaces } from './workspaces.schema';

export type SowStatus = 'draft' | 'parsed' | 'active' | 'archived';

export const statementsOfWork = pgTable(
  "statements_of_work",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    title: varchar("title", { length: 255 }).notNull(),
    status: text("status").$type<SowStatus>().notNull().default("draft"),
    fileUrl: text("file_url"),
    fileKey: varchar("file_key", { length: 512 }),
    fileSizeBytes: integer("file_size_bytes"),
    parsedTextPreview: text("parsed_text_preview"),
    parsingResultJson: jsonb("parsing_result_json"),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceIdx: index("idx_sow_workspace").on(table.workspaceId),
  }),
);

export type StatementOfWork = typeof statementsOfWork.$inferSelect;
export type NewStatementOfWork = typeof statementsOfWork.$inferInsert;
