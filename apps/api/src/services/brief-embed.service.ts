import { randomBytes } from "node:crypto";
import { db, writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { briefEmbedRepository } from "../repositories/brief-embed.repository.js";
import { briefRepository } from "../repositories/brief.repository.js";
import { projectRepository } from "../repositories/project.repository.js";
import { stripUndefined } from "../lib/strip-undefined.js";

function generateEmbedToken(): string {
  return randomBytes(24).toString("hex");
}

export type FormFieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "email" | "url";
  required: boolean;
  placeholder?: string | undefined;
  helpText?: string | undefined;
  options?: string[] | undefined;
};

export type FormConfig = {
  title?: string | undefined;
  description?: string | undefined;
  fields: FormFieldConfig[];
  submitLabel?: string | undefined;
};

export type PublicSubmitInput = {
  clientName: string;
  clientEmail: string;
  projectName: string;
  responses: Record<string, unknown>;
};

export const briefEmbedService = {
  async list(workspaceId: string) {
    return briefEmbedRepository.list(workspaceId);
  },

  async getById(workspaceId: string, id: string) {
    const embed = await briefEmbedRepository.getById(workspaceId, id);
    if (!embed) throw new NotFoundError("BriefEmbed", id);
    return embed;
  },

  async create(workspaceId: string, actorId: string, formConfig: FormConfig) {
    if (!formConfig.fields || formConfig.fields.length === 0) {
      throw new ValidationError("formConfig.fields must not be empty");
    }

    const token = generateEmbedToken();

    const embed = await briefEmbedRepository.create(
      stripUndefined({
        workspaceId,
        token,
        formConfigJson: formConfig as unknown as Record<string, unknown>,
        isActive: true,
      }),
    );

    await writeAuditLog(db, {
      workspaceId,
      actorId,
      action: "create",
      entityType: "brief_embed",
      entityId: embed.id,
      metadata: { token },
    });

    return embed;
  },

  async update(
    workspaceId: string,
    actorId: string,
    id: string,
    data: { formConfig?: FormConfig | undefined; isActive?: boolean | undefined },
  ) {
    const embed = await briefEmbedRepository.getById(workspaceId, id);
    if (!embed) throw new NotFoundError("BriefEmbed", id);

    const patch: Record<string, unknown> = {};
    if (data.formConfig !== undefined) {
      if (data.formConfig.fields.length === 0) {
        throw new ValidationError("formConfig.fields must not be empty");
      }
      patch["formConfigJson"] = data.formConfig as unknown as Record<string, unknown>;
    }
    if (data.isActive !== undefined) {
      patch["isActive"] = data.isActive;
    }

    const updated = await briefEmbedRepository.update(workspaceId, id, patch as Parameters<typeof briefEmbedRepository.update>[2]);

    await writeAuditLog(db, {
      workspaceId,
      actorId,
      action: "update",
      entityType: "brief_embed",
      entityId: id,
      metadata: { fields: Object.keys(patch) },
    });

    return updated;
  },

  async rotateToken(workspaceId: string, actorId: string, id: string) {
    const embed = await briefEmbedRepository.getById(workspaceId, id);
    if (!embed) throw new NotFoundError("BriefEmbed", id);

    const newToken = generateEmbedToken();
    const updated = await briefEmbedRepository.update(workspaceId, id, { token: newToken });

    await writeAuditLog(db, {
      workspaceId,
      actorId,
      action: "update",
      entityType: "brief_embed",
      entityId: id,
      metadata: { previousTokenHint: embed.token.slice(0, 8) + "...", event: "token_rotated" },
    });

    return updated;
  },

  async deactivate(workspaceId: string, actorId: string, id: string) {
    const embed = await briefEmbedRepository.getById(workspaceId, id);
    if (!embed) throw new NotFoundError("BriefEmbed", id);

    await briefEmbedRepository.softDelete(workspaceId, id);

    await writeAuditLog(db, {
      workspaceId,
      actorId,
      action: "delete",
      entityType: "brief_embed",
      entityId: id,
      metadata: {},
    });

    return { success: true };
  },

  async getPublicFormConfig(token: string) {
    const embed = await briefEmbedRepository.getByToken(token);
    if (!embed || !embed.isActive) throw new NotFoundError("BriefEmbed", token);
    return {
      embedId: embed.id,
      workspaceId: embed.workspaceId,
      formConfig: embed.formConfigJson as FormConfig,
    };
  },

  async submitPublicForm(token: string, input: PublicSubmitInput) {
    const embed = await briefEmbedRepository.getByToken(token);
    if (!embed || !embed.isActive) throw new NotFoundError("BriefEmbed", token);

    const formConfig = embed.formConfigJson as FormConfig;

    // Validate required fields
    for (const field of formConfig.fields) {
      if (field.required && !input.responses[field.key]) {
        throw new ValidationError(`Field "${field.label}" is required`);
      }
    }

    // Find or use a default "inbox" project for the workspace
    const projectsResult = await projectRepository.list(embed.workspaceId, {});
    const inboxProject = projectsResult.data[0];
    if (!inboxProject) {
      throw new ValidationError("Workspace has no projects to attach intake to");
    }

    const brief = await briefRepository.create({
      workspaceId: embed.workspaceId,
      projectId: inboxProject.id,
      title: sanitizeText(input.projectName, 255) || "Intake via embed form",
      status: "pending_score",
      version: 1,
      scoringResultJson: {
        source: "embed",
        embedId: embed.id,
        clientName: sanitizeText(input.clientName, 255),
        clientEmail: sanitizeText(input.clientEmail, 320),
        responses: sanitizeResponses(input.responses),
      },
    });

    await writeAuditLog(db, {
      workspaceId: embed.workspaceId,
      actorId: brief.id, // public submission — use brief id as actor
      actorType: "system",
      action: "create",
      entityType: "brief",
      entityId: brief.id,
      metadata: { embedId: embed.id, clientEmail: sanitizeText(input.clientEmail, 320), event: "embed_submission" },
    });

    return { briefId: brief.id };
  },
};

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

function sanitizeResponses(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = sanitizeText(k, 100);
    if (!key) continue;
    if (typeof v === "string") {
      out[key] = sanitizeText(v, 5000);
    } else if (Array.isArray(v)) {
      out[key] = v.map((item) => sanitizeText(item, 500)).join(", ");
    }
  }
  return out;
}
