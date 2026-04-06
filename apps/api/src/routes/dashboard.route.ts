import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { dashboardService } from "../services/dashboard.service.js";

export const dashboardRouter = new Hono();

dashboardRouter.use("*", authMiddleware);

/**
 * GET /v1/dashboard
 * Returns aggregated dashboard data: greeting, metrics, urgent flags,
 * recent activity, and upcoming deadlines.
 */
dashboardRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");

  const data = await dashboardService.getDashboardOverview(workspaceId, userId);

  return c.json({ data });
});
