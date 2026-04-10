import { deliverableRepository } from "../repositories/deliverable.repository.js";
import { deliverableRevisionRepository } from "../repositories/deliverable-revision.repository.js";
import { approvalEventRepository } from "../repositories/approval-event.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";
import { getUploadUrl, getDownloadUrl, validateMimeType } from "../lib/storage.js";

export const deliverableService = {
  async list(
    workspaceId: string,
    options: { projectId?: string | undefined; status?: string | undefined; cursor?: string | undefined; limit?: number | undefined },
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
      description?: string | undefined;
      type?: string | undefined;
      externalUrl?: string | undefined;
      metadata?: Record<string, any> | undefined;
      maxRevisions?: number | undefined;
      dueDate?: string | undefined;
    },
  ) {
    const deliverable = await deliverableRepository.create({
      workspaceId,
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      type: (data.type as "file" | "figma" | "loom" | "youtube" | "link") ?? "file",
      externalUrl: data.externalUrl ?? null,
      metadata: data.metadata ?? null,
      maxRevisions: data.maxRevisions ?? 3,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      revisionRound: 0,
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

    validateMimeType(data.contentType);

    const objectKey = `deliverables/${workspaceId}/${deliverableId}/${data.fileName}`;
    const uploadUrl = await getUploadUrl(objectKey, data.contentType);

    return { upload_url: uploadUrl, object_key: objectKey };
  },

  async confirmUpload(
    workspaceId: string,
    deliverableId: string,
    actorId: string,
    data: { objectKey: string; originalName?: string; notes?: string },
  ) {
    const deliverable = await deliverableRepository.getById(workspaceId, deliverableId);
    if (!deliverable) {
      throw new NotFoundError("Deliverable", deliverableId);
    }

    const expectedPrefix = `deliverables/${workspaceId}/`;
    if (!data.objectKey.startsWith(expectedPrefix)) {
      throw new ValidationError("Invalid object key: does not belong to this workspace");
    }

    const fileUrl = await getDownloadUrl(data.objectKey);

    // Create new revision
    const nextVersion = (deliverable.revisionRound ?? 0) + 1;
    const revision = await deliverableRevisionRepository.create({
      deliverableId,
      versionNumber: nextVersion,
      fileUrl,
      notes: data.notes ?? null,
      createdBy: actorId,
    });

    const updated = await deliverableRepository.update(workspaceId, deliverableId, {
      fileKey: data.objectKey,
      fileUrl,
      originalName: data.originalName ?? null,
      status: "delivered",
      uploadedBy: actorId,
      reviewStartedAt: new Date(),
      currentRevisionId: revision.id,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "deliverable",
      entityId: deliverableId,
      action: "update",
      metadata: { action: "confirm_upload", version: nextVersion, fileKey: data.objectKey },
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

    const currentRound = deliverable.revisionRound ?? 0;
    if (deliverable.maxRevisions !== null && currentRound >= deliverable.maxRevisions) {
      throw new ValidationError(
        `Revision limit reached (${deliverable.maxRevisions}/${deliverable.maxRevisions}). Contact your agency to discuss further changes.`,
      );
    }

    await deliverableRepository.update(workspaceId, deliverableId, {
      status: "changes_requested",
      revisionRound: currentRound + 1,
    });

    const event = await approvalEventRepository.create({
      deliverableId,
      actorId,
      actorName,
      action: "changes_requested",
      comment: comment ?? null,
    });

    return event;
  },
};
