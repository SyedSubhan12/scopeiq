import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { planEnum } from './enums';

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: planEnum("plan").notNull().default("solo"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 7 }).default("#0F6E56"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#1D9E75"),
  brandFont: varchar("brand_font", { length: 100 }).default("Inter"),
  customDomain: varchar("custom_domain", { length: 255 }).unique(),
  reminderSettings: jsonb("reminder_settings").default({
    step1Hours: 48,
    step2Hours: 72,
    step3Hours: 48,
  }),
  settingsJson: jsonb("settings_json").default({}),
  onboardingProgress: jsonb("onboarding_progress").default({}),
  features: jsonb("features").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
