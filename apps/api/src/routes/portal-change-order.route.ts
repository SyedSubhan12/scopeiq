import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { changeOrderService } from "../services/change-order.service.js";
import { NotFoundError } from "@novabots/types";

export const portalChangeOrderRouter = new Hono();

portalChangeOrderRouter.use("*", portalAuthMiddleware);

// List change orders for this portal project
portalChangeOrderRouter.get("", async (c) => {
  const workspaceId = c.get("portalWorkspaceId");
  const projectId = c.get("portalProjectId");
  const result = await changeOrderService.list(workspaceId, projectId);
  return c.json({ data: result.data });
});

// Get a single change order (validate it belongs to this portal's project)
portalChangeOrderRouter.get("/:id", async (c) => {
  const workspaceId = c.get("portalWorkspaceId");
  const projectId = c.get("portalProjectId");
  const id = c.req.param("id");

  const co = await changeOrderService.getById(workspaceId, id);
  if (co.projectId !== projectId) throw new NotFoundError("ChangeOrder", id);
  return c.json({ data: co });
});

const acceptSchema = z.object({
  signatureName: z.string().min(1).max(200),
});

portalChangeOrderRouter.post(
  "/:id/accept",
  zValidator("json", acceptSchema),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const projectId = c.get("portalProjectId");
    const id = c.req.param("id");
    const { signatureName } = c.req.valid("json");

    const co = await changeOrderService.getById(workspaceId, id);
    if (co.projectId !== projectId) throw new NotFoundError("ChangeOrder", id);
    if (co.status !== "sent") {
      return c.json({ error: "Change order is not in a state that can be accepted" }, 400);
    }

    const updated = await changeOrderService.update(workspaceId, id, co.createdBy ?? "portal", {
      status: "accepted",
    });

    return c.json({ data: updated });
  },
);

const declineSchema = z.object({
  reason: z.string().max(2000).optional(),
});

portalChangeOrderRouter.post(
  "/:id/decline",
  zValidator("json", declineSchema),
  async (c) => {
    const workspaceId = c.get("portalWorkspaceId");
    const projectId = c.get("portalProjectId");
    const id = c.req.param("id");
    const { reason } = c.req.valid("json");

    const co = await changeOrderService.getById(workspaceId, id);
    if (co.projectId !== projectId) throw new NotFoundError("ChangeOrder", id);
    if (co.status !== "sent") {
      return c.json({ error: "Change order is not in a state that can be declined" }, 400);
    }

    const updated = await changeOrderService.update(workspaceId, id, co.createdBy ?? "portal", {
      status: "declined",
    });

    return c.json({ data: updated });
  },
);
