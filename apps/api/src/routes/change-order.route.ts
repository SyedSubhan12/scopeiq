import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { changeOrderService } from "../services/change-order.service.js";

export const changeOrderRouter = new Hono();

changeOrderRouter.use("*", authMiddleware);

changeOrderRouter.get("/", async (c) => {
    const workspaceId = c.get("workspaceId");
    const projectId = c.req.query("projectId");
    const result = await changeOrderService.list(workspaceId, projectId ?? undefined);
    return c.json(result);
});

changeOrderRouter.get("/count", async (c) => {
    const workspaceId = c.get("workspaceId");
    const count = await changeOrderService.countPending(workspaceId);
    return c.json({ data: { count } });
});

changeOrderRouter.get("/:id", async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const co = await changeOrderService.getById(workspaceId, id);
    return c.json({ data: co });
});

const createChangeOrderSchema = z.object({
    projectId: z.string().uuid(),
    scopeFlagId: z.string().uuid().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().int().optional(),
    lineItemsJson: z.array(z.any()).optional(),
});

changeOrderRouter.post(
    "/",
    zValidator("json", createChangeOrderSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const body = c.req.valid("json");
        const co = await changeOrderService.create(workspaceId, userId, body);
        return c.json({ data: co }, 201);
    },
);

const updateChangeOrderSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    amount: z.number().int().optional(),
    status: z.enum(["draft", "sent", "accepted", "declined", "expired"]).optional(),
});

changeOrderRouter.patch(
    "/:id",
    zValidator("json", updateChangeOrderSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const id = c.req.param("id");
        const body = c.req.valid("json");
        const co = await changeOrderService.update(workspaceId, id, userId, body);
        return c.json({ data: co });
    },
);
