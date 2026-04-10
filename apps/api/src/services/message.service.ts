import { db, writeAuditLog, messages, projects, eq, and, isNull } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";

export const messageService = {
  async ingest(
    workspaceId: string,
    projectId: string,
    actorId: string,
    data: {
      message: string;
      source: "portal" | "email_forward" | "manual_input";
      authorName?: string;
    },
  ) {
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

    return db.transaction(async (trx) => {
      const [record] = await trx
        .insert(messages)
        .values({
          workspaceId,
          projectId,
          authorId: actorId,
          authorName: data.authorName ?? null,
          source: data.source,
          body: data.message,
        })
        .returning();

      if (!record) {
        throw new Error("Failed to create message record");
      }

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "message",
        entityId: record.id,
        action: "create",
        metadata: { source: data.source, projectId },
      });

      return record;
    });
  },
};
