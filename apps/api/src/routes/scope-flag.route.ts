import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { scopeFlagService } from "../services/scope-flag.service.js";
import { dispatchGenerateChangeOrderJob } from "../jobs/generate-change-order.job.js";
import { NotFoundError } from "@novabots/types";

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
    return c.json(scopeFlagResponseSchema.parse({ data: flag }));
});

scopeFlagRouter.patch(
    "/:id",
    zValidator("json", updateScopeFlagSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const id = c.req.param("id");
        const { status, reason } = c.req.valid("json");
        const updated = await scopeFlagService.updateStatus(workspaceId, id, userId, { status, reason });
        return c.json(scopeFlagResponseSchema.parse({ data: updated }));
    },
);

scopeFlagRouter.post("/:id/generate-change-order", authMiddleware, async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");

    const flag = await scopeFlagService.getById(workspaceId, id);
    if (!flag) throw new NotFoundError("Scope flag not found", id);

    await dispatchGenerateChangeOrderJob(id, workspaceId);

    return c.json({ data: { dispatched: true } });
});
