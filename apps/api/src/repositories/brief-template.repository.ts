import {
  db,
  briefTemplates,
  briefTemplateVersions,
  eq,
  and,
  isNull,
  desc,
  sql,
} from "@novabots/db";
import type { NewBriefTemplate, NewBriefTemplateVersion } from "@novabots/db";

export const briefTemplateRepository = {
  async list(workspaceId: string) {
    return db
      .select()
      .from(briefTemplates)
      .where(and(eq(briefTemplates.workspaceId, workspaceId), isNull(briefTemplates.deletedAt)))
      .orderBy(desc(briefTemplates.createdAt));
  },

  /**
   * List published templates for a workspace.
   * Returns the latest published version of each template.
   */
  async listPublished(workspaceId: string) {
    const templates = await db
      .select()
      .from(briefTemplates)
      .where(
        and(
          eq(briefTemplates.workspaceId, workspaceId),
          eq(briefTemplates.status, "published"),
          isNull(briefTemplates.deletedAt),
        ),
      )
      .orderBy(desc(briefTemplates.createdAt));

    // Enrich each template with its latest published version
    const result: Array<{
      id: string;
      workspaceId: string;
      name: string;
      status: string;
      fieldsJson: unknown;
      brandingJson: unknown;
      templateVersionId: string | null;
    }> = [];

    for (const template of templates) {
      const version = await this.getLatestPublishedVersion(workspaceId, template.id);
      result.push({
        id: template.id,
        workspaceId: template.workspaceId,
        name: template.name,
        status: template.status,
        fieldsJson: (version?.fieldsJson ?? template.fieldsJson ?? []) as unknown,
        brandingJson: version?.brandingJson ?? template.brandingJson ?? {},
        templateVersionId: version?.id ?? null,
      });
    }

    return result;
  },

  async getById(workspaceId: string, templateId: string) {
    const [template] = await db
      .select()
      .from(briefTemplates)
      .where(
        and(
          eq(briefTemplates.id, templateId),
          eq(briefTemplates.workspaceId, workspaceId),
          isNull(briefTemplates.deletedAt),
        ),
      )
      .limit(1);
    return template ?? null;
  },

  async create(data: NewBriefTemplate) {
    const [template] = await db.insert(briefTemplates).values(data).returning();
    return template!;
  },

  async clearDefault(workspaceId: string, excludeTemplateId?: string) {
    await db
      .update(briefTemplates)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        excludeTemplateId
          ? and(
              eq(briefTemplates.workspaceId, workspaceId),
              isNull(briefTemplates.deletedAt),
              sql`${briefTemplates.id} <> ${excludeTemplateId}`,
            )
          : and(eq(briefTemplates.workspaceId, workspaceId), isNull(briefTemplates.deletedAt)),
      );
  },

  async update(workspaceId: string, templateId: string, data: Partial<NewBriefTemplate>) {
    const [updated] = await db
      .update(briefTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(briefTemplates.id, templateId),
          eq(briefTemplates.workspaceId, workspaceId),
          isNull(briefTemplates.deletedAt),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async listVersions(workspaceId: string, templateId: string) {
    return db
      .select()
      .from(briefTemplateVersions)
      .where(
        and(
          eq(briefTemplateVersions.workspaceId, workspaceId),
          eq(briefTemplateVersions.templateId, templateId),
        ),
      )
      .orderBy(desc(briefTemplateVersions.versionNumber), desc(briefTemplateVersions.createdAt));
  },

  async getVersionById(workspaceId: string, templateId: string, versionId: string) {
    const [version] = await db
      .select()
      .from(briefTemplateVersions)
      .where(
        and(
          eq(briefTemplateVersions.workspaceId, workspaceId),
          eq(briefTemplateVersions.templateId, templateId),
          eq(briefTemplateVersions.id, versionId),
        ),
      )
      .limit(1);
    return version ?? null;
  },

  async getVersionByBriefVersionId(workspaceId: string, versionId: string) {
    const [version] = await db
      .select()
      .from(briefTemplateVersions)
      .where(
        and(
          eq(briefTemplateVersions.workspaceId, workspaceId),
          eq(briefTemplateVersions.id, versionId),
        ),
      )
      .limit(1);
    return version ?? null;
  },

  async getLatestVersion(workspaceId: string, templateId: string) {
    const [version] = await db
      .select()
      .from(briefTemplateVersions)
      .where(
        and(
          eq(briefTemplateVersions.workspaceId, workspaceId),
          eq(briefTemplateVersions.templateId, templateId),
        ),
      )
      .orderBy(desc(briefTemplateVersions.versionNumber), desc(briefTemplateVersions.createdAt))
      .limit(1);
    return version ?? null;
  },

  async getLatestPublishedVersion(workspaceId: string, templateId: string) {
    const [version] = await db
      .select()
      .from(briefTemplateVersions)
      .where(
        and(
          eq(briefTemplateVersions.workspaceId, workspaceId),
          eq(briefTemplateVersions.templateId, templateId),
          eq(briefTemplateVersions.templateStatus, "published" as any),
        ),
      )
      .orderBy(desc(briefTemplateVersions.versionNumber), desc(briefTemplateVersions.createdAt))
      .limit(1);
    return version ?? null;
  },

  async createVersion(data: NewBriefTemplateVersion) {
    const [version] = await db.insert(briefTemplateVersions).values(data).returning();
    return version!;
  },

  async softDelete(workspaceId: string, templateId: string) {
    const [deleted] = await db
      .update(briefTemplates)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(briefTemplates.id, templateId),
          eq(briefTemplates.workspaceId, workspaceId),
          isNull(briefTemplates.deletedAt),
        ),
      )
      .returning();
    return deleted ?? null;
  },
};
