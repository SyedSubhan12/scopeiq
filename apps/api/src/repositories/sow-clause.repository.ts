import { db, sowClauses, statementsOfWork, projects, eq, and, isNull, desc, asc, sql } from "@novabots/db";
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

  async create(data: NewSowClause) {
    const [clause] = await db
      .insert(sowClauses)
      .values(data)
      .returning();
    return clause!;
  },

  async createMany(data: NewSowClause[]) {
    if (data.length === 0) return [];
    const inserted = await db.insert(sowClauses).values(data).returning();
    return inserted;
  },

  async update(workspaceId: string, clauseId: string, data: Partial<NewSowClause>) {
    const [clause] = await db
      .select({ sowId: sowClauses.sowId })
      .from(sowClauses)
      .where(eq(sowClauses.id, clauseId))
      .limit(1);

    if (!clause) return null;

    const [sow] = await db
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

    const [updated] = await db
      .update(sowClauses)
      .set(data)
      .where(eq(sowClauses.id, clauseId))
      .returning();
    return updated ?? null;
  },

  async delete(workspaceId: string, clauseId: string) {
    const [clause] = await db
      .select({ sowId: sowClauses.sowId })
      .from(sowClauses)
      .where(eq(sowClauses.id, clauseId))
      .limit(1);

    if (!clause) return null;

    const [sow] = await db
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

    const [deleted] = await db
      .delete(sowClauses)
      .where(eq(sowClauses.id, clauseId))
      .returning();
    return deleted ?? null;
  },

  async deleteBySowId(workspaceId: string, sowId: string) {
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

    return db
      .delete(sowClauses)
      .where(eq(sowClauses.sowId, sowId))
      .returning();
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
