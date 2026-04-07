import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { db, projects, workspaces, clients, deliverables, briefs, briefFields, briefAttachments, changeOrders, eq, and, isNull, asc, desc } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { analyticsService } from "../services/analytics.service.js";
import { briefService } from "../services/brief.service.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { briefRepository } from "../repositories/brief.repository.js";
import { writeAuditLog } from "@novabots/db";
import {
  submitPendingBriefSchema,
  savePendingBriefDraftSchema,
  briefAttachmentUploadUrlSchema,
  confirmBriefAttachmentSchema,
  submitClarificationResponseSchema,
} from "./brief.schemas.js";

export const portalSessionRouter = new Hono();

portalSessionRouter.use("*", portalAuthMiddleware);

function normalizeFieldType(type?: string | null) {
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

function normalizeTemplateBranding(
  branding: unknown,
): {
  logoUrl?: string | null;
  accentColor?: string | null;
  introMessage?: string | null;
  successMessage?: string | null;
  supportEmail?: string | null;
} {
  if (!branding || typeof branding !== "object" || Array.isArray(branding)) {
    return {};
  }

  const record = branding as Record<string, unknown>;

  return {
    ...(typeof record.logoUrl === "string" ? { logoUrl: record.logoUrl } : {}),
    ...(typeof record.accentColor === "string" ? { accentColor: record.accentColor } : {}),
    ...(typeof record.introMessage === "string" ? { introMessage: record.introMessage } : {}),
    ...(typeof record.successMessage === "string" ? { successMessage: record.successMessage } : {}),
    ...(typeof record.supportEmail === "string" ? { supportEmail: record.supportEmail } : {}),
  };
}

portalSessionRouter.get("", async (c) => {
  const projectId = c.get("portalProjectId");
  const workspaceId = c.get("portalWorkspaceId");

  // Fetch project with client info
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      clientId: projects.clientId,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) throw new NotFoundError("Project", projectId);

  // Fetch workspace branding
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      logoUrl: workspaces.logoUrl,
      brandColor: workspaces.brandColor,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  // Fetch client name
  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, project.clientId))
    .limit(1);

  // Fetch pending brief (not submitted)
  let [pendingBrief] = await db
    .select()
    .from(briefs)
    .where(
      and(
        eq(briefs.projectId, projectId),
        isNull(briefs.submittedAt),
        isNull(briefs.deletedAt)
      )
    )
    .orderBy(desc(briefs.updatedAt), desc(briefs.createdAt))
    .limit(1);

  // Auto-provision a brief from the published template if none exists
  // This ensures the client sees the form when a template has been published
  if (!pendingBrief) {
    // Find the first published template for this workspace
    const publishedTemplates = await briefTemplateRepository.listPublished(workspaceId);
    const defaultTemplate = publishedTemplates?.[0] ?? null;

    if (defaultTemplate) {
      // Create a pending brief record linked to the published template
      pendingBrief = await db.transaction(async (trx) => {
        const inserted = await trx
          .insert(briefs)
          .values({
            projectId,
            workspaceId,
            templateId: defaultTemplate.id,
            templateVersionId: defaultTemplate.templateVersionId ?? null,
            title: defaultTemplate.name,
            status: "pending_score",
            submittedAt: null,
          })
          .returning();

        const newBrief = inserted[0];
        if (!newBrief) throw new Error("Failed to create brief");

        // Create brief_fields from the template's fields_json
        const templateFields = Array.isArray(defaultTemplate.fieldsJson)
          ? (defaultTemplate.fieldsJson as Array<{ key?: string; label?: string; type?: string; order?: number }>)
          : [];

        if (templateFields.length > 0) {
          await trx.insert(briefFields).values(
            templateFields.map((field, index) => ({
              briefId: newBrief.id,
              fieldKey: String(field.key ?? `field_${index}`),
              fieldLabel: String(field.label ?? `Field ${index + 1}`),
              fieldType: typeof field.type === "string" ? field.type : "text",
              sortOrder: typeof field.order === "number" ? field.order : index,
              value: null,
            })),
          );
        }

        await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "brief",
          entityId: newBrief.id,
          action: "create",
          metadata: {
            action: "brief_auto_provisioned",
            templateId: defaultTemplate.id,
            source: "portal_session",
            fieldsCount: templateFields.length,
          },
        });

        return newBrief;
      });
    }
  }

  const [clarificationBrief] = await db
    .select()
    .from(briefs)
    .where(
      and(
        eq(briefs.projectId, projectId),
        eq(briefs.workspaceId, workspaceId),
        isNull(briefs.deletedAt),
      ),
    )
    .orderBy(desc(briefs.updatedAt))
    .limit(1);

  let fields: any[] = [];
  let templateFields: Array<Record<string, unknown>> = [];
  let attachments: any[] = [];
  let activeBriefBranding: {
    logoUrl: string | null;
    accentColor: string;
    introMessage: string | null;
    successMessage: string | null;
    supportEmail: string | null;
    source: "workspace" | "template_override";
  } | null = null;
  const activeBrief =
    pendingBrief ??
    (clarificationBrief &&
    (clarificationBrief.status === "clarification_needed" || clarificationBrief.status === "rejected")
      ? clarificationBrief
      : null);

  let clarificationRequest: {
    id: string;
    status: string;
    message: string | null;
    requestedAt: string | Date;
    items: Array<{
      id: string;
      fieldKey: string;
      fieldLabel: string;
      prompt: string;
      severity: string;
      sourceFlagId: string | null;
      sortOrder: number;
    }>;
  } | null = null;

  if (activeBrief) {
    fields = await db
      .select()
      .from(briefFields)
      .where(eq(briefFields.briefId, activeBrief.id))
      .orderBy(asc(briefFields.sortOrder));

    if (activeBrief.templateId) {
      const pinnedTemplateVersion = activeBrief.templateVersionId
        ? await briefTemplateRepository.getVersionByBriefVersionId(
            workspaceId,
            activeBrief.templateVersionId,
          )
        : null;
      if (activeBrief.templateVersionId && !pinnedTemplateVersion) {
        throw new NotFoundError("BriefTemplateVersion", activeBrief.templateVersionId);
      }
      const templateVersion =
        pinnedTemplateVersion ??
        (await briefTemplateRepository.getLatestPublishedVersion(
          workspaceId,
          activeBrief.templateId,
        ));
      const template =
        templateVersion ?? (await briefTemplateRepository.getById(workspaceId, activeBrief.templateId));

      templateFields = Array.isArray(template?.fieldsJson)
        ? (template.fieldsJson as Array<Record<string, unknown>>)
        : [];

      const templateBranding = normalizeTemplateBranding(template?.brandingJson);
      activeBriefBranding = {
        logoUrl: templateBranding.logoUrl ?? workspace?.logoUrl ?? null,
        accentColor: templateBranding.accentColor ?? workspace?.brandColor ?? "#0F6E56",
        introMessage: templateBranding.introMessage ?? null,
        successMessage: templateBranding.successMessage ?? null,
        supportEmail: templateBranding.supportEmail ?? null,
        source:
          Object.keys(templateBranding).length > 0 ? "template_override" : "workspace",
      };
    }

    attachments = await db
      .select()
      .from(briefAttachments)
      .where(
        and(
          eq(briefAttachments.briefId, activeBrief.id),
          isNull(briefAttachments.deletedAt),
        ),
      )
      .orderBy(asc(briefAttachments.createdAt));

    if (activeBrief.status === "clarification_needed" || activeBrief.status === "rejected") {
      clarificationRequest = await briefService.getOpenClarificationRequest(workspaceId, activeBrief.id);
    }
  }

  const fieldValueMap = new Map(fields.map((field) => [field.fieldKey, field]));
  const attachmentMap = new Map<string, any[]>();
  for (const attachment of attachments) {
    const existing = attachmentMap.get(attachment.fieldKey) ?? [];
    existing.push(attachment);
    attachmentMap.set(attachment.fieldKey, existing);
  }
  const mergedFields =
    templateFields.length > 0
      ? templateFields.map((field, index) => {
          const key = String(field.key ?? `field_${index}`);
          const savedField = fieldValueMap.get(key);

          return {
            id: savedField?.id ?? `${activeBrief?.id ?? "brief"}:${key}`,
            briefId: activeBrief?.id ?? null,
            key,
            label: String(field.label ?? savedField?.fieldLabel ?? `Field ${index + 1}`),
            type: normalizeFieldType(
              typeof field.type === "string" ? field.type : savedField?.fieldType,
            ),
            placeholder:
              typeof field.placeholder === "string" ? field.placeholder : undefined,
            description:
              typeof field.helpText === "string"
                ? field.helpText
                : typeof field.description === "string"
                  ? field.description
                  : undefined,
            required: Boolean(field.required),
            options: Array.isArray(field.options)
              ? field.options.map((option) => String(option))
              : field.type === "boolean"
                ? ["Yes", "No"]
              : undefined,
            conditions: Array.isArray(field.conditions)
              ? field.conditions
              : [],
            order: typeof field.order === "number" ? field.order : index,
            value: savedField?.value ?? null,
            attachments: (attachmentMap.get(key) ?? []).map((attachment) => ({
              id: attachment.id,
              originalName: attachment.originalName,
              fileUrl: attachment.fileUrl,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
            })),
          };
        })
      : fields.map((field, index) => ({
          id: field.id,
          briefId: activeBrief?.id ?? null,
          key: field.fieldKey,
          label: field.fieldLabel,
          type: normalizeFieldType(field.fieldType),
          placeholder: undefined,
          description: undefined,
          required: false,
          options: undefined,
          conditions: [],
          order: index,
          value: field.value,
          attachments: (attachmentMap.get(field.fieldKey) ?? []).map((attachment) => ({
            id: attachment.id,
            originalName: attachment.originalName,
            fileUrl: attachment.fileUrl,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          })),
        }));

  // Fetch health stats
  const health = await analyticsService.getProjectHealth(workspaceId, projectId);

  // Fetch deliverables for the project
  const projectDeliverables = await db
    .select({
      id: deliverables.id,
      name: deliverables.name,
      status: deliverables.status,
      revisionRound: deliverables.revisionRound,
      maxRevisions: deliverables.maxRevisions,
      fileUrl: deliverables.fileUrl,
      mimeType: deliverables.mimeType,
      externalUrl: deliverables.externalUrl,
      type: deliverables.type,
    })
    .from(deliverables)
    .where(
      and(
        eq(deliverables.projectId, projectId),
        isNull(deliverables.deletedAt),
      ),
    );

  // Fetch sent change orders for the portal
  const sentChangeOrders = await db
    .select({
      id: changeOrders.id,
      title: changeOrders.title,
      workDescription: changeOrders.workDescription,
      pricing: changeOrders.pricing,
      status: changeOrders.status,
      sentAt: changeOrders.sentAt,
      respondedAt: changeOrders.respondedAt,
    })
    .from(changeOrders)
    .where(
      and(
        eq(changeOrders.projectId, projectId),
        eq(changeOrders.status, "sent"),
      ),
  );

  if (!workspace) {
    throw new NotFoundError("Workspace", workspaceId);
  }

  return c.json({
    data: {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        clientName: client?.name ?? null,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        logoUrl: workspace.logoUrl,
        brandColor: workspace.brandColor ?? "#0F6E56",
        plan: (workspace as any).plan ?? "solo",
      },
      deliverables: projectDeliverables,
      health,
      pendingBrief: pendingBrief ? {
        ...pendingBrief,
        branding: activeBrief?.id === pendingBrief.id ? activeBriefBranding : null,
        fields: mergedFields,
      } : null,
      clarificationBrief:
        activeBrief && activeBrief.id !== pendingBrief?.id
          ? {
              ...activeBrief,
              branding: activeBriefBranding,
              fields: mergedFields,
            }
          : null,
      clarificationRequest,
      pendingChangeOrders: sentChangeOrders.map((changeOrder) => ({
        id: changeOrder.id,
        title: changeOrder.title,
        description: changeOrder.workDescription ?? null,
        amount:
          typeof (changeOrder.pricing as Record<string, unknown> | null)?.total === "number"
            ? ((changeOrder.pricing as Record<string, unknown>).total as number)
            : null,
        status: changeOrder.status,
        sentAt: changeOrder.sentAt,
        respondedAt: changeOrder.respondedAt,
      })),
    },
  });
});

portalSessionRouter.post(
  "/brief/draft",
  zValidator("json", savePendingBriefDraftSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const body = c.req.valid("json");

    const result = await briefService.savePendingBriefDraft({
      workspaceId,
      projectId,
      briefId: body.briefId,
      responses: body.responses,
    });

    return c.json(result);
  },
);

portalSessionRouter.post(
  "/brief/files/upload-url",
  zValidator("json", briefAttachmentUploadUrlSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const body = c.req.valid("json");

    const result = await briefService.getPendingBriefAttachmentUploadUrl({
      workspaceId,
      projectId,
      briefId: body.briefId,
      fieldKey: body.fieldKey,
      fileName: body.fileName,
      contentType: body.contentType,
    });

    return c.json({ data: result });
  },
);

portalSessionRouter.post(
  "/brief/files/confirm-upload",
  zValidator("json", confirmBriefAttachmentSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const body = c.req.valid("json");

    const result = await briefService.confirmPendingBriefAttachment({
      workspaceId,
      projectId,
      briefId: body.briefId,
      fieldKey: body.fieldKey,
      objectKey: body.objectKey,
      originalName: body.originalName,
      ...(body.contentType !== undefined ? { contentType: body.contentType } : {}),
      ...(body.fileSize !== undefined ? { fileSize: body.fileSize } : {}),
    });

    return c.json({ data: result }, 201);
  },
);

portalSessionRouter.delete(
  "/brief/files/:attachmentId",
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const attachmentId = c.req.param("attachmentId");
    const briefId = c.req.query("briefId");

    if (!briefId) {
      throw new ValidationError("briefId query parameter is required");
    }

    const result = await briefService.removePendingBriefAttachment({
      workspaceId,
      projectId,
      briefId,
      attachmentId,
    });

    return c.json({ data: result });
  },
);

portalSessionRouter.post(
  "/brief/submit",
  zValidator("json", submitPendingBriefSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const body = c.req.valid("json");

    const result = await briefService.submitPendingBrief({
      workspaceId,
      projectId,
      briefId: body.briefId,
      responses: body.responses,
    });

    return c.json(result, 201);
  },
);

portalSessionRouter.post(
  "/brief/clarify-submit",
  zValidator("json", submitClarificationResponseSchema),
  async (c) => {
    const projectId = c.get("portalProjectId");
    const workspaceId = c.get("portalWorkspaceId");
    const body = c.req.valid("json");

    const result = await briefService.submitClarificationResponse({
      workspaceId,
      projectId,
      briefId: body.briefId,
      clarificationRequestId: body.clarificationRequestId,
      responses: body.responses,
    });

    return c.json(result, 201);
  },
);
