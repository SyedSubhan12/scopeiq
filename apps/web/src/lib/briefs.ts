export type TemplateStatus = "draft" | "published" | "archived";

export type BriefTemplateBrandingRecord = {
  logoUrl?: string | null;
  accentColor?: string | null;
  introMessage?: string | null;
  successMessage?: string | null;
  supportEmail?: string | null;
  source?: "workspace" | "template_override" | null;
};

export type ReviewStatus =
  | "pending_score"
  | "scoring"
  | "scored"
  | "clarification_needed"
  | "approved"
  | "rejected";

export type SaveState = "idle" | "saving" | "saved" | "error";

export type BriefFieldCondition = {
  field_key: string;
  operator: "equals" | "not_equals" | "contains";
  value: string;
};

export type BriefTemplateField = {
  key: string;
  type: "text" | "textarea" | "single_choice" | "multi_choice" | "date" | "file_upload";
  label: string;
  placeholder?: string | undefined;
  helpText?: string | undefined;
  required: boolean;
  options?: string[] | undefined;
  conditions?: BriefFieldCondition[] | undefined;
  order: number;
};

export type BriefTemplateRecord = {
  id: string;
  name: string;
  description?: string | null;
  fields: BriefTemplateField[];
  isDefault?: boolean | null;
  status: TemplateStatus;
  publishedAt?: string | null;
  branding?: BriefTemplateBrandingRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type BriefTemplateVersionRecord = {
  id: string;
  templateId: string;
  versionNumber: number;
  name: string;
  description?: string | null;
  fields: BriefTemplateField[];
  isDefault: boolean;
  templateStatus: TemplateStatus;
  publishedBy?: string | null;
  publishedAt: string;
  branding?: BriefTemplateBrandingRecord | null;
  createdAt: string;
};

export function normalizeTemplateBranding(rawBranding: unknown): BriefTemplateBrandingRecord | null {
  if (!rawBranding || typeof rawBranding !== "object" || Array.isArray(rawBranding)) {
    return null;
  }

  const record = rawBranding as Record<string, unknown>;
  const branding: BriefTemplateBrandingRecord = {};

  if (typeof record.logoUrl === "string") branding.logoUrl = record.logoUrl;
  if (typeof record.logo_url === "string") branding.logoUrl = record.logo_url;
  if (typeof record.accentColor === "string") branding.accentColor = record.accentColor;
  if (typeof record.accent_color === "string") branding.accentColor = record.accent_color;
  if (typeof record.introMessage === "string") branding.introMessage = record.introMessage;
  if (typeof record.intro_message === "string") branding.introMessage = record.intro_message;
  if (typeof record.successMessage === "string") branding.successMessage = record.successMessage;
  if (typeof record.success_message === "string") branding.successMessage = record.success_message;
  if (typeof record.supportEmail === "string") branding.supportEmail = record.supportEmail;
  if (typeof record.support_email === "string") branding.supportEmail = record.support_email;

  if (record.source === "workspace" || record.source === "template_override") {
    branding.source = record.source;
  } else if (record.mode === "workspace" || record.mode === "template_override") {
    branding.source = record.mode;
  }

  return Object.keys(branding).length > 0 ? branding : null;
}

export type BriefFieldValue = {
  id?: string | undefined;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  value: string | null;
  sortOrder: number;
};

export type BriefAttachment = {
  id: string;
  fieldKey: string;
  originalName: string;
  fileUrl: string;
  mimeType?: string | null | undefined;
  sizeBytes?: number | null | undefined;
};

export type BriefFlag = {
  id: string;
  fieldKey?: string | null | undefined;
  severity: "low" | "medium" | "high";
  message: string;
  suggestedQuestion?: string | null | undefined;
};

export type BriefRecord = {
  id: string;
  projectId: string;
  templateId: string | null;
  templateVersionId?: string | null;
  reviewerId?: string | null;
  title?: string | null;
  status: ReviewStatus;
  scopeScore?: number | null;
  scoringResultJson?: {
    flags?: Array<{
      id?: string;
      field_key?: string;
      severity?: "low" | "medium" | "high";
      message?: string;
      suggested_question?: string;
    }>;
    summary?: string;
  } | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  fields?: BriefFieldValue[] | undefined;
  attachments?: BriefAttachment[] | undefined;
  versions?: BriefVersionRecord[] | undefined;
  flags: BriefFlag[];
};

export type BriefVersionRecord = {
  id: string;
  briefId: string;
  versionNumber: number;
  title: string;
  status: ReviewStatus;
  scopeScore?: number | null;
  scoringResultJson?: BriefRecord["scoringResultJson"];
  answers: BriefFieldValue[];
  attachments: BriefAttachment[];
  reviewerId?: string | null;
  reviewNote?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTemplateStatus(value?: string | null): TemplateStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

export function normalizeTemplateFields(rawFields: unknown): BriefTemplateField[] {
  if (!Array.isArray(rawFields)) return [];

  return rawFields.map((field, index) => {
    const record = (field ?? {}) as Record<string, unknown>;
    const type = record.type;
    const normalizedField: BriefTemplateField = {
      key: String(record.key ?? `field_${index}`),
      label: String(record.label ?? `Field ${index + 1}`),
      type:
        type === "textarea" ||
        type === "single_choice" ||
        type === "multi_choice" ||
        type === "date" ||
        type === "file_upload"
          ? type
          : "text",
      required: Boolean(record.required),
      order: typeof record.order === "number" ? record.order : index,
    };

    if (typeof record.placeholder === "string") {
      normalizedField.placeholder = record.placeholder;
    }
    if (typeof record.helpText === "string") {
      normalizedField.helpText = record.helpText;
    } else if (typeof record.description === "string") {
      normalizedField.helpText = record.description;
    }
    if (Array.isArray(record.options)) {
      normalizedField.options = record.options.map((option) => String(option));
    }
    if (Array.isArray(record.conditions)) {
      normalizedField.conditions = record.conditions as BriefFieldCondition[];
    } else {
      normalizedField.conditions = [];
    }

    return normalizedField;
  });
}

export function mapTemplateRecord(raw: Record<string, unknown>): BriefTemplateRecord {
  return {
    id: String(raw.id),
    name: String(raw.name ?? "Untitled template"),
    description: typeof raw.description === "string" ? raw.description : null,
    fields: normalizeTemplateFields(raw.fieldsJson),
    isDefault: Boolean(raw.isDefault),
    status: normalizeTemplateStatus(typeof raw.status === "string" ? raw.status : null),
    publishedAt:
      typeof raw.publishedAt === "string"
        ? raw.publishedAt
        : typeof raw.published_at === "string"
          ? raw.published_at
          : null,
    branding: normalizeTemplateBranding(
      raw.branding ?? raw.brandingJson ?? raw.branding_json ?? raw.brandingOverride ?? raw.branding_override,
    ),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export function mapTemplateVersionRecord(raw: Record<string, unknown>): BriefTemplateVersionRecord {
  return {
    id: String(raw.id),
    templateId:
      typeof raw.templateId === "string"
        ? raw.templateId
        : typeof raw.template_id === "string"
          ? raw.template_id
          : "",
    versionNumber:
      typeof raw.versionNumber === "number"
        ? raw.versionNumber
        : typeof raw.version_number === "number"
          ? raw.version_number
          : 1,
    name: String(raw.name ?? "Untitled template"),
    description: typeof raw.description === "string" ? raw.description : null,
    fields: normalizeTemplateFields(raw.fieldsJson ?? raw.fields_json),
    isDefault: Boolean(raw.isDefault ?? raw.is_default),
    templateStatus: normalizeTemplateStatus(
      typeof raw.templateStatus === "string"
        ? raw.templateStatus
        : typeof raw.template_status === "string"
          ? raw.template_status
          : "published",
    ),
    publishedBy:
      typeof raw.publishedBy === "string"
        ? raw.publishedBy
        : typeof raw.published_by === "string"
          ? raw.published_by
          : null,
    publishedAt: String(raw.publishedAt ?? raw.published_at ?? new Date().toISOString()),
    branding: normalizeTemplateBranding(
      raw.branding ?? raw.brandingJson ?? raw.branding_json ?? raw.brandingOverride ?? raw.branding_override,
    ),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
}

export function mapBriefFlags(raw: unknown): BriefFlag[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((flag, index) => {
    const record = (flag ?? {}) as Record<string, unknown>;
    const severity = record.severity;
    return {
      id: String(record.id ?? `flag_${index}`),
      fieldKey: typeof record.field_key === "string" ? record.field_key : null,
      severity:
        severity === "low" || severity === "medium" || severity === "high"
          ? severity
          : "medium",
      message: String(record.message ?? "Missing detail"),
      suggestedQuestion:
        typeof record.suggested_question === "string" ? record.suggested_question : null,
    };
  });
}

export function mapBriefFields(raw: unknown): BriefFieldValue[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((field, index) => {
    const record = (field ?? {}) as Record<string, unknown>;
    const mapped: BriefFieldValue = {
      fieldKey: String(record.fieldKey ?? record.field_key ?? `field_${index}`),
      fieldLabel: String(record.fieldLabel ?? record.field_label ?? `Field ${index + 1}`),
      fieldType: String(record.fieldType ?? record.field_type ?? "text"),
      value:
        record.value === null || record.value === undefined ? null : String(record.value),
      sortOrder:
        typeof record.sortOrder === "number"
          ? record.sortOrder
          : typeof record.sort_order === "number"
            ? record.sort_order
            : index,
    };
    if (typeof record.id === "string") {
      mapped.id = record.id;
    }
    return mapped;
  });
}

export function mapBriefAttachments(raw: unknown): BriefAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((attachment, index) => {
    const record = (attachment ?? {}) as Record<string, unknown>;
    return {
      id: String(record.id ?? `attachment_${index}`),
      fieldKey: String(record.fieldKey ?? record.field_key ?? ""),
      originalName: String(record.originalName ?? record.original_name ?? "Attachment"),
      fileUrl: String(record.fileUrl ?? record.file_url ?? ""),
      mimeType:
        typeof record.mimeType === "string"
          ? record.mimeType
          : typeof record.mime_type === "string"
            ? record.mime_type
            : null,
      sizeBytes:
        typeof record.sizeBytes === "number"
          ? record.sizeBytes
          : typeof record.size_bytes === "number"
            ? record.size_bytes
            : null,
    };
  });
}

export function mapBriefVersionRecord(raw: Record<string, unknown>): BriefVersionRecord {
  const scoring = (raw.scoringResultJson ?? raw.scoring_result_json ?? null) as
    | Record<string, unknown>
    | null;

  return {
    id: String(raw.id),
    briefId: String(raw.briefId ?? raw.brief_id ?? ""),
    versionNumber:
      typeof raw.versionNumber === "number"
        ? raw.versionNumber
        : typeof raw.version_number === "number"
          ? raw.version_number
          : 1,
    title: String(raw.title ?? "Untitled version"),
    status: String(raw.status ?? "pending_score") as ReviewStatus,
    scopeScore:
      typeof raw.scopeScore === "number"
        ? raw.scopeScore
        : typeof raw.scope_score === "number"
          ? raw.scope_score
          : null,
    scoringResultJson: scoring
      ? {
          flags: mapBriefFlags(scoring.flags),
          ...(typeof scoring.summary === "string" ? { summary: scoring.summary } : {}),
        }
      : null,
    answers: mapBriefFields(raw.answersJson ?? raw.answers_json),
    attachments: mapBriefAttachments(raw.attachmentsJson ?? raw.attachments_json),
    reviewerId:
      typeof raw.reviewerId === "string"
        ? raw.reviewerId
        : typeof raw.reviewer_id === "string"
          ? raw.reviewer_id
          : null,
    reviewNote:
      typeof raw.reviewNote === "string"
        ? raw.reviewNote
        : typeof raw.review_note === "string"
          ? raw.review_note
          : null,
    submittedBy:
      typeof raw.submittedBy === "string"
        ? raw.submittedBy
        : typeof raw.submitted_by === "string"
          ? raw.submitted_by
          : null,
    submittedAt:
      typeof raw.submittedAt === "string"
        ? raw.submittedAt
        : typeof raw.submitted_at === "string"
          ? raw.submitted_at
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
  };
}

export function mapBriefRecord(raw: Record<string, unknown>): BriefRecord {
  const scoring = (raw.scoringResultJson ?? raw.scoring_result_json ?? null) as
    | Record<string, unknown>
    | null;
  const flags = mapBriefFlags(scoring?.flags);

  return {
    id: String(raw.id),
    projectId: String(raw.projectId ?? raw.project_id ?? ""),
    templateId:
      typeof raw.templateId === "string"
        ? raw.templateId
        : typeof raw.template_id === "string"
          ? raw.template_id
          : null,
    templateVersionId:
      typeof raw.templateVersionId === "string"
        ? raw.templateVersionId
        : typeof raw.template_version_id === "string"
          ? raw.template_version_id
          : null,
    reviewerId:
      typeof raw.reviewerId === "string"
        ? raw.reviewerId
        : typeof raw.reviewer_id === "string"
          ? raw.reviewer_id
          : null,
    title: typeof raw.title === "string" ? raw.title : null,
    status: String(raw.status ?? "pending_score") as ReviewStatus,
    scopeScore:
      typeof raw.scopeScore === "number"
        ? raw.scopeScore
        : typeof raw.scope_score === "number"
          ? raw.scope_score
          : null,
    scoringResultJson: scoring
      ? {
          flags,
          ...(typeof scoring.summary === "string" ? { summary: scoring.summary } : {}),
        }
      : null,
    submittedAt:
      typeof raw.submittedAt === "string"
        ? raw.submittedAt
        : typeof raw.submitted_at === "string"
          ? raw.submitted_at
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
    fields: mapBriefFields(raw.fields),
    attachments: mapBriefAttachments(raw.attachments),
    versions: Array.isArray(raw.versions)
      ? raw.versions.map((entry) => mapBriefVersionRecord(entry as Record<string, unknown>))
      : [],
    flags,
  };
}

export function getReviewStatusMeta(status: ReviewStatus) {
  switch (status) {
    case "approved":
      return { label: "Approved", badgeStatus: "approved" as const };
    case "clarification_needed":
      return { label: "Clarification needed", badgeStatus: "pending" as const };
    case "rejected":
      return { label: "Held", badgeStatus: "flagged" as const };
    case "scored":
      return { label: "Ready", badgeStatus: "active" as const };
    case "scoring":
      return { label: "Scoring", badgeStatus: "active" as const };
    default:
      return { label: "Pending score", badgeStatus: "draft" as const };
  }
}

export function getTemplateStatusMeta(status: TemplateStatus) {
  switch (status) {
    case "published":
      return { label: "Published", badgeStatus: "approved" as const };
    case "archived":
      return { label: "Archived", badgeStatus: "archived" as const };
    default:
      return { label: "Draft", badgeStatus: "draft" as const };
  }
}

export function getScoreTone(score?: number | null) {
  if (score == null) return "draft" as const;
  if (score >= 80) return "approved" as const;
  if (score >= 60) return "pending" as const;
  return "flagged" as const;
}
