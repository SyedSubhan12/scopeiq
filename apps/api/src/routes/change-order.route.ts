import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { changeOrderService } from "../services/change-order.service.js";
import {
    createChangeOrderSchema,
    updateChangeOrderSchema,
    changeOrderResponseSchema,
    serializeChangeOrder,
} from "./change-order.schemas.js";

export const changeOrderRouter = new Hono();

changeOrderRouter.use("*", authMiddleware);

changeOrderRouter.get("/", async (c) => {
    const workspaceId = c.get("workspaceId");
    const projectId = c.req.query("projectId");
    const result = await changeOrderService.list(workspaceId, projectId ?? undefined);
    return c.json({ data: result.data.map((co) => serializeChangeOrder(co)) });
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
    return c.json(changeOrderResponseSchema.parse({ data: serializeChangeOrder(co) }));
});

changeOrderRouter.post(
    "/",
    zValidator("json", createChangeOrderSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const body = c.req.valid("json");
        const co = await changeOrderService.create(workspaceId, userId, body);
        return c.json(changeOrderResponseSchema.parse({ data: serializeChangeOrder(co) }), 201);
    },
);

changeOrderRouter.patch(
    "/:id",
    zValidator("json", updateChangeOrderSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const id = c.req.param("id");
        const body = c.req.valid("json");
        const co = await changeOrderService.update(workspaceId, id, userId, body);
        return c.json(changeOrderResponseSchema.parse({ data: serializeChangeOrder(co) }));
    },
);

changeOrderRouter.get("/:id/signed-pdf", async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const result = await changeOrderService.getSignedPdfUrl(workspaceId, id);
    return c.json({ data: result });
});
