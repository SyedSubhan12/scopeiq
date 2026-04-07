import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { workspaces } from './workspaces.schema';

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  portalToken: varchar("portal_token", { length: 64 }).unique(),
  portalTokenHash: varchar("portal_token_hash", { length: 64 }),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  requiresEmailAuth: boolean("requires_email_auth").default(false),
  logoUrl: text("logo_url"),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  portalTokenIdx: index("idx_clients_portal_token").on(table.portalToken),
}));

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
