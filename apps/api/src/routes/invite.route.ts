import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { inviteService } from "../services/invite.service.js";
import { createInviteSchema, acceptInviteSchema } from "./invite.schemas.js";
import { UnauthorizedError } from "@novabots/types";

export const inviteRouter = new Hono();

// Protected: agency users managing invites
inviteRouter.post(
  "/",
  authMiddleware,
  zValidator("json", createInviteSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const userRole = c.get("userRole");

    if (userRole !== "owner" && userRole !== "admin") {
      throw new UnauthorizedError("Only owners and admins can invite team members");
    }

    const body = c.req.valid("json");
    const invitation = await inviteService.createInvite(workspaceId, userId, body);
    return c.json({ data: invitation }, 201);
  },
);

inviteRouter.get("/", authMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");
  const invitations = await inviteService.listPending(workspaceId);
  return c.json({ data: invitations });
});

inviteRouter.delete("/:id", authMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId");
  const userRole = c.get("userRole");
  const id = c.req.param("id");

  if (userRole !== "owner" && userRole !== "admin") {
    throw new UnauthorizedError("Only owners and admins can revoke invitations");
  }

  await inviteService.revokeInvite(id, workspaceId);
  return c.json({ message: "Invitation revoked" });
});

// Public: accept an invitation by token
inviteRouter.post(
  "/accept",
  zValidator("json", acceptInviteSchema),
  async (c) => {
    const body = c.req.valid("json");
    const result = await inviteService.acceptInvite(body);
    return c.json({ data: result }, 201);
  },
);
