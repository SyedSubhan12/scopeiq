import { db, briefTemplates, eq, and, isNull, desc } from "@novabots/db";
import type { NewBriefTemplate } from "@novabots/db";

export const briefTemplateRepository = {
  async list(workspaceId: string) {
    return db
      .select()
      .from(briefTemplates)
      .where(and(eq(briefTemplates.workspaceId, workspaceId), isNull(briefTemplates.deletedAt)))
      .orderBy(desc(briefTemplates.createdAt));
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

  async softDelete(workspaceId: string, templateId: string) {
    const [deleted] = await db
      .update(briefTemplates)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
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
