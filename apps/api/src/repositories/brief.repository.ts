import { db, briefs, briefFields, briefVersions, eq, and, isNull, desc, asc, sql } from "@novabots/db";
import type { NewBrief, NewBriefField, NewBriefVersion } from "@novabots/db";

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

  async getPendingById(workspaceId: string, projectId: string, briefId: string) {
    const [brief] = await db
      .select()
      .from(briefs)
      .where(
        and(
          eq(briefs.id, briefId),
          eq(briefs.workspaceId, workspaceId),
          eq(briefs.projectId, projectId),
          isNull(briefs.submittedAt),
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

  async updateFieldValue(
    briefId: string,
    fieldKey: string,
    data: Partial<NewBriefField>,
  ) {
    const [updated] = await db
      .update(briefFields)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(briefFields.briefId, briefId), eq(briefFields.fieldKey, fieldKey)))
      .returning();

    return updated ?? null;
  },

  async getFieldsByBriefId(briefId: string) {
    return db
      .select()
      .from(briefFields)
      .where(eq(briefFields.briefId, briefId))
      .orderBy(briefFields.sortOrder);
  },

  async listVersions(workspaceId: string, briefId: string) {
    return db
      .select()
      .from(briefVersions)
      .where(and(eq(briefVersions.workspaceId, workspaceId), eq(briefVersions.briefId, briefId)))
      .orderBy(desc(briefVersions.versionNumber), desc(briefVersions.createdAt));
  },

  async getLatestVersion(workspaceId: string, briefId: string) {
    const [version] = await db
      .select()
      .from(briefVersions)
      .where(and(eq(briefVersions.workspaceId, workspaceId), eq(briefVersions.briefId, briefId)))
      .orderBy(desc(briefVersions.versionNumber), desc(briefVersions.createdAt))
      .limit(1);
    return version ?? null;
  },

  async getNextVersionNumber(workspaceId: string, briefId: string) {
    const [result] = await db
      .select({
        nextVersion: sql<number>`coalesce(max(${briefVersions.versionNumber}), 0) + 1`,
      })
      .from(briefVersions)
      .where(and(eq(briefVersions.workspaceId, workspaceId), eq(briefVersions.briefId, briefId)));

    return Number(result?.nextVersion ?? 1);
  },

  async createVersion(data: NewBriefVersion) {
    const [version] = await db.insert(briefVersions).values(data).returning();
    return version!;
  },

  async updateVersion(workspaceId: string, versionId: string, data: Partial<NewBriefVersion>) {
    const [version] = await db
      .update(briefVersions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(briefVersions.workspaceId, workspaceId), eq(briefVersions.id, versionId)))
      .returning();

    return version ?? null;
  },
};
