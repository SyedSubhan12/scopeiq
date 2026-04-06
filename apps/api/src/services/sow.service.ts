import { db, writeAuditLog, projects, statementsOfWork, sowClauses, eq, and, isNull } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { sowRepository } from "../repositories/sow.repository.js";
import { sowClauseRepository } from "../repositories/sow-clause.repository.js";
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

    const sow = await sowRepository.create({
      workspaceId,
      title: data.title,
      fileUrl: data.fileUrl ?? null,
      fileKey: data.fileKey ?? null,
      fileSizeBytes: data.fileSizeBytes ?? null,
      parsedTextPreview: data.rawText ? data.rawText.slice(0, 500) : null,
    });

    if (data.rawText && data.rawText.length > 0) {
      const paragraphs = data.rawText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 10);

      if (paragraphs.length > 0) {
        await db.insert(sowClauses).values(
          paragraphs.map((text, i) => ({
            sowId: sow.id,
            clauseType: "other" as ClauseType,
            originalText: text,
            summary: null,
            sortOrder: i,
          })),
        );
      }

      dispatchParseSowJob(sow.id, data.projectId, data.rawText).catch((err) =>
        console.error("[SOW] Failed to dispatch parse-sow job:", err),
      );
    }

    await db
      .update(projects)
      .set({ sowId: sow.id, updatedAt: new Date() })
      .where(eq(projects.id, data.projectId));

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sow.id,
      action: "create",
      metadata: { projectId: data.projectId, title: data.title },
    });

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sow.id))
      .orderBy(sowClauses.sortOrder);

    return { ...sow, clauses };
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

    const sow = await sowRepository.create({
      workspaceId,
      title: data.title,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      fileSizeBytes: data.fileSizeBytes,
    });

    await db
      .update(projects)
      .set({ sowId: sow.id, updatedAt: new Date() })
      .where(eq(projects.id, data.projectId));

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sow.id,
      action: "create",
      metadata: { projectId: data.projectId, fileUrl: data.fileUrl },
    });

    dispatchParseSowJob(sow.id, data.projectId, "").catch((err) =>
      console.error("[SOW] Failed to dispatch parse-sow job:", err),
    );

    return sow;
  },

  async activateSow(
    workspaceId: string,
    actorId: string,
    sowId: string,
    data: ActivateSowInput,
  ) {
    const sow = await sowRepository.getById(workspaceId, sowId);
    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    await db.delete(sowClauses).where(eq(sowClauses.sowId, sowId));

    if (data.clauses.length > 0) {
      await db.insert(sowClauses).values(
        data.clauses.map((clause, i) => ({
          sowId: sowId,
          clauseType: clause.clauseType,
          originalText: clause.originalText,
          summary: clause.summary ?? null,
          sortOrder: clause.sortOrder ?? i,
        })),
      );
    }

    await db
      .update(statementsOfWork)
      .set({ parsedAt: new Date(), updatedAt: new Date() })
      .where(eq(statementsOfWork.id, sowId));

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sowId,
      action: "update",
      metadata: { action: "activate", clauseCount: data.clauses.length },
    });

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sowId))
      .orderBy(sowClauses.sortOrder);

    return { ...sow, clauses, parsedAt: new Date() };
  },

  async getById(workspaceId: string, sowId: string) {
    const sow = await sowRepository.getById(workspaceId, sowId);
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

    const sow = await sowRepository.getById(workspaceId, project.sowId);
    if (!sow) return null;

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sow.id))
      .orderBy(sowClauses.sortOrder);

    return { ...sow, clauses };
  },

  async listByWorkspace(workspaceId: string, options: { cursor?: string; limit?: number }) {
    return sowRepository.listByWorkspace(workspaceId, options);
  },

  async update(workspaceId: string, actorId: string, sowId: string, data: UpdateSowInput) {
    const sow = await sowRepository.getById(workspaceId, sowId);
    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    const updated = await sowRepository.update(workspaceId, sowId, data);
    if (!updated) {
      throw new ValidationError("Failed to update SOW");
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sowId,
      action: "update",
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  },

  async delete(workspaceId: string, actorId: string, sowId: string) {
    const sow = await sowRepository.getById(workspaceId, sowId);
    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    const deleted = await sowRepository.softDelete(workspaceId, sowId);
    if (!deleted) {
      throw new ValidationError("Failed to delete SOW");
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sowId,
      action: "delete",
    });

    return deleted;
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
    const sow = await sowRepository.getById(workspaceId, sowId);
    if (!sow) {
      throw new NotFoundError("StatementOfWork", sowId);
    }

    await db.delete(sowClauses).where(eq(sowClauses.sowId, sowId));

    if (clauses.length > 0) {
      await db.insert(sowClauses).values(
        clauses.map((clause, i) => ({
          sowId: sowId,
          clauseType: clause.clauseType,
          originalText: clause.originalText,
          summary: clause.summary ?? null,
          sortOrder: clause.sortOrder ?? i,
        })),
      );
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "statement_of_work",
      entityId: sowId,
      action: "update",
      metadata: { action: "update_clauses", clauseCount: clauses.length },
    });

    const updated = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sowId))
      .orderBy(sowClauses.sortOrder);

    return updated;
  },
};
