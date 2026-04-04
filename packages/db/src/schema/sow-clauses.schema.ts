import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { clauseTypeEnum } from './enums';
import { statementsOfWork } from './statements-of-work.schema';

export const sowClauses = pgTable(
  "sow_clauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sowId: uuid("sow_id").notNull().references(() => statementsOfWork.id, { onDelete: "cascade" }),
    clauseType: clauseTypeEnum("clause_type").notNull(),
    originalText: text("original_text").notNull(),
    summary: text("summary"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sowIdx: index("idx_sow_clauses_sow").on(table.sowId),
  }),
);

export type SowClause = typeof sowClauses.$inferSelect;
export type NewSowClause = typeof sowClauses.$inferInsert;
