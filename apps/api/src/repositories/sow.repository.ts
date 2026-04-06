import { db, statementsOfWork, projects, eq, and, isNull, desc, gt } from "@novabots/db";
import type { NewStatementOfWork } from "@novabots/db";

export const sowRepository = {
  async getById(workspaceId: string, sowId: string) {
    const [sow] = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1);
    return sow ?? null;
  },

  async getByProjectId(workspaceId: string, projectId: string) {
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

    if (!project || !project.sowId) return null;

    const [sow] = await db
      .select()
      .from(statementsOfWork)
      .where(
        and(
          eq(statementsOfWork.id, project.sowId),
          eq(statementsOfWork.workspaceId, workspaceId),
          isNull(statementsOfWork.deletedAt),
        ),
      )
      .limit(1);

    return sow ?? null;
  },

  async listByWorkspace(
    workspaceId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const limit = options.limit ?? 20;
    const conditions = [
      eq(statementsOfWork.workspaceId, workspaceId),
      isNull(statementsOfWork.deletedAt),
    ];
    if (options.cursor) {
      conditions.push(gt(statementsOfWork.id, options.cursor));
    }

    const results = await db
      .select()
      .from(statementsOfWork)
      .where(and(...conditions))
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

  async create(data: NewStatementOfWork) {
    const [sow] = await db
      .insert(statementsOfWork)
      .values(data)
      .returning();
    return sow!;
  },

  async update(workspaceId: string, sowId: string, data: Partial<NewStatementOfWork>) {
    const [updated] = await db
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
    return updated ?? null;
  },

  async softDelete(workspaceId: string, sowId: string) {
    const [deleted] = await db
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
    return deleted ?? null;
  },
};
