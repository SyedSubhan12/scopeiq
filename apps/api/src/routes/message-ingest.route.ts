import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { db, projects, messages, eq, and, isNull } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";

const ingestMessageSchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  source: z.enum(["portal", "email_forward", "manual_input"]),
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

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    const [messageRecord] = await db
      .insert(messages)
      .values({
        workspaceId,
        projectId,
        authorId: userId,
        authorName: authorName ?? null,
        source,
        body: message,
      })
      .returning();

    if (!messageRecord) {
      throw new ValidationError("Failed to create message record");
    }

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
