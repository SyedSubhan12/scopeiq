import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { auditActionEnum } from './enums';
import { workspaces } from './workspaces.schema';

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    actorId: uuid("actor_id"),
    actorType: varchar("actor_type", { length: 20 }).notNull().default("user"),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: auditActionEnum("action").notNull(),
    metadataJson: jsonb("metadata_json").default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("idx_audit_log_workspace").on(table.workspaceId),
    entityIdx: index("idx_audit_log_entity").on(table.entityType, table.entityId),
    createdIdx: index("idx_audit_log_created").on(table.workspaceId, table.createdAt),
  }),
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
