import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { auditLogService } from "../services/audit-log.service.js";

export const auditLogRouter = new Hono();

auditLogRouter.use("*", authMiddleware);

auditLogRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userRole = c.get("userRole");
  const entityType = c.req.query("entityType");
  const entityId = c.req.query("entityId");
  const cursor = c.req.query("cursor");
  const limit = c.req.query("limit");

  const result = await auditLogService.listAuditLog(workspaceId, userRole, {
    entityType: entityType ?? undefined,
    entityId: entityId ?? undefined,
    cursor: cursor ?? undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  return c.json(result);
});
