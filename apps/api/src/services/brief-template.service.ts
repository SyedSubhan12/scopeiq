import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

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
      isDefault?: boolean;
    };

    const template = await briefTemplateRepository.create({
      workspaceId,
      name,
      description: description ?? null,
      fieldsJson: fieldsJson ?? [],
      isDefault: isDefault ?? false,
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
    const template = await briefTemplateRepository.update(
      workspaceId,
      templateId,
      stripUndefined(data),
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
      metadata: { fields: Object.keys(data) },
    });

    return template;
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
      action: "delete",
    });

    return template;
  },
};
