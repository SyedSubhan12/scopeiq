import { db, briefAttachments, writeAuditLog, eq, and, isNull, asc } from "@novabots/db";
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
    return db.transaction(async (trx) => {
      const [attachment] = await trx.insert(briefAttachments).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_attachment",
        entityId: attachment!.id,
        action: "create",
        metadata: { briefId: data.briefId, fieldKey: data.fieldKey },
      });
      return attachment!;
    });
  },

  async softDelete(workspaceId: string, attachmentId: string) {
    return db.transaction(async (trx) => {
      const [attachment] = await trx
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
      if (attachment) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "brief_attachment",
          entityId: attachmentId,
          action: "delete",
        });
      }
      return attachment ?? null;
    });
  },
};
