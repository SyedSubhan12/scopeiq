import { db, writeAuditLog, projects, eq, and, isNull } from "@novabots/db";
import type { MessageAttachment } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import {
  messageRepository,
  type ListMessagesOptions,
  type MessageRow,
} from "../repositories/message.repository.js";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";

export interface SendMessageInput {
  projectId: string;
  workspaceId: string;
  authorId: string | null;
  authorName: string | null;
  authorType: "agency" | "client";
  body: string;
  source: "portal" | "email_forward" | "manual_input";
  threadId?: string | null;
  attachmentsJson?: MessageAttachment[] | null;
}

async function assertProjectBelongsToWorkspace(
  projectId: string,
  workspaceId: string,
): Promise<void> {
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
}

export const portalMessagesService = {
  async list(opts: ListMessagesOptions): Promise<{ messages: MessageRow[]; hasMore: boolean }> {
    await assertProjectBelongsToWorkspace(opts.projectId, opts.workspaceId);
    const rows = await messageRepository.list(opts);
    const hasMore = rows.length > opts.limit;
    return { messages: hasMore ? rows.slice(0, opts.limit) : rows, hasMore };
  },

  async send(input: SendMessageInput): Promise<MessageRow> {
    await assertProjectBelongsToWorkspace(input.projectId, input.workspaceId);

    const record = await db.transaction(async (trx) => {
      const row = await messageRepository.create({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        authorId: input.authorId,
        authorName: input.authorName,
        authorType: input.authorType,
        body: input.body,
        source: input.source,
        threadId: input.threadId ?? null,
        attachmentsJson: input.attachmentsJson ?? null,
      });

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId: input.workspaceId,
        actorId: input.authorId ?? "portal-client",
        entityType: "message",
        entityId: row.id,
        action: "create",
        metadata: {
          source: input.source,
          projectId: input.projectId,
          authorType: input.authorType,
        },
      });

      return row;
    });

    // Dispatch scope check job for client messages only — don't fire for agency replies
    if (input.authorType === "client") {
      try {
        await dispatchCheckScopeJob(
          record.id,
          input.projectId,
          input.workspaceId,
          input.body,
          input.authorId ?? "portal-client",
        );
      } catch (err) {
        console.error("[PortalMessages] Failed to dispatch scope check job:", err);
      }
    }

    return record;
  },

  async markRead(
    id: string,
    workspaceId: string,
    projectId: string,
    actorId: string,
  ): Promise<MessageRow> {
    // findById scopes by workspaceId AND projectId — a client of project A cannot
    // find (and therefore cannot mark read) a message that belongs to project B,
    // even within the same workspace.
    const existing = await messageRepository.findById(id, workspaceId, projectId);
    if (!existing) {
      // Return a generic 404 regardless of whether the message exists in another
      // project — do not leak cross-project existence information.
      throw new NotFoundError("Message", id);
    }

    // Already read — return as-is (idempotent)
    if (existing.readAt != null) {
      return existing;
    }

    const updated = await db.transaction(async (trx) => {
      const row = await messageRepository.markRead(id, workspaceId, projectId);
      if (!row) {
        return existing;
      }

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "message",
        entityId: id,
        action: "update",
        metadata: { action: "mark_read" },
      });

      return row;
    });

    return updated;
  },
};
