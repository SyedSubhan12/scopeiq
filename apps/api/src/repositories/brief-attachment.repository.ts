import { db, briefAttachments, eq, and, isNull, asc } from "@novabots/db";
import type { NewBriefAttachment } from "@novabots/db";

export const briefAttachmentRepository = {
  async listByBriefId(briefId: string) {
    return db
      .select()
      .from(briefAttachments)
      .where(and(eq(briefAttachments.briefId, briefId), isNull(briefAttachments.deletedAt)))
      .orderBy(asc(briefAttachments.createdAt));
  },

  async listByBriefAndField(briefId: string, fieldKey: string) {
    return db
      .select()
      .from(briefAttachments)
      .where(
        and(
          eq(briefAttachments.briefId, briefId),
          eq(briefAttachments.fieldKey, fieldKey),
          isNull(briefAttachments.deletedAt),
        ),
      )
      .orderBy(asc(briefAttachments.createdAt));
  },

  async getById(workspaceId: string, attachmentId: string) {
    const [attachment] = await db
      .select()
      .from(briefAttachments)
      .where(
        and(
          eq(briefAttachments.id, attachmentId),
          eq(briefAttachments.workspaceId, workspaceId),
          isNull(briefAttachments.deletedAt),
        ),
      )
      .limit(1);

    return attachment ?? null;
  },

  async create(data: NewBriefAttachment) {
    const [attachment] = await db.insert(briefAttachments).values(data).returning();
    return attachment!;
  },

  async softDelete(workspaceId: string, attachmentId: string) {
    const [attachment] = await db
      .update(briefAttachments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(briefAttachments.id, attachmentId),
          eq(briefAttachments.workspaceId, workspaceId),
          isNull(briefAttachments.deletedAt),
        ),
      )
      .returning();

    return attachment ?? null;
  },
};
