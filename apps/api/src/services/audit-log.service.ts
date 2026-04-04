import { auditLogRepository } from "../repositories/audit-log.repository.js";
import { ForbiddenError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

export const auditLogService = {
  async listAuditLog(
    workspaceId: string,
    userRole: string,
    options: Record<string, unknown>,
  ) {
    if (userRole !== "owner" && userRole !== "admin") {
      throw new ForbiddenError("Only admins can view audit logs");
    }
    const clean = stripUndefined(options) as {
      entityType?: string;
      entityId?: string;
      cursor?: string;
      limit?: number;
    };
    return auditLogRepository.list(workspaceId, clean);
  },
};
