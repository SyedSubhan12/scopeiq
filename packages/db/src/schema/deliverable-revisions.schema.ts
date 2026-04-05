import { pgTable, uuid, varchar, text, timestamp, integer, foreignKey } from "drizzle-orm/pg-core";
import { deliverables } from "./deliverables.schema";
import { users } from "./users.schema";

export const deliverableRevisions = pgTable(
    "deliverable_revisions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        deliverableId: uuid("deliverable_id")
            .notNull()
            .references(() => deliverables.id, { onDelete: "cascade" }),
        versionNumber: integer("version_number").notNull(),
        fileUrl: text("file_url").notNull(),
        notes: text("notes"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: uuid("created_by").references(() => users.id),
    }
);

export type DeliverableRevision = typeof deliverableRevisions.$inferSelect;
export type NewDeliverableRevision = typeof deliverableRevisions.$inferInsert;
