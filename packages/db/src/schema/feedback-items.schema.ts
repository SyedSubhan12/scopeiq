import { pgTable, uuid, text, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { messageSourceEnum } from './enums';
import { deliverables } from './deliverables.schema';

export const feedbackItems = pgTable(
  "feedback_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => feedbackItems.id, { onDelete: "cascade" }),
    authorId: uuid("author_id"),
    authorName: text("author_name"),
    source: messageSourceEnum("source").notNull().default("portal"),
    body: text("body").notNull(),
    annotationJson: jsonb("annotation_json"),
    pageNumber: integer("page_number"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    deliverableIdx: index("idx_feedback_items_deliverable").on(table.deliverableId),
    parentIdx: index("idx_feedback_items_parent").on(table.parentId),
  }),
);

export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type NewFeedbackItem = typeof feedbackItems.$inferInsert;
