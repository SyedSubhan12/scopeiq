import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { auditLogRepository } from "../repositories/audit-log.repository.js";

export const notificationRouter = new Hono();

notificationRouter.use("*", authMiddleware);

/** GET /notifications — recent workspace activity as notifications */
notificationRouter.get("/", async (c) => {
    const workspaceId = c.get("workspaceId");
    const limit = c.req.query("limit");

    const result = await auditLogRepository.list(workspaceId, {
        limit: limit ? parseInt(limit, 10) : 20,
    });

    return c.json(result);
});
