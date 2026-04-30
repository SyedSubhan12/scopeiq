import { pgTable, uuid, text, timestamp, integer, real, boolean, index } from "drizzle-orm/pg-core";
import { clauseTypeEnum } from './enums';
import { statementsOfWork } from './statements-of-work.schema';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const sowClauses = pgTable(
  "sow_clauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sowId: uuid("sow_id").notNull().references(() => statementsOfWork.id, { onDelete: "cascade" }),
    clauseType: clauseTypeEnum("clause_type").notNull(),
    originalText: text("original_text").notNull(),
    summary: text("summary"),
    sortOrder: integer("sort_order").notNull().default(0),
    // Confidence fields added in migration 20260425000004
    confidenceScore: real("confidence_score"),
    confidenceLevel: text("confidence_level").$type<ConfidenceLevel>(),
    rawTextSource: text("raw_text_source"),
    pageNumber: integer("page_number"),
    requiresHumanReview: boolean("requires_human_review").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sowIdx: index("idx_sow_clauses_sow").on(table.sowId),
    reviewIdx: index("idx_sow_clauses_review").on(table.requiresHumanReview),
  }),
);

export type SowClause = typeof sowClauses.$inferSelect;
export type NewSowClause = typeof sowClauses.$inferInsert;
