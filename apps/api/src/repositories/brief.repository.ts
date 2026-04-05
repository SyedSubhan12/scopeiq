import { db, briefs, briefFields, eq, and, isNull, desc } from "@novabots/db";
import type { NewBrief, NewBriefField } from "@novabots/db";

export const briefRepository = {
  async list(workspaceId: string, options: { projectId?: string | undefined; status?: string | undefined }) {
    const conditions = [
      eq(briefs.workspaceId, workspaceId),
      isNull(briefs.deletedAt),
    ];
    if (options.projectId) {
      conditions.push(eq(briefs.projectId, options.projectId));
    }
    if (options.status) {
      conditions.push(eq(briefs.status, options.status as typeof briefs.status.enumValues[number]));
    }

    return db
      .select()
      .from(briefs)
      .where(and(...conditions))
      .orderBy(desc(briefs.createdAt));
  },

  async getById(workspaceId: string, briefId: string) {
    const [brief] = await db
      .select()
      .from(briefs)
      .where(
        and(
          eq(briefs.id, briefId),
          eq(briefs.workspaceId, workspaceId),
          isNull(briefs.deletedAt),
        ),
      )
      .limit(1);
    return brief ?? null;
  },

  async create(data: NewBrief) {
    const [brief] = await db.insert(briefs).values(data).returning();
    return brief!;
  },

  async update(workspaceId: string, briefId: string, data: Partial<NewBrief>) {
    const [updated] = await db
      .update(briefs)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(briefs.id, briefId),
          eq(briefs.workspaceId, workspaceId),
          isNull(briefs.deletedAt),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async createFields(fields: NewBriefField[]) {
    if (fields.length === 0) return [];
    return db.insert(briefFields).values(fields).returning();
  },

  async getFieldsByBriefId(briefId: string) {
    return db
      .select()
      .from(briefFields)
      .where(eq(briefFields.briefId, briefId))
      .orderBy(briefFields.sortOrder);
  },
};
