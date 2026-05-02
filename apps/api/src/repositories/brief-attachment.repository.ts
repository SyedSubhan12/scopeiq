import { db, briefAttachments, eq, and, isNull, asc } from "@novabots/db";
import type { NewBriefAttachment } from "@novabots/db";

export const briefAttachmentRepository = {
  async listByBriefId(workspaceId: string, briefId: string) {
    return db
      .select({
        id: briefAttachments.id,
        briefId: briefAttachments.briefId,
        workspaceId: briefAttachments.workspaceId,
        fieldKey: briefAttachments.fieldKey,
        originalName: briefAttachments.originalName,
        fileUrl: briefAttachments.fileUrl,
        fileKey: briefAttachments.objectKey,
        mimeType: briefAttachments.mimeType,
        sizeBytes: briefAttachments.sizeBytes,
        createdAt: briefAttachments.createdAt,
      })
      .from(briefAttachments)
      .where(
        and(
          eq(briefAttachments.briefId, briefId),
          eq(briefAttachments.workspaceId, workspaceId),
          isNull(briefAttachments.deletedAt)
        )
      )
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
