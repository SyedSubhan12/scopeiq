import { auditLog } from "./schema/audit-log.schema.js";
import type { AuditAction } from "./schema/enums.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

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

export async function writeAuditLog(
  trx: NodePgDatabase<Record<string, unknown>>,
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
