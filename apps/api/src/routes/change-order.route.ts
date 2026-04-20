import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { changeOrderService } from "../services/change-order.service.js";
import { projectRepository } from "../repositories/project.repository.js";
import { generateChangeOrderDiffPdf } from "../lib/change-order-diff-pdf.js";
import { NotFoundError, ValidationError } from "@novabots/types";
import {
    createChangeOrderSchema,
    updateChangeOrderSchema,
    changeOrderResponseSchema,
    serializeChangeOrder,
} from "./change-order.schemas.js";

export const changeOrderRouter = new Hono();

changeOrderRouter.use("*", authMiddleware);

const uuidParamSchema = z.object({ id: z.string().uuid() });

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

// Specific routes before generic /:id
changeOrderRouter.get("/:id/diff-pdf", zValidator("param", uuidParamSchema), async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const compareId = c.req.query("compare");
    if (!compareId) {
        throw new ValidationError("Query param 'compare' (change-order id) is required");
    }

    const [after, before] = await Promise.all([
        changeOrderService.getById(workspaceId, id),
        changeOrderService.getById(workspaceId, compareId),
    ]);

    if (after.projectId !== before.projectId) {
        throw new ValidationError("Both change orders must belong to the same project");
    }

    const project = await projectRepository.getById(workspaceId, after.projectId);
    if (!project) throw new NotFoundError("Project", after.projectId);

    const toItems = (raw: unknown) =>
        Array.isArray(raw)
            ? raw
                  .filter((i): i is Record<string, unknown> => i !== null && typeof i === "object")
                  .map((i) => ({
                      name: String(i.name ?? ""),
                      quantity: typeof i.quantity === "number" ? i.quantity : null,
                      unitPrice: typeof i.unitPrice === "number" ? i.unitPrice : null,
                  }))
            : [];

    const sumTotal = (raw: unknown) => {
        if (raw && typeof raw === "object" && "total" in raw) {
            const t = (raw as { total: unknown }).total;
            return typeof t === "number" ? t : 0;
        }
        return 0;
    };

    const bytes = await generateChangeOrderDiffPdf({
        projectName: project.name,
        before: {
            label: `CO ${compareId.slice(0, 8)}`,
            scopeItems: toItems(before.scopeItemsJson),
            total: sumTotal(before.pricing),
        },
        after: {
            label: `CO ${id.slice(0, 8)}`,
            scopeItems: toItems(after.scopeItemsJson),
            total: sumTotal(after.pricing),
        },
    });

    return new Response(bytes as unknown as BodyInit, {
        status: 200,
        headers: {
            "content-type": "application/pdf",
            "content-disposition": `inline; filename="change-order-diff-${id.slice(0, 8)}.pdf"`,
        },
    });
});

changeOrderRouter.get("/:id/signed-pdf", zValidator("param", uuidParamSchema), async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const result = await changeOrderService.getSignedPdfUrl(workspaceId, id);
    return c.json({ data: result });
});

// Generic /:id route after specific sub-routes
changeOrderRouter.get("/:id", zValidator("param", uuidParamSchema), async (c) => {
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
    zValidator("param", uuidParamSchema),
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
