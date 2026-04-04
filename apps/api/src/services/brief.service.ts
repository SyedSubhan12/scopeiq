import { briefRepository } from "../repositories/brief.repository.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";
import { dispatchScoreBriefJob } from "../jobs/score-brief.job.js";

export const briefService = {
  async listBriefs(
    workspaceId: string,
    options: { projectId?: string; status?: string },
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
    return { ...brief, fields };
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

  async submitBrief(data: {
    templateId: string;
    projectId: string;
    responses: Record<string, unknown>;
    workspaceId: string;
    submittedBy?: string;
    title?: string;
  }) {
    const { templateId, projectId, responses, workspaceId, submittedBy, title } = data;

    // Look up the template to validate it belongs to the workspace
    const template = await briefTemplateRepository.getById(workspaceId, templateId);
    if (!template) {
      throw new NotFoundError("BriefTemplate", templateId);
    }

    // Validate responses against template fields_json
    const templateFields = (template.fieldsJson ?? []) as Array<{
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
      title: title ?? template.name,
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
};
