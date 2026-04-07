import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

type BriefTemplateBranding = {
  logoUrl?: string | null;
  accentColor?: string | null;
  introMessage?: string | null;
  successMessage?: string | null;
  supportEmail?: string | null;
};

function normalizeBranding(
  branding: unknown,
  existingBranding?: unknown,
): BriefTemplateBranding {
  const current =
    existingBranding && typeof existingBranding === "object" && !Array.isArray(existingBranding)
      ? (existingBranding as BriefTemplateBranding)
      : {};

  const incoming =
    branding && typeof branding === "object" && !Array.isArray(branding)
      ? (branding as BriefTemplateBranding)
      : {};

  return stripUndefined({
    ...current,
    logoUrl: incoming.logoUrl,
    accentColor: incoming.accentColor,
    introMessage: incoming.introMessage,
    successMessage: incoming.successMessage,
    supportEmail: incoming.supportEmail,
  }) as BriefTemplateBranding;
}

export const briefTemplateService = {
  async listTemplates(workspaceId: string) {
    return briefTemplateRepository.list(workspaceId);
  },

  async getTemplate(workspaceId: string, templateId: string) {
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }
    return template;
  },

  async createTemplate(
    workspaceId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const { name, description, fieldsJson, isDefault } = data as {
      name: string;
      description?: string;
      fieldsJson?: unknown[];
      brandingJson?: BriefTemplateBranding;
      isDefault?: boolean;
    };

    if (isDefault) {
      await briefTemplateRepository.clearDefault(workspaceId);
    }

    const template = await briefTemplateRepository.create({
      workspaceId,
      name,
      description: description ?? null,
      fieldsJson: fieldsJson ?? [],
      brandingJson: normalizeBranding((data as { brandingJson?: unknown }).brandingJson),
      isDefault: isDefault ?? false,
      status: "draft",
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: template.id,
      action: "create",
    });

    return template;
  },

  async updateTemplate(
    workspaceId: string,
    templateId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const normalized = stripUndefined(data) as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(normalized, "brandingJson")) {
      const existingTemplate = await briefTemplateRepository.getById(workspaceId, templateId);
      if (!existingTemplate) {
        throw new NotFoundError("BriefTemplate", templateId);
      }

      normalized.brandingJson = normalizeBranding(
        normalized.brandingJson,
        existingTemplate.brandingJson,
      );
    }

    if (normalized.isDefault === true) {
      await briefTemplateRepository.clearDefault(workspaceId, templateId);
    }

    const template = await briefTemplateRepository.update(
      workspaceId,
      templateId,
      normalized,
    );
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: templateId,
      action: "update",
      metadata: { fields: Object.keys(normalized) },
    });

    return template;
  },

  async listTemplateVersions(workspaceId: string, templateId: string) {
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }

    return briefTemplateRepository.listVersions(workspaceId, templateId);
  },

  async publishTemplate(workspaceId: string, templateId: string, actorId: string) {
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }
    if (template.status === "archived") {
      throw new ValidationError("Archived templates must be restored before publishing");
    }

    const fields = Array.isArray(template.fieldsJson) ? template.fieldsJson : [];
    if (fields.length === 0) {
      throw new ValidationError("Template must include at least one field before publishing");
    }

    const latestVersion = await briefTemplateRepository.getLatestVersion(workspaceId, templateId);
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
    const publishedAt = new Date();

    const version = await briefTemplateRepository.createVersion({
      workspaceId,
      templateId,
      versionNumber: nextVersionNumber,
      name: template.name,
      description: template.description ?? null,
      fieldsJson: fields,
      brandingJson: normalizeBranding(template.brandingJson),
      isDefault: template.isDefault,
      templateStatus: "published",
      publishedBy: actorId,
      publishedAt,
    });

    const updatedTemplate = await briefTemplateRepository.update(workspaceId, templateId, {
      status: "published",
      publishedAt,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: templateId,
      action: "update",
      metadata: {
        lifecycle: "published",
        versionId: version.id,
        versionNumber: version.versionNumber,
      },
    });

    return {
      template: updatedTemplate ?? template,
      version,
    };
  },

  async restoreTemplateVersion(
    workspaceId: string,
    templateId: string,
    versionId: string,
    actorId: string,
  ) {
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }

    const version = await briefTemplateRepository.getVersionById(workspaceId, templateId, versionId);
    if (!version) {
      throw new NotFoundError("BriefTemplateVersion", versionId);
    }

    if (version.isDefault) {
      await briefTemplateRepository.clearDefault(workspaceId, templateId);
    }

    const restored = await briefTemplateRepository.update(workspaceId, templateId, {
      name: version.name,
      description: version.description ?? null,
      fieldsJson: Array.isArray(version.fieldsJson) ? version.fieldsJson : [],
      brandingJson: normalizeBranding(version.brandingJson),
      isDefault: version.isDefault,
      status: "draft",
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: templateId,
      action: "update",
      metadata: {
        lifecycle: "restored_version",
        versionId: version.id,
        versionNumber: version.versionNumber,
      },
    });

    return restored ?? template;
  },

  async deleteTemplate(workspaceId: string, templateId: string, actorId: string) {
    const template = await briefTemplateRepository.softDelete(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: templateId,
      action: "update",
      metadata: { lifecycle: "archived" },
    });

    return template;
  },
};
