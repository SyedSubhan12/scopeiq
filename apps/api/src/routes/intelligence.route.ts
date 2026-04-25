import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { searchProjectIntelligence } from "../repositories/project-intelligence.repository.js";

export const intelligenceRouter = new Hono();

intelligenceRouter.use("*", authMiddleware);

const searchQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  clientId: z.string().optional(),
  q: z.string().max(200).optional(),
  eventType: z.string().optional(),
  cursor: z.string().optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

intelligenceRouter.get(
  "/",
  zValidator("query", searchQuerySchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const { projectId, clientId, q, eventType, cursor, limit } =
      c.req.valid("query");

    const searchParams: Parameters<typeof searchProjectIntelligence>[0] = {
      workspaceId,
      cursor: cursor ?? null,
      limit,
    };
    if (projectId !== undefined) searchParams.projectId = projectId;
    if (clientId !== undefined) searchParams.clientId = clientId;
    if (q !== undefined) searchParams.query = q;
    if (eventType !== undefined) searchParams.eventType = eventType;

    const result = await searchProjectIntelligence(searchParams);

    return c.json({
      data: result.data,
      pagination: {
        next_cursor: result.nextCursor,
        has_more: result.nextCursor !== null,
      },
    });
  },
);
