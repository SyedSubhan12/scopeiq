import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { approvalEventRepository } from "../repositories/approval-event.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";
import { getUploadUrl, getDownloadUrl } from "../lib/storage.js";

export const deliverableService = {
  async list(
    workspaceId: string,
    options: { projectId?: string; status?: string; cursor?: string; limit?: number },
  ) {
    return deliverableRepository.list(workspaceId, stripUndefined(options) as typeof options);
  },

  async getById(workspaceId: string, deliverableId: string) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }
    return deliverable;
  },

  async create(
    workspaceId: string,
    actorId: string,
    data: {
      projectId: string;
      name: string;
      description?: string;
      type?: string;
      externalUrl?: string;
      maxRevisions?: number;
      dueDate?: string;
    },
  ) {
    const deliverable = await deliverableRepository.create({
      workspaceId,
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      type: (data.type as "file" | "figma" | "loom" | "youtube" | "link") ?? "file",
      externalUrl: data.externalUrl ?? null,
      maxRevisions: data.maxRevisions ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverable.id,
      action: "create",
    });

    return deliverable;
  },

  async update(
    workspaceId: string,
    deliverableId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const cleaned = stripUndefined(data);
    if (cleaned.dueDate && typeof cleaned.dueDate === "string") {
      cleaned.dueDate = new Date(cleaned.dueDate);
    }

    const deliverable = await deliverableRepository.update(workspaceId, deliverableId, cleaned);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverableId,
      action: "update",
      metadata: { fields: Object.keys(cleaned) },
    });

    return deliverable;
  },

  async delete(workspaceId: string, deliverableId: string, actorId: string) {
    const deliverable = await deliverableRepository.softDelete(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverableId,
      action: "delete",
    });

    return deliverable;
  },

  async getFreshDownloadUrl(workspaceId: string, deliverableId: string) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) throw new NotFoundError("Deliverable", deliverableId);
    if (!deliverable.fileKey) throw new ValidationError("No file uploaded for this deliverable");
    return getDownloadUrl(deliverable.fileKey);
  },

  async getUploadUrl(
    workspaceId: string,
    deliverableId: string,
    data: { fileName: string; contentType: string; fileSize: number },
  ) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    const objectKey = `deliverables/${workspaceId}/${deliverableId}/${data.fileName}`;
    const uploadUrl = await getUploadUrl(objectKey, data.contentType);

    return { upload_url: uploadUrl, object_key: objectKey };
  },

  async confirmUpload(
    workspaceId: string,
    deliverableId: string,
    actorId: string,
    data: { objectKey: string },
  ) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    // Generate a signed download URL (1-hour expiry); store the key separately
    const fileUrl = await getDownloadUrl(data.objectKey);

    const updated = await deliverableRepository.update(workspaceId, deliverableId, {
      fileKey: data.objectKey,
      fileUrl,
      status: "in_review",
      uploadedBy: actorId,
      reviewStartedAt: new Date(),
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverableId,
      action: "update",
      metadata: { action: "confirm_upload", fileKey: data.objectKey },
    });

    return updated;
  },

  async approve(
    workspaceId: string,
    deliverableId: string,
    actorId: string | null,
    actorName: string | null,
    comment?: string,
  ) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    if (deliverable.status === "approved") {
      throw new ValidationError("Deliverable is already approved");
    }

    await deliverableRepository.update(workspaceId, deliverableId, { status: "approved" });

    const event = await approvalEventRepository.create({
      deliverableId,
      actorId,
      actorName,
      action: "approved",
      comment: comment ?? null,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverableId,
      action: "approve",
    });

    return event;
  },

  async requestRevision(
    workspaceId: string,
    deliverableId: string,
    actorId: string | null,
    actorName: string | null,
    comment?: string,
  ) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    const currentRevisions = deliverable.revisionCount ?? 0;
    if (deliverable.maxRevisions !== null && currentRevisions >= deliverable.maxRevisions) {
      throw new ValidationError(
        `Revision limit reached (${deliverable.maxRevisions}/${deliverable.maxRevisions}). Contact your agency to discuss further changes.`,
      );
    }

    await deliverableRepository.update(workspaceId, deliverableId, {
      status: "revision_requested",
      revisionCount: currentRevisions + 1,
    });

    const event = await approvalEventRepository.create({
      deliverableId,
      actorId,
      actorName,
      action: "revision_requested",
      comment: comment ?? null,
    });

    return event;
  },
};
