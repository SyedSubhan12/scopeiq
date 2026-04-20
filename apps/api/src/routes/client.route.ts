import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { clientService } from "../services/client.service.js";
import { createClientSchema, updateClientSchema } from "./client.schemas.js";

export const clientRouter = new Hono();

clientRouter.use("*", authMiddleware);

// Validate UUID in path parameters
const uuidParamSchema = z.object({ id: z.string().uuid() });

clientRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const cursor = c.req.query("cursor");
  const limit = c.req.query("limit");
  const result = await clientService.listClients(workspaceId, {
    cursor: cursor ?? undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });
  return c.json(result);
});

clientRouter.post("/", zValidator("json", createClientSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const client = await clientService.createClient(workspaceId, userId, body);
  return c.json({ data: client }, 201);
});

clientRouter.get("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const clientId = c.req.param("id");
  const client = await clientService.getClient(workspaceId, clientId);
  return c.json({ data: client });
});

clientRouter.patch("/:id", zValidator("param", uuidParamSchema), zValidator("json", updateClientSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const clientId = c.req.param("id");
  const body = c.req.valid("json");
  const client = await clientService.updateClient(workspaceId, clientId, userId, body);
  return c.json({ data: client });
});

clientRouter.delete("/:id", zValidator("param", uuidParamSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const clientId = c.req.param("id");
  await clientService.deleteClient(workspaceId, clientId, userId);
  return c.json({ data: { success: true } });
});
