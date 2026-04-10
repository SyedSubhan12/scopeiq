import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { messageService } from "../services/message.service.js";
import { ValidationError } from "@novabots/types";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";

const ingestMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  source: z.enum(["portal", "email_forward", "manual_input"]),
  authorName: z.string().min(1).max(255).optional(),
});

const manualMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  authorName: z.string().min(1).max(255).optional(),
});

export const messageIngestRouter = new Hono();

messageIngestRouter.use("*", authMiddleware);

messageIngestRouter.post(
  "/ingest",
  zValidator("json", ingestMessageSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const { projectId, message, source, authorName } = c.req.valid("json");

    const messageRecord = await messageService.ingest(workspaceId, projectId, userId, {
      message,
      source,
      authorName,
    });

    let scopeCheckDispatched = false;
    try {
      await dispatchCheckScopeJob(messageRecord.id, projectId, workspaceId);
      scopeCheckDispatched = true;
    } catch (err) {
      console.error("[MessageIngest] Failed to dispatch scope check job:", err);
    }

    return c.json(
      {
        data: {
          messageId: messageRecord.id,
          scopeCheckDispatched,
        },
      },
      201,
    );
  },
);

messageIngestRouter.post("/inbound", authMiddleware, zValidator("json", ingestMessageSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const { projectId, message, authorName } = c.req.valid("json");

  const messageRecord = await messageService.ingest(workspaceId, projectId, userId, {
    message,
    source: "email_forward",
    authorName,
  });

  let scopeCheckDispatched = false;
  try {
    await dispatchCheckScopeJob(messageRecord.id, projectId, workspaceId);
    scopeCheckDispatched = true;
  } catch (err) {
    console.error("[MessageIngest/inbound] Failed to dispatch scope check job:", err);
  }

  return c.json(
    {
      data: {
        messageId: messageRecord.id,
        scopeCheckDispatched,
      },
    },
    201,
  );
});

messageIngestRouter.post(
  "/manual",
  authMiddleware,
  zValidator("json", manualMessageSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const { projectId, message, authorName } = c.req.valid("json");

    const messageRecord = await messageService.ingest(workspaceId, projectId, userId, {
      message,
      source: "manual_input",
      authorName,
    });

    let scopeCheckDispatched = false;
    try {
      await dispatchCheckScopeJob(messageRecord.id, projectId, workspaceId);
      scopeCheckDispatched = true;
    } catch (err) {
      console.error("[MessageIngest/manual] Failed to dispatch scope check job:", err);
    }

    return c.json(
      {
        data: {
          messageId: messageRecord.id,
          scopeCheckDispatched,
        },
      },
      201,
    );
  },
);
