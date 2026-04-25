import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { portalMessagesService } from "../services/portal-messages.service.js";
import { encodeCursor, decodeCursor } from "../lib/pagination.js";

const attachmentSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  size: z.number().int().positive(),
  type: z.string().min(1).max(100),
});

const sendMessageSchema = z.object({
  body: z.string().min(1).max(10_000),
  threadId: z.string().uuid().nullable().optional(),
  attachmentsJson: z.array(attachmentSchema).max(10).nullable().optional(),
  authorName: z.string().min(1).max(255).optional(),
});

const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const portalMessagesRouter = new Hono();

portalMessagesRouter.use("*", portalAuthMiddleware);

/**
 * GET /portal/messages
 * Client reads the message thread for their project.
 */
portalMessagesRouter.get(
  "/",
  zValidator("query", listMessagesSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const { cursor: rawCursor, limit } = c.req.valid("query");

    let cursorPayload: { createdAt: Date; id: string } | undefined;
    if (rawCursor) {
      const decoded = decodeCursor(rawCursor, workspaceId);
      cursorPayload = { createdAt: new Date(decoded.created_at), id: decoded.id };
    }

    const { messages, hasMore } = await portalMessagesService.list({
      projectId,
      workspaceId,
      limit,
      cursor: cursorPayload,
    });

    const lastItem = messages[messages.length - 1];
    const nextCursor =
      hasMore && lastItem != null
        ? encodeCursor({
            created_at: lastItem.createdAt.toISOString(),
            id: lastItem.id,
            workspace_id: workspaceId,
          })
        : null;

    return c.json({
      data: messages.map((m) => ({
        id: m.id,
        project_id: m.projectId,
        author_type: m.authorType,
        author_id: m.authorId,
        author_name: m.authorName,
        body: m.body,
        attachments_json: m.attachmentsJson,
        thread_id: m.threadId,
        read_at: m.readAt?.toISOString() ?? null,
        scope_check_status: m.scopeCheckStatus,
        created_at: m.createdAt.toISOString(),
      })),
      pagination: {
        next_cursor: nextCursor,
        has_more: hasMore,
      },
    });
  },
);

/**
 * POST /portal/messages
 * Client sends a message (author_type='client').
 */
portalMessagesRouter.post(
  "/",
  zValidator("json", sendMessageSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const clientId = c.get("portalClientId");
    const { body, threadId, attachmentsJson, authorName } = c.req.valid("json");

    const record = await portalMessagesService.send({
      projectId,
      workspaceId,
      authorId: clientId,
      authorName: authorName ?? null,
      authorType: "client",
      body,
      source: "portal",
      threadId: threadId ?? null,
      attachmentsJson: attachmentsJson ?? null,
    });

    return c.json(
      {
        data: {
          id: record.id,
          project_id: record.projectId,
          author_type: record.authorType,
          author_id: record.authorId,
          author_name: record.authorName,
          body: record.body,
          attachments_json: record.attachmentsJson,
          thread_id: record.threadId,
          read_at: null,
          scope_check_status: record.scopeCheckStatus,
          created_at: record.createdAt.toISOString(),
        },
      },
      201,
    );
  },
);

/**
 * POST /portal/messages/:id/read
 * Client marks an agency message as read.
 */
portalMessagesRouter.post("/:id/read", async (c) => {
  const id = c.req.param("id");
  const workspaceId = c.get("portalWorkspaceId");
  const clientId = c.get("portalClientId");

  const record = await portalMessagesService.markRead(
    id,
    workspaceId,
    clientId ?? "portal-client",
  );

  return c.json({
    data: {
      id: record.id,
      read_at: record.readAt?.toISOString() ?? null,
    },
  });
});
