import { briefRepository } from "../repositories/brief.repository.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { briefAttachmentRepository } from "../repositories/brief-attachment.repository.js";
import { briefClarificationRepository } from "../repositories/brief-clarification.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";
import { dispatchScoreBriefJob } from "../jobs/score-brief.job.js";
import { getDownloadUrl, getUploadUrl } from "../lib/storage.js";

type BriefFieldCondition = {
  field_key: string;
  operator: "equals" | "not_equals" | "contains";
  value: string;
};

type BriefFieldConfig = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  conditions?: BriefFieldCondition[];
  order?: number;
};

type BriefAttachmentSummary = {
  id: string;
  fieldKey: string;
  originalName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

type ReviewAction = "approve" | "clarify" | "hold" | "override";
type ClarificationItemInput = {
  fieldKey: string;
  fieldLabel: string;
  prompt: string;
  severity: "low" | "medium" | "high";
  sourceFlagId?: string | undefined;
};

function normalizeFieldType(type?: string) {
  switch (type) {
    case "select":
      return "single_choice";
    case "multiselect":
      return "multi_choice";
    case "number":
      return "text";
    case "boolean":
      return "single_choice";
    default:
      return type ?? "text";
  }
}

function normalizeResponseValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
}

function shouldShowField(
  field: Pick<BriefFieldConfig, "conditions">,
  responses: Record<string, unknown>,
): boolean {
  if (!field.conditions || field.conditions.length === 0) return true;

  return field.conditions.every((condition) => {
    const rawValue = responses[condition.field_key];
    const normalizedValue = Array.isArray(rawValue)
      ? rawValue.map((item) => String(item)).join(",")
      : String(rawValue ?? "");

    switch (condition.operator) {
      case "equals":
        return normalizedValue === condition.value;
      case "not_equals":
        return normalizedValue !== condition.value;
      case "contains":
        return normalizedValue.includes(condition.value);
      default:
        return true;
    }
  });
}

function mapTemplateFields(
  rawFields: unknown,
): BriefFieldConfig[] {
  if (!Array.isArray(rawFields)) return [];

  return rawFields.map((field, index) => {
    const record = (field ?? {}) as Record<string, unknown>;
    const options = Array.isArray(record.options)
      ? record.options.map((option) => String(option))
      : record.type === "boolean"
        ? ["Yes", "No"]
        : undefined;
    const placeholder = typeof record.placeholder === "string" ? record.placeholder : undefined;
    const helpText =
      typeof record.helpText === "string"
        ? record.helpText
        : typeof record.description === "string"
          ? record.description
          : undefined;
    const conditions = Array.isArray(record.conditions)
      ? (record.conditions as BriefFieldCondition[])
      : undefined;

    return {
      key: String(record.key ?? `field_${index}`),
      label: String(record.label ?? `Field ${index + 1}`),
      type: normalizeFieldType(typeof record.type === "string" ? record.type : "text"),
      required: Boolean(record.required),
      order: typeof record.order === "number" ? record.order : index,
      ...(options ? { options } : {}),
      ...(placeholder ? { placeholder } : {}),
      ...(helpText ? { helpText } : {}),
      ...(conditions ? { conditions } : {}),
    };
  });
}

function ensureFileUploadField(fieldConfigs: BriefFieldConfig[], fieldKey: string) {
  const field = fieldConfigs.find((entry) => entry.key === fieldKey);
  if (!field) {
    throw new ValidationError(`Unknown brief field: ${fieldKey}`);
  }
  if (field.type !== "file_upload") {
    throw new ValidationError(`Field ${field.label} does not accept file uploads`);
  }
  return field;
}

async function getPendingBriefContext(
  workspaceId: string,
  projectId: string,
  briefId: string,
) {
  const brief = await briefRepository.getPendingById(workspaceId, projectId, briefId);
  if (!brief) {
    throw new NotFoundError("Brief", briefId);
  }

  return getEditableBriefContext({
    workspaceId,
    brief,
    projectId,
  });
}

async function getEditableBriefContext(data: {
  workspaceId: string;
  brief: Awaited<ReturnType<typeof briefRepository.getById>> extends infer T
    ? Exclude<T, null>
    : never;
  projectId?: string;
}) {
  const { workspaceId, brief, projectId } = data;
  if (projectId && brief.projectId !== projectId) {
    throw new NotFoundError("Brief", brief.id);
  }

  const existingFields = await briefRepository.getFieldsByBriefId(brief.id);
  const templateVersion = brief.templateVersionId
    ? await briefTemplateRepository.getVersionByBriefVersionId(workspaceId, brief.templateVersionId)
    : null;
  if (brief.templateVersionId && !templateVersion) {
    throw new NotFoundError("BriefTemplateVersion", brief.templateVersionId);
  }
  const template = !templateVersion && brief.templateId
    ? await briefTemplateRepository.getById(workspaceId, brief.templateId)
    : null;
  const templateFields = mapTemplateFields(templateVersion?.fieldsJson ?? template?.fieldsJson);
  const fieldConfigs: BriefFieldConfig[] =
    templateFields.length > 0
      ? templateFields
      : existingFields.map((field, index) => ({
          key: field.fieldKey,
          label: field.fieldLabel,
          type: field.fieldType,
          required: false,
          order: index,
        }));

  return {
    brief,
    existingFields,
    fieldConfigs,
  };
}

async function getSubmittedBriefContext(
  workspaceId: string,
  projectId: string,
  briefId: string,
) {
  const brief = await briefRepository.getById(workspaceId, briefId);
  if (!brief) {
    throw new NotFoundError("Brief", briefId);
  }
  if (brief.projectId !== projectId || !brief.submittedAt) {
    throw new NotFoundError("Brief", briefId);
  }
  return getEditableBriefContext({ workspaceId, brief, projectId });
}

async function syncAttachmentFieldValue(
  briefId: string,
  field: BriefFieldConfig,
) {
  const attachments = await briefAttachmentRepository.listByBriefAndField(briefId, field.key);
  const nextValue = attachments.map((attachment) => attachment.originalName).join(", ") || null;
  const existingFields = await briefRepository.getFieldsByBriefId(briefId);
  const existingField = existingFields.find((entry) => entry.fieldKey === field.key);

  const fieldPayload = {
    fieldLabel: field.label,
    fieldType: field.type ?? "file_upload",
    value: nextValue,
    sortOrder: field.order ?? 0,
  };

  if (existingField) {
    await briefRepository.updateFieldValue(briefId, field.key, fieldPayload);
    return;
  }

  await briefRepository.createFields([
    {
      briefId,
      fieldKey: field.key,
      ...fieldPayload,
    },
  ]);
}

async function listBriefAttachments(briefId: string): Promise<BriefAttachmentSummary[]> {
  const attachments = await briefAttachmentRepository.listByBriefId(briefId);
  return attachments.map((attachment) => ({
    id: attachment.id,
    fieldKey: attachment.fieldKey,
    originalName: attachment.originalName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType ?? null,
    sizeBytes: attachment.sizeBytes ?? null,
  }));
}

async function createBriefVersionSnapshot(data: {
  workspaceId: string;
  brief: Awaited<ReturnType<typeof briefRepository.getById>> extends infer T
    ? Exclude<T, null>
    : never;
  fields: Awaited<ReturnType<typeof briefRepository.getFieldsByBriefId>>;
  attachments?: BriefAttachmentSummary[] | undefined;
  reviewNote?: string | null | undefined;
}) {
  const attachments = data.attachments ?? (await listBriefAttachments(data.brief.id));
  const nextVersionNumber = await briefRepository.getNextVersionNumber(
    data.workspaceId,
    data.brief.id,
  );

  return briefRepository.createVersion({
    workspaceId: data.workspaceId,
    briefId: data.brief.id,
    versionNumber: nextVersionNumber,
    title: data.brief.title,
    status: data.brief.status,
    scopeScore: data.brief.scopeScore ?? null,
    scoringResultJson: data.brief.scoringResultJson ?? null,
    answersJson: data.fields,
    attachmentsJson: attachments,
    reviewerId: data.brief.reviewerId ?? null,
    reviewNote: data.reviewNote ?? null,
    submittedBy: data.brief.submittedBy ?? null,
    submittedAt: data.brief.submittedAt ?? null,
  });
}

function getAuditActionForReview(action: ReviewAction) {
  switch (action) {
    case "approve":
    case "override":
      return "approve" as const;
    case "clarify":
      return "send" as const;
    case "hold":
      return "reject" as const;
  }
}

export const briefService = {
  async listBriefs(
    workspaceId: string,
    options: { projectId?: string | undefined; status?: string | undefined },
  ) {
    const clean = stripUndefined(options) as { projectId?: string; status?: string };
    return briefRepository.list(workspaceId, clean);
  },

  async getBrief(workspaceId: string, briefId: string) {
    const brief = await briefRepository.getById(workspaceId, briefId);
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    const fields = await briefRepository.getFieldsByBriefId(briefId);
    const attachments = await listBriefAttachments(briefId);
    const storedVersions = await briefRepository.listVersions(workspaceId, briefId);
    const currentClarificationRequest = await briefClarificationRepository.getOpenForBrief(
      workspaceId,
      briefId,
    );

    const currentVersion = {
      id: storedVersions[0]?.id ?? `current-${briefId}`,
      briefId,
      versionNumber: storedVersions[0]?.versionNumber ?? 1,
      title: brief.title,
      status: brief.status,
      scopeScore: brief.scopeScore,
      scoringResultJson: brief.scoringResultJson,
      answersJson: fields,
      attachmentsJson: attachments,
      reviewerId: brief.reviewerId ?? null,
      reviewNote:
        typeof (brief.scoringResultJson as Record<string, unknown> | null)?.decision_note === "string"
          ? ((brief.scoringResultJson as Record<string, unknown>).decision_note as string)
          : null,
      submittedBy: brief.submittedBy ?? null,
      submittedAt: brief.submittedAt ?? null,
      createdAt: storedVersions[0]?.createdAt ?? brief.createdAt,
      updatedAt: brief.updatedAt,
    };

    const versions =
      storedVersions.length === 0
        ? [currentVersion]
        : [currentVersion, ...storedVersions.slice(1)];

    return { ...brief, fields, attachments, versions, currentClarificationRequest };
  },

  async reviewBrief(
    workspaceId: string,
    briefId: string,
    actorId: string,
    data: {
      action: ReviewAction;
      status: "clarification_needed" | "approved" | "rejected";
      note?: string | undefined;
    },
  ) {
    const existingBrief = await briefRepository.getById(workspaceId, briefId);
    if (!existingBrief) {
      throw new NotFoundError("Brief", briefId);
    }

    const brief = await briefRepository.update(workspaceId, briefId, {
      status: data.status,
      scoringResultJson: {
        ...((existingBrief.scoringResultJson as Record<string, unknown> | null) ?? {}),
        ...(data.note ? { decision_note: data.note } : {}),
        review_action: data.action,
      },
    });
    if (!brief) throw new NotFoundError("Brief", briefId);

    const latestVersion = await briefRepository.getLatestVersion(workspaceId, briefId);
    if (latestVersion) {
      await briefRepository.updateVersion(workspaceId, latestVersion.id, {
        status: data.status,
        scopeScore: brief.scopeScore ?? null,
        scoringResultJson: brief.scoringResultJson ?? null,
        reviewerId: brief.reviewerId ?? null,
        reviewNote: data.note ?? null,
      });
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief",
      entityId: briefId,
      action: getAuditActionForReview(data.action),
      metadata: stripUndefined({
        reviewAction: data.action,
        status: data.status,
        note: data.note,
      }),
    });

    return brief;
  },

  async overrideBrief(
    workspaceId: string,
    briefId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const brief = await briefRepository.update(workspaceId, briefId, stripUndefined(data));
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    const latestVersion = await briefRepository.getLatestVersion(workspaceId, briefId);
    if (latestVersion) {
      await briefRepository.updateVersion(workspaceId, latestVersion.id, {
        status: brief.status,
        scopeScore: brief.scopeScore ?? null,
        scoringResultJson: brief.scoringResultJson ?? null,
        reviewerId: brief.reviewerId ?? null,
        reviewNote:
          typeof (data.scoringResultJson as Record<string, unknown> | undefined)?.override_reason === "string"
            ? ((data.scoringResultJson as Record<string, unknown>).override_reason as string)
            : latestVersion.reviewNote ?? null,
      });
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: { fields: Object.keys(data) },
    });

    return brief;
  },

  async assignReviewer(
    workspaceId: string,
    briefId: string,
    actorId: string,
    reviewerId: string | null,
  ) {
    if (reviewerId) {
      const reviewer = await userRepository.getById(workspaceId, reviewerId);
      if (!reviewer) {
        throw new NotFoundError("User", reviewerId);
      }
    }

    const brief = await briefRepository.update(workspaceId, briefId, {
      reviewerId,
    });
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    const latestVersion = await briefRepository.getLatestVersion(workspaceId, briefId);
    if (latestVersion) {
      await briefRepository.updateVersion(workspaceId, latestVersion.id, {
        reviewerId,
      });
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: {
        action: "assign_reviewer",
        reviewerId,
      },
    });

    return brief;
  },

  async getOpenClarificationRequest(workspaceId: string, briefId: string) {
    const brief = await briefRepository.getById(workspaceId, briefId);
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    return briefClarificationRepository.getOpenForBrief(workspaceId, briefId);
  },

  async createClarificationRequest(
    workspaceId: string,
    briefId: string,
    actorId: string,
    data: {
      message?: string | undefined;
      items: ClarificationItemInput[];
    },
  ) {
    const brief = await briefRepository.getById(workspaceId, briefId);
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    const latestVersion = await briefRepository.getLatestVersion(workspaceId, briefId);
    await briefClarificationRepository.resolveOpenByBriefId(workspaceId, briefId);

    const request = await briefClarificationRepository.createRequest({
      workspaceId,
      briefId,
      briefVersionId: latestVersion?.id ?? null,
      status: "open",
      message: data.message?.trim() || null,
      requestedBy: actorId,
    });

    const items = await briefClarificationRepository.createItems(
      data.items.map((item, index) => ({
        requestId: request.id,
        fieldKey: item.fieldKey,
        fieldLabel: item.fieldLabel,
        prompt: item.prompt,
        severity: item.severity,
        ...(item.sourceFlagId ? { sourceFlagId: item.sourceFlagId } : {}),
        sortOrder: index,
      })),
    );

    const updatedBrief = await briefRepository.update(workspaceId, briefId, {
      status: "clarification_needed",
      scoringResultJson: {
        ...((brief.scoringResultJson as Record<string, unknown> | null) ?? {}),
        ...(data.message?.trim() ? { decision_note: data.message.trim() } : {}),
        review_action: "clarify",
      },
    });

    if (!updatedBrief) {
      throw new NotFoundError("Brief", briefId);
    }

    if (latestVersion) {
      await briefRepository.updateVersion(workspaceId, latestVersion.id, {
        status: "clarification_needed",
        scoringResultJson: updatedBrief.scoringResultJson ?? null,
        reviewNote: data.message?.trim() || null,
      });
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief",
      entityId: briefId,
      action: "send",
      metadata: {
        action: "clarification_request_created",
        clarificationRequestId: request.id,
        itemCount: items.length,
      },
    });

    return { ...request, items };
  },

  async listVersions(workspaceId: string, briefId: string) {
    const brief = await briefRepository.getById(workspaceId, briefId);
    if (!brief) {
      throw new NotFoundError("Brief", briefId);
    }

    const fields = await briefRepository.getFieldsByBriefId(briefId);
    const attachments = await listBriefAttachments(briefId);
    const storedVersions = await briefRepository.listVersions(workspaceId, briefId);

    if (storedVersions.length === 0) {
      return [
        {
          id: `current-${briefId}`,
          briefId,
          versionNumber: 1,
          title: brief.title,
          status: brief.status,
          scopeScore: brief.scopeScore,
          scoringResultJson: brief.scoringResultJson,
          answersJson: fields,
          attachmentsJson: attachments,
          reviewerId: brief.reviewerId ?? null,
          reviewNote: null,
          submittedBy: brief.submittedBy ?? null,
          submittedAt: brief.submittedAt ?? null,
          createdAt: brief.createdAt,
          updatedAt: brief.updatedAt,
        },
      ];
    }

    return [
      {
        ...storedVersions[0],
        title: brief.title,
        status: brief.status,
        scopeScore: brief.scopeScore,
        scoringResultJson: brief.scoringResultJson,
        answersJson: fields,
        attachmentsJson: attachments,
        reviewerId: brief.reviewerId ?? null,
        updatedAt: brief.updatedAt,
      },
      ...storedVersions.slice(1),
    ];
  },

  async submitBrief(data: {
    templateId: string;
    projectId: string;
    responses: Record<string, unknown>;
    workspaceId: string;
    submittedBy?: string | undefined;
    title?: string | undefined;
  }) {
    const { templateId, projectId, responses, workspaceId, submittedBy, title } = data;

    // Look up the template to validate it belongs to the workspace
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }
    if (template.status === "archived") {
      throw new ValidationError("Archived templates cannot be used for new briefs");
    }
    const publishedTemplateVersion = await briefTemplateRepository.getLatestPublishedVersion(
      workspaceId,
      templateId,
    );
    if (!publishedTemplateVersion) {
      throw new ValidationError("Template must be published before it can be used for a brief");
    }

    // Validate responses against template fields_json
    const templateFields = (publishedTemplateVersion.fieldsJson ?? []) as Array<{
      key: string;
      label: string;
      type?: string;
      required?: boolean;
    }>;

    for (const field of templateFields) {
      if (field.required) {
        const value = responses[field.key];
        if (!(field.key in responses) || value === "" || value === null || value === undefined) {
          throw new ValidationError(`Missing required field: ${field.label ?? field.key}`);
        }
      }
    }

    // Create the brief record
    const brief = await briefRepository.create({
      workspaceId,
      projectId,
      templateId,
      templateVersionId: publishedTemplateVersion.id,
      title: title ?? publishedTemplateVersion.name,
      status: "pending_score",
      submittedBy: submittedBy ?? null,
      submittedAt: new Date(),
    });

    // Create brief_field records for each response
    const fieldRecords = templateFields.map((field, index) => ({
      briefId: brief.id,
      fieldKey: field.key,
      fieldLabel: field.label,
      fieldType: field.type ?? "text",
      value: field.key in responses ? String(responses[field.key]) : null,
      sortOrder: index,
    }));

    await briefRepository.createFields(fieldRecords);

    // Dispatch scoring job
    await dispatchScoreBriefJob(brief.id);

    const createdFields = await briefRepository.getFieldsByBriefId(brief.id);
    await createBriefVersionSnapshot({
      workspaceId,
      brief,
      fields: createdFields,
      attachments: [],
    });

    // Write audit log (actorId may be null for public submissions)
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: submittedBy ?? null,
      actorType: submittedBy ? "user" : "client",
      entityType: "brief",
      entityId: brief.id,
      action: "create",
    });

    return {
      brief_id: brief.id,
      message: "Brief submitted successfully",
    };
  },

  async submitPendingBrief(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    responses: Record<string, unknown>;
  }) {
    const { workspaceId, projectId, briefId, responses } = data;
    const { existingFields, fieldConfigs } = await getPendingBriefContext(
      workspaceId,
      projectId,
      briefId,
    );
    const attachments = await briefAttachmentRepository.listByBriefId(briefId);
    const attachmentMap = new Map<string, BriefAttachmentSummary[]>();
    for (const attachment of attachments) {
      const existing = attachmentMap.get(attachment.fieldKey) ?? [];
      existing.push({
        id: attachment.id,
        fieldKey: attachment.fieldKey,
        originalName: attachment.originalName,
        fileUrl: attachment.fileUrl,
        mimeType: attachment.mimeType ?? null,
        sizeBytes: attachment.sizeBytes ?? null,
      });
      attachmentMap.set(attachment.fieldKey, existing);
    }

    for (const field of fieldConfigs) {
      if (!field.required) continue;
      if (!shouldShowField(field, responses)) continue;

      if (field.type === "file_upload") {
        const hasAttachments = (attachmentMap.get(field.key) ?? []).length > 0;
        if (!hasAttachments) {
          throw new ValidationError(`Missing required file upload: ${field.label}`);
        }
        continue;
      }

      const value = normalizeResponseValue(responses[field.key]);
      if (!value) {
        throw new ValidationError(`Missing required field: ${field.label}`);
      }
    }

    const existingFieldMap = new Map(existingFields.map((field) => [field.fieldKey, field]));

    for (const [index, field] of fieldConfigs.entries()) {
      const normalizedValue =
        field.type === "file_upload"
          ? (attachmentMap.get(field.key) ?? []).map((attachment) => attachment.originalName).join(", ")
          : normalizeResponseValue(responses[field.key]);
      const existingField = existingFieldMap.get(field.key);
      const fieldPayload = {
        fieldLabel: field.label,
        fieldType: field.type ?? "text",
        value: normalizedValue,
        sortOrder: field.order ?? index,
      };

      if (existingField) {
        await briefRepository.updateFieldValue(briefId, field.key, fieldPayload);
        continue;
      }

      await briefRepository.createFields([
        {
          briefId,
          fieldKey: field.key,
          ...fieldPayload,
        },
      ]);
    }

    await briefRepository.update(workspaceId, briefId, {
      status: "pending_score",
      submittedAt: new Date(),
    });

    await dispatchScoreBriefJob(briefId);

    const submittedBrief = await briefRepository.getById(workspaceId, briefId);
    if (!submittedBrief) {
      throw new NotFoundError("Brief", briefId);
    }
    const updatedFields = await briefRepository.getFieldsByBriefId(briefId);
    await createBriefVersionSnapshot({
      workspaceId,
      brief: submittedBrief,
      fields: updatedFields,
      attachments: await listBriefAttachments(briefId),
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "client",
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: { action: "portal_submit" },
    });

    return {
      brief_id: briefId,
      message: "Brief submitted successfully",
    };
  },

  async submitClarificationResponse(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    clarificationRequestId: string;
    responses: Record<string, unknown>;
  }) {
    const { workspaceId, projectId, briefId, clarificationRequestId, responses } = data;
    const { existingFields, fieldConfigs } = await getSubmittedBriefContext(
      workspaceId,
      projectId,
      briefId,
    );
    const clarificationRequest = await briefClarificationRepository.getRequestById(
      workspaceId,
      clarificationRequestId,
    );
    if (!clarificationRequest || clarificationRequest.briefId !== briefId) {
      throw new NotFoundError("BriefClarificationRequest", clarificationRequestId);
    }
    if (clarificationRequest.status !== "open") {
      throw new ValidationError("This clarification request is no longer active");
    }

    const attachments = await briefAttachmentRepository.listByBriefId(briefId);
    const attachmentMap = new Map<string, BriefAttachmentSummary[]>();
    for (const attachment of attachments) {
      const existing = attachmentMap.get(attachment.fieldKey) ?? [];
      existing.push({
        id: attachment.id,
        fieldKey: attachment.fieldKey,
        originalName: attachment.originalName,
        fileUrl: attachment.fileUrl,
        mimeType: attachment.mimeType ?? null,
        sizeBytes: attachment.sizeBytes ?? null,
      });
      attachmentMap.set(attachment.fieldKey, existing);
    }

    const existingFieldMap = new Map(existingFields.map((field) => [field.fieldKey, field]));

    for (const [index, field] of fieldConfigs.entries()) {
      if (field.type === "file_upload") {
        await syncAttachmentFieldValue(briefId, field);
        continue;
      }

      const hasResponse = Object.prototype.hasOwnProperty.call(responses, field.key);
      if (!hasResponse) continue;

      const normalizedValue = normalizeResponseValue(responses[field.key]);
      const existingField = existingFieldMap.get(field.key);
      const fieldPayload = {
        fieldLabel: field.label,
        fieldType: field.type ?? "text",
        value: normalizedValue,
        sortOrder: field.order ?? index,
      };

      if (existingField) {
        await briefRepository.updateFieldValue(briefId, field.key, fieldPayload);
      } else {
        await briefRepository.createFields([
          {
            briefId,
            fieldKey: field.key,
            ...fieldPayload,
          },
        ]);
      }
    }

    const updatedBrief = await briefRepository.update(workspaceId, briefId, {
      status: "pending_score",
      submittedAt: new Date(),
    });
    if (!updatedBrief) {
      throw new NotFoundError("Brief", briefId);
    }

    await briefClarificationRepository.resolveOpenByBriefId(workspaceId, briefId);
    const updatedFields = await briefRepository.getFieldsByBriefId(briefId);
    await createBriefVersionSnapshot({
      workspaceId,
      brief: updatedBrief,
      fields: updatedFields,
      attachments: await listBriefAttachments(briefId),
    });

    await dispatchScoreBriefJob(briefId);

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "client",
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: {
        action: "clarification_submitted",
        clarificationRequestId,
      },
    });

    return {
      brief_id: briefId,
      message: "Clarification submitted successfully",
    };
  },

  async savePendingBriefDraft(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    responses: Record<string, unknown>;
  }) {
    const { workspaceId, projectId, briefId, responses } = data;
    const { existingFields, fieldConfigs } = await getPendingBriefContext(
      workspaceId,
      projectId,
      briefId,
    );

    const existingFieldMap = new Map(existingFields.map((field) => [field.fieldKey, field]));

    for (const [index, field] of fieldConfigs.entries()) {
      if (field.type === "file_upload") {
        await syncAttachmentFieldValue(briefId, field);
        continue;
      }

      const hasResponse = Object.prototype.hasOwnProperty.call(responses, field.key);
      if (!hasResponse) continue;

      const normalizedValue = normalizeResponseValue(responses[field.key]);
      const existingField = existingFieldMap.get(field.key);
      const fieldPayload = {
        fieldLabel: field.label,
        fieldType: field.type ?? "text",
        value: normalizedValue,
        sortOrder: field.order ?? index,
      };

      if (existingField) {
        await briefRepository.updateFieldValue(briefId, field.key, fieldPayload);
      } else {
        await briefRepository.createFields([
          {
            briefId,
            fieldKey: field.key,
            ...fieldPayload,
          },
        ]);
      }
    }

    await briefRepository.update(workspaceId, briefId, {
      updatedAt: new Date(),
    });

    return {
      brief_id: briefId,
      message: "Draft saved",
    };
  },

  async getPendingBriefAttachmentUploadUrl(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    fieldKey: string;
    fileName: string;
    contentType: string;
  }) {
    const { workspaceId, projectId, briefId, fieldKey, fileName, contentType } = data;
    const { fieldConfigs } = await getPendingBriefContext(workspaceId, projectId, briefId);

    ensureFileUploadField(fieldConfigs, fieldKey);

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const objectKey = `briefs/${workspaceId}/${briefId}/${fieldKey}/${Date.now()}-${sanitizedFileName}`;
    const uploadUrl = await getUploadUrl(objectKey, contentType);

    return {
      upload_url: uploadUrl,
      object_key: objectKey,
    };
  },

  async confirmPendingBriefAttachment(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    fieldKey: string;
    objectKey: string;
    originalName: string;
    contentType?: string;
    fileSize?: number;
  }) {
    const { workspaceId, projectId, briefId, fieldKey, objectKey, originalName, contentType, fileSize } = data;
    const { fieldConfigs } = await getPendingBriefContext(workspaceId, projectId, briefId);

    const field = ensureFileUploadField(fieldConfigs, fieldKey);

    const fileUrl = await getDownloadUrl(objectKey);
    const attachment = await briefAttachmentRepository.create({
      workspaceId,
      briefId,
      fieldKey,
      objectKey,
      fileUrl,
      originalName,
      mimeType: contentType ?? null,
      sizeBytes: fileSize ?? null,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "client",
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: {
        action: "confirm_attachment_upload",
        attachmentId: attachment.id,
        fieldKey,
      },
    });

    await syncAttachmentFieldValue(briefId, field);

    return attachment;
  },

  async removePendingBriefAttachment(data: {
    workspaceId: string;
    projectId: string;
    briefId: string;
    attachmentId: string;
  }) {
    const { workspaceId, projectId, briefId, attachmentId } = data;
    const { fieldConfigs } = await getPendingBriefContext(workspaceId, projectId, briefId);

    const attachment = await briefAttachmentRepository.getById(workspaceId, attachmentId);
    if (!attachment || attachment.briefId !== briefId) {
      throw new NotFoundError("BriefAttachment", attachmentId);
    }

    const deleted = await briefAttachmentRepository.softDelete(workspaceId, attachmentId);
    if (!deleted) {
      throw new NotFoundError("BriefAttachment", attachmentId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "client",
      entityType: "brief",
      entityId: briefId,
      action: "update",
      metadata: {
        action: "remove_attachment",
        attachmentId,
        fieldKey: deleted.fieldKey,
      },
    });

    const field = fieldConfigs.find((entry) => entry.key === deleted.fieldKey);
    if (field) {
      await syncAttachmentFieldValue(briefId, field);
    }

    return deleted;
  },
};
