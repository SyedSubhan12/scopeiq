import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { analyticsService } from "../services/analytics.service.js";

export const analyticsRouter = new Hono();

analyticsRouter.use("*", authMiddleware);

analyticsRouter.get("/portfolio", async (c) => {
    const workspaceId = c.get("workspaceId");
    const stats = await analyticsService.getPortfolioStats(workspaceId);
    return c.json({ data: stats });
});

analyticsRouter.get("/projects/:id/health", async (c) => {
    const workspaceId = c.get("workspaceId");
    const projectId = c.req.param("id");
    const health = await analyticsService.getProjectHealth(workspaceId, projectId);
    return c.json({ data: health });
});

analyticsRouter.get("/workspace/timeline", async (c) => {
    const workspaceId = c.get("workspaceId");
    const timeline = await analyticsService.getWorkspaceTimeline(workspaceId);
    return c.json({ data: timeline });
});
