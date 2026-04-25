import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { clientService } from "../services/client.service.js";
import { createClientSchema, updateClientSchema } from "./client.schemas.js";
import { getClientHistory } from "../repositories/project-intelligence.repository.js";

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

const clientHistoryQuerySchema = z.object({
  cursor: z.string().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

clientRouter.get(
  "/:id/history",
  zValidator("param", uuidParamSchema),
  zValidator("query", clientHistoryQuerySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const clientId = c.req.param("id");
    const { cursor, limit } = c.req.valid("query");

    const result = await getClientHistory({
      workspaceId,
      clientId,
      cursor: cursor ?? null,
      limit,
    });

    return c.json({
      data: result.data,
      pagination: {
        next_cursor: result.nextCursor,
        has_more: result.nextCursor !== null,
      },
    });
  },
);

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
