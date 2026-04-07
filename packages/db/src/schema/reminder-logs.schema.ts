import { pgTable, uuid, varchar, timestamp, index, integer } from "drizzle-orm/pg-core";
import { reminderStepEnum } from './enums';
import { deliverables } from './deliverables.schema';
import { projects } from './projects.schema';

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    sequenceStep: integer("sequence_step").notNull(),
    step: reminderStepEnum("step").notNull(),
    recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    deliveryStatus: varchar("delivery_status", { length: 50 }).default("pending"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
  },
  (table) => ({
    deliverableIdx: index("idx_reminder_logs_deliverable").on(table.deliverableId),
    projectIdx: index("idx_reminder_logs_project").on(table.projectId),
    stepIdx: index("idx_reminder_logs_step").on(table.deliverableId, table.sequenceStep),
  }),
);

export type ReminderLog = typeof reminderLogs.$inferSelect;
export type NewReminderLog = typeof reminderLogs.$inferInsert;
