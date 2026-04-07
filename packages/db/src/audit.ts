import { auditLog } from "./schema/audit-log.schema.js";
import type { AuditAction } from "./schema/enums.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";

interface AuditLogParams {
  workspaceId: string;
  actorId: string | null;
  actorType?: "user" | "system" | "client";
  entityType: string;
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Accepts both NodePgDatabase (from drizzle()) and PgTransaction (from db.transaction())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseDriver = NodePgDatabase<any> | PgTransaction<NodePgQueryResultHKT, any, any>;

export async function writeAuditLog(
  trx: DatabaseDriver,
  params: AuditLogParams,
): Promise<void> {
  await trx.insert(auditLog).values({
    workspaceId: params.workspaceId,
    actorId: params.actorId,
    actorType: params.actorType ?? "user",
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    metadataJson: params.metadata ?? {},
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  });
}
