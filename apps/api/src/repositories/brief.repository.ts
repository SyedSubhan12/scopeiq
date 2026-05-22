import { db, briefs, briefFields, briefVersions, writeAuditLog, eq, and, isNull, desc, asc, sql } from "@novabots/db";
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
    return db.transaction(async (trx) => {
      const [brief] = await trx.insert(briefs).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief",
        entityId: brief!.id,
        action: "create",
        metadata: { projectId: data.projectId },
      });
      return brief!;
    });
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

  async createFields(workspaceId: string, fields: NewBriefField[]) {
    if (fields.length === 0) return [];
    return db.transaction(async (trx) => {
      const inserted = await trx.insert(briefFields).values(fields).returning();
      const briefId = inserted[0]!.briefId;
      await writeAuditLog(trx, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_field",
        entityId: briefId,
        action: "create",
        metadata: { briefId, count: inserted.length },
      });
      return inserted;
    });
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

  async getFieldsByBriefId(workspaceId: string, briefId: string) {
    return db
      .select({
        id: briefFields.id,
        briefId: briefFields.briefId,
        fieldKey: briefFields.fieldKey,
        fieldLabel: briefFields.fieldLabel,
        fieldType: briefFields.fieldType,
        value: briefFields.value,
        sortOrder: briefFields.sortOrder,
      })
      .from(briefFields)
      .innerJoin(briefs, eq(briefFields.briefId, briefs.id))
      .where(and(eq(briefFields.briefId, briefId), eq(briefs.workspaceId, workspaceId)))
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
    return db.transaction(async (trx) => {
      const [version] = await trx.insert(briefVersions).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_version",
        entityId: version!.id,
        action: "create",
        metadata: { briefId: data.briefId, versionNumber: data.versionNumber },
      });
      return version!;
    });
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
