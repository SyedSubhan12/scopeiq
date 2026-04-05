import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { deliverableStatusEnum, deliverableTypeEnum } from './enums';
import { workspaces } from './workspaces.schema';
import { projects } from './projects.schema';

export const deliverables = pgTable(
  "deliverables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: deliverableTypeEnum("type").notNull().default("file"),
    status: deliverableStatusEnum("status").notNull().default("draft"),
    fileUrl: text("file_url"),
    fileKey: varchar("file_key", { length: 512 }),
    fileSizeBytes: integer("file_size_bytes"),
    mimeType: varchar("mime_type", { length: 255 }),
    externalUrl: text("external_url"),
    revisionRound: integer("revision_round").notNull().default(0),
    maxRevisions: integer("max_revisions").notNull().default(3),
    currentRevisionId: uuid("current_revision_id"),
    originalName: varchar("original_name", { length: 255 }),
    metadata: jsonb("metadata"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    uploadedBy: uuid("uploaded_by"),
    reviewStartedAt: timestamp("review_started_at", { withTimezone: true }),
    aiFeedbackSummary: jsonb("ai_feedback_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    projectIdx: index("idx_deliverables_project").on(table.projectId),
    workspaceStatusIdx: index("idx_deliverables_workspace_status").on(
      table.workspaceId,
      table.status,
    ),
  }),
);

export type Deliverable = typeof deliverables.$inferSelect;
export type NewDeliverable = typeof deliverables.$inferInsert;
