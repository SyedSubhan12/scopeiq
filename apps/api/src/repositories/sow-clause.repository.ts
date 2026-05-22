import { db, sowClauses, statementsOfWork, projects, writeAuditLog, eq, and, isNull, desc, asc, sql } from "@novabots/db";
import type { NewSowClause } from "@novabots/db";
import type { ClauseType } from "@novabots/db";

export const sowClauseRepository = {
  async getById(workspaceId: string, clauseId: string) {
    const [clause] = await db
      .select({
        id: sowClauses.id,
        sowId: sowClauses.sowId,
        clauseType: sowClauses.clauseType,
        originalText: sowClauses.originalText,
        summary: sowClauses.summary,
        sortOrder: sowClauses.sortOrder,
        createdAt: sowClauses.createdAt,
      })
      .from(sowClauses)
      .innerJoin(
        statementsOfWork,
        eq(sowClauses.sowId, statementsOfWork.id),
      )
      .where(
        and(
          eq(sowClauses.id, clauseId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1);
    return clause ?? null;
  },

  async getBySowId(workspaceId: string, sowId: string, clauseType?: ClauseType) {
    const [sow] = await db
      .select({ id: statementsOfWork.id })
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1);

    if (!sow) return [];

    const conditions = [eq(sowClauses.sowId, sowId)];
    if (clauseType) {
      conditions.push(eq(sowClauses.clauseType, clauseType));
    }

    return db
      .select()
      .from(sowClauses)
      .where(and(...conditions))
      .orderBy(desc(sowClauses.sortOrder));
  },

  async getByProjectId(workspaceId: string, projectId: string, clauseType?: ClauseType) {
    const [project] = await db
      .select({ sowId: projects.sowId })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    if (!project || !project.sowId) return [];

    const conditions = [eq(sowClauses.sowId, project.sowId)];
    if (clauseType) {
      conditions.push(eq(sowClauses.clauseType, clauseType));
    }

    return db
      .select()
      .from(sowClauses)
      .where(and(...conditions))
      .orderBy(desc(sowClauses.sortOrder));
  },

  async create(workspaceId: string, data: NewSowClause) {
    return db.transaction(async (trx) => {
      const [sow] = await trx
        .select({ id: statementsOfWork.id })
        .from(statementsOfWork)
        .where(
          and(
            eq(statementsOfWork.id, data.sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .limit(1);

      if (!sow) return null;

      const [clause] = await trx
        .insert(sowClauses)
        .values(data)
        .returning();
      await writeAuditLog(trx, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "sow_clause",
        entityId: clause!.id,
        action: "create",
        metadata: { sowId: data.sowId, clauseType: data.clauseType },
      });
      return clause!;
    });
  },

  async createMany(workspaceId: string, data: NewSowClause[]) {
    if (data.length === 0) return [];
    return db.transaction(async (trx) => {
      const sowId = data[0]!.sowId;
      const [sow] = await trx
        .select({ id: statementsOfWork.id })
        .from(statementsOfWork)
        .where(
          and(
            eq(statementsOfWork.id, sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .limit(1);

      if (!sow) return [];

      const inserted = await trx.insert(sowClauses).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "sow_clause",
        entityId: sowId,
        action: "create",
        metadata: { sowId, count: inserted.length },
      });
      return inserted;
    });
  },

  async update(workspaceId: string, clauseId: string, data: Partial<NewSowClause>) {
    return db.transaction(async (trx) => {
      const [clause] = await trx
        .select({ sowId: sowClauses.sowId })
        .from(sowClauses)
        .where(eq(sowClauses.id, clauseId))
        .limit(1);

      if (!clause) return null;

      const [sow] = await trx
        .select({ id: statementsOfWork.id })
        .from(statementsOfWork)
        .where(
          and(
            eq(statementsOfWork.id, clause.sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .limit(1);

      if (!sow) return null;

      const [updated] = await trx
        .update(sowClauses)
        .set(data)
        .where(eq(sowClauses.id, clauseId))
        .returning();
      if (updated) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "sow_clause",
          entityId: clauseId,
          action: "update",
          metadata: { sowId: clause.sowId },
        });
      }
      return updated ?? null;
    });
  },

  async delete(workspaceId: string, clauseId: string) {
    return db.transaction(async (trx) => {
      const [clause] = await trx
        .select({ sowId: sowClauses.sowId })
        .from(sowClauses)
        .where(eq(sowClauses.id, clauseId))
        .limit(1);

      if (!clause) return null;

      const [sow] = await trx
        .select({ id: statementsOfWork.id })
        .from(statementsOfWork)
        .where(
          and(
            eq(statementsOfWork.id, clause.sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .limit(1);

      if (!sow) return null;

      const [deleted] = await trx
        .delete(sowClauses)
        .where(eq(sowClauses.id, clauseId))
        .returning();
      if (deleted) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "sow_clause",
          entityId: clauseId,
          action: "delete",
          metadata: { sowId: clause.sowId },
        });
      }
      return deleted ?? null;
    });
  },

  async deleteBySowId(workspaceId: string, sowId: string) {
    return db.transaction(async (trx) => {
      const [sow] = await trx
        .select({ id: statementsOfWork.id })
        .from(statementsOfWork)
        .where(
          and(
            eq(statementsOfWork.id, sowId),
            eq(statementsOfWork.workspaceId, workspaceId),
            isNull(statementsOfWork.deletedAt),
          ),
        )
        .limit(1);

      if (!sow) return [];

      const deleted = await trx
        .delete(sowClauses)
        .where(eq(sowClauses.sowId, sowId))
        .returning();
      if (deleted.length > 0) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "sow_clause",
          entityId: sowId,
          action: "delete",
          metadata: { sowId, count: deleted.length },
        });
      }
      return deleted;
    });
  },

  /**
   * Returns all clauses for a SOW ordered for human review:
   *  1. requires_human_review = true first
   *  2. confidence_level: low → medium → high
   *  3. clause_type alphabetically
   *
   * The workspace ownership check is enforced via the JOIN on statementsOfWork.
   */
  async getReviewData(workspaceId: string, sowId: string) {
    const [sow] = await db
      .select({
        id: statementsOfWork.id,
        overallConfidence: sql<number | null>`(${statementsOfWork.parsingResultJson}->>'overall_confidence')::real`,
      })
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1);

    if (!sow) return null;

    const clauses = await db
      .select({
        id: sowClauses.id,
        clauseType: sowClauses.clauseType,
        originalText: sowClauses.originalText,
        summary: sowClauses.summary,
        confidenceScore: sowClauses.confidenceScore,
        confidenceLevel: sowClauses.confidenceLevel,
        rawTextSource: sowClauses.rawTextSource,
        pageNumber: sowClauses.pageNumber,
        requiresHumanReview: sowClauses.requiresHumanReview,
        sortOrder: sowClauses.sortOrder,
      })
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sowId))
      .orderBy(
        // requires_human_review DESC — true rows first (true > false in pg)
        desc(sowClauses.requiresHumanReview),
        // confidence_level: low → medium → high (NULL last)
        sql`CASE ${sowClauses.confidenceLevel}
              WHEN 'low'    THEN 1
              WHEN 'medium' THEN 2
              WHEN 'high'   THEN 3
              ELSE               4
            END ASC`,
        asc(sowClauses.clauseType),
      );

    return { sow, clauses };
  },
};
