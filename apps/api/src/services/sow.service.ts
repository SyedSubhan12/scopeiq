import { db, writeAuditLog, projects, statementsOfWork, sowClauses, eq, and, isNull, gt, desc } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { dispatchParseSowJob } from "../jobs/parse-sow.job.js";
import type { ClauseType } from "@novabots/db";

interface CreateSowInput {
  projectId: string;
  title: string;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileSizeBytes?: number | null;
  rawText?: string | null;
}

interface UpdateSowInput {
  title?: string;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileSizeBytes?: number | null;
}

interface ActivateSowInput {
  clauses: Array<{
    clauseType: ClauseType;
    originalText: string;
    summary?: string | null;
    sortOrder?: number;
  }>;
}

export const sowService = {
  async create(workspaceId: string, actorId: string, data: CreateSowInput) {
    const [project] = await db
      .select({ id: projects.id, sowId: projects.sowId })
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError("Project", data.projectId);
    }

    return db.transaction(async (trx) => {
      const [sow] = await trx
        .insert(statementsOfWork)
        .values({
          workspaceId,
          title: data.title,
          fileUrl: data.fileUrl ?? null,
          fileKey: data.fileKey ?? null,
          fileSizeBytes: data.fileSizeBytes ?? null,
          parsedTextPreview: data.rawText ? data.rawText.slice(0, 500) : null,
        })
        .returning();

      if (!sow) {
        throw new ValidationError("Failed to create SOW");
      }

      if (data.rawText && data.rawText.length > 0) {
        const paragraphs = data.rawText
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter((p) => p.length > 10);

        if (paragraphs.length > 0) {
          await trx.insert(sowClauses).values(
            paragraphs.map((text, i) => ({
              sowId: sow.id,
              clauseType: "other" as ClauseType,
              originalText: text,
              summary: null,
              sortOrder: i,
            })),
          );
        }
      }

      await trx
        .update(projects)
        .set({ sowId: sow.id, updatedAt: new Date() })
        .where(eq(projects.id, data.projectId));

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sow.id,
        action: "create",
        metadata: { projectId: data.projectId, title: data.title },
      });

      const clauses = await trx
        .select()
        .from(sowClauses)
        .where(eq(sowClauses.sowId, sow.id))
        .orderBy(sowClauses.sortOrder);

      // Dispatch parse job outside the transaction (best-effort background task)
      if (data.rawText && data.rawText.length > 0) {
        dispatchParseSowJob(sow.id, data.projectId, data.rawText).catch((err) =>
          console.error("[SOW] Failed to dispatch parse-sow job:", err),
        );
      }

      return { ...sow, clauses };
    });
  },

  async uploadAndParse(
    workspaceId: string,
    actorId: string,
    data: { projectId: string; title: string; fileUrl: string; fileKey: string; fileSizeBytes: number },
  ) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError("Project", data.projectId);
    }

    return db.transaction(async (trx) => {
      const [sow] = await trx
        .insert(statementsOfWork)
        .values({
          workspaceId,
          title: data.title,
          fileUrl: data.fileUrl,
          fileKey: data.fileKey,
          fileSizeBytes: data.fileSizeBytes,
        })
        .returning();

      if (!sow) {
        throw new ValidationError("Failed to create SOW");
      }

      await trx
        .update(projects)
        .set({ sowId: sow.id, updatedAt: new Date() })
        .where(eq(projects.id, data.projectId));

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sow.id,
        action: "create",
        metadata: { projectId: data.projectId, fileUrl: data.fileUrl },
      });

      // Dispatch parse job outside the transaction (best-effort background task)
      dispatchParseSowJob(sow.id, data.projectId, "").catch((err) =>
        console.error("[SOW] Failed to dispatch parse-sow job:", err),
      );

      return sow;
    });
  },

  async activateSow(
    workspaceId: string,
    actorId: string,
    sowId: string,
    data: ActivateSowInput,
  ) {
    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    return db.transaction(async (trx) => {
      await trx.delete(sowClauses).where(eq(sowClauses.sowId, sowId));

      if (data.clauses.length > 0) {
        await trx.insert(sowClauses).values(
          data.clauses.map((clause, i) => ({
            sowId: sowId,
            clauseType: clause.clauseType,
            originalText: clause.originalText,
            summary: clause.summary ?? null,
            sortOrder: clause.sortOrder ?? i,
          })),
        );
      }

      await trx
        .update(statementsOfWork)
        .set({ parsedAt: new Date(), updatedAt: new Date() })
        .where(eq(statementsOfWork.id, sowId));

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sowId,
        action: "update",
        metadata: { action: "activate", clauseCount: data.clauses.length },
      });

      const clauses = await trx
        .select()
        .from(sowClauses)
        .where(eq(sowClauses.sowId, sowId))
        .orderBy(sowClauses.sortOrder);

      return { ...sow, clauses, parsedAt: new Date() };
    });
  },

  async getById(workspaceId: string, sowId: string) {
    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sow.id))
      .orderBy(sowClauses.sortOrder);

    return { ...sow, clauses };
  },

  async getByProjectId(workspaceId: string, projectId: string) {
    const [project] = await db
      .select({ id: projects.id, sowId: projects.sowId })
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

    if (!project.sowId) return null;

    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, project.sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) return null;

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sow.id))
      .orderBy(sowClauses.sortOrder);

    return { ...sow, clauses };
  },

  async listByWorkspace(workspaceId: string, options: { cursor?: string; limit?: number }) {
    const limit = options.limit ?? 20;
    const cursorCondition = options.cursor ? gt(statementsOfWork.id, options.cursor) : undefined;

    const results = await db
      .select()
      .from(statementsOfWork)
      .where(
        cursorCondition
          ? and(
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
            cursorCondition,
          )
          : and(
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
      )
      .orderBy(desc(statementsOfWork.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1]!.id : null,
        has_more: hasMore,
      },
    };
  },

  async update(workspaceId: string, actorId: string, sowId: string, data: UpdateSowInput) {
    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    return db.transaction(async (trx) => {
      const [updated] = await trx
        .update(statementsOfWork)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(statementsOfWork.id, sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new ValidationError("Failed to update SOW");
      }

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sowId,
        action: "update",
        metadata: { fields: Object.keys(data) },
      });

      return updated;
    });
  },

  async delete(workspaceId: string, actorId: string, sowId: string) {
    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    return db.transaction(async (trx) => {
      const [deleted] = await trx
        .update(statementsOfWork)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(statementsOfWork.id, sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .returning();

      if (!deleted) {
        throw new ValidationError("Failed to delete SOW");
      }

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sowId,
        action: "delete",
      });

      return deleted;
    });
  },

  async updateClauses(
    workspaceId: string,
    actorId: string,
    sowId: string,
    clauses: Array<{
      clauseType: ClauseType;
      originalText: string;
      summary?: string | null;
      sortOrder?: number;
    }>,
  ) {
    const sow = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    return db.transaction(async (trx) => {
      await trx.delete(sowClauses).where(eq(sowClauses.sowId, sowId));

      if (clauses.length > 0) {
        await trx.insert(sowClauses).values(
          clauses.map((clause, i) => ({
            sowId: sowId,
            clauseType: clause.clauseType,
            originalText: clause.originalText,
            summary: clause.summary ?? null,
            sortOrder: clause.sortOrder ?? i,
          })),
        );
      }

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "statement_of_work",
        entityId: sowId,
        action: "update",
        metadata: { action: "update_clauses", clauseCount: clauses.length },
      });

      const updated = await trx
        .select()
        .from(sowClauses)
        .where(eq(sowClauses.sowId, sowId))
        .orderBy(sowClauses.sortOrder);

      return updated;
    });
  },
};
