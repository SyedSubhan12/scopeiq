import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { reminderStepEnum } from './enums';
import { deliverables } from './deliverables.schema';

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    step: reminderStepEnum("step").notNull(),
    recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    deliverableIdx: index("idx_reminder_logs_deliverable").on(table.deliverableId),
  }),
);

export type ReminderLog = typeof reminderLogs.$inferSelect;
export type NewReminderLog = typeof reminderLogs.$inferInsert;
