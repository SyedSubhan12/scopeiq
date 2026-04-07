import { pgTable, uuid, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { briefs } from "./briefs.schema";
import { workspaces } from "./workspaces.schema";

export const briefAttachments = pgTable(
  "brief_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    briefId: uuid("brief_id").notNull().references(() => briefs.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    objectKey: text("object_key").notNull(),
    fileUrl: text("file_url").notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 255 }),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    briefIdx: index("idx_brief_attachments_brief").on(table.briefId),
    briefFieldIdx: index("idx_brief_attachments_brief_field").on(table.briefId, table.fieldKey),
  }),
);

export type BriefAttachment = typeof briefAttachments.$inferSelect;
export type NewBriefAttachment = typeof briefAttachments.$inferInsert;
