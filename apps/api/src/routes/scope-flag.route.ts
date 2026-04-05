import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { scopeFlagService } from "../services/scope-flag.service.js";

export const scopeFlagRouter = new Hono();

scopeFlagRouter.use("*", authMiddleware);

scopeFlagRouter.get("/", async (c) => {
    const workspaceId = c.get("workspaceId");
    const projectId = c.req.query("projectId");
    const result = await scopeFlagService.list(workspaceId, projectId ?? undefined);
    return c.json(result);
});

scopeFlagRouter.get("/count", async (c) => {
    const workspaceId = c.get("workspaceId");
    const count = await scopeFlagService.countPending(workspaceId);
    return c.json({ data: { count } });
});

scopeFlagRouter.get("/:id", async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const flag = await scopeFlagService.getById(workspaceId, id);
    return c.json({ data: flag });
});

const updateStatusSchema = z.object({
    status: z.enum(["confirmed", "dismissed", "snoozed", "change_order_sent", "resolved"]),
    reason: z.string().optional(),
});

scopeFlagRouter.patch(
    "/:id",
    zValidator("json", updateStatusSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const id = c.req.param("id");
        const { status, reason } = c.req.valid("json");
        const updated = await scopeFlagService.updateStatus(workspaceId, id, userId, { status, reason });
        return c.json({ data: updated });
    },
);
