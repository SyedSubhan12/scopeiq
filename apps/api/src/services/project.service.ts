import { projectRepository } from "../repositories/project.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { generatePortalToken } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

export const projectService = {
  async listProjects(
    workspaceId: string,
    options: Record<string, unknown>,
  ) {
    const clean = stripUndefined(options) as { status?: string; clientId?: string; cursor?: string; limit?: number };
    return projectRepository.list(workspaceId, clean);
  },

  async getProject(workspaceId: string, projectId: string) {
    const project = await projectRepository.getById(workspaceId, projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }
    return project;
  },

  async createProject(
    workspaceId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const { name, clientId, description, budget, startDate, endDate } = data as {
      name: string;
      clientId: string;
      description?: string;
      budget?: number;
      startDate?: string;
      endDate?: string;
    };

    const project = await projectRepository.create({
      workspaceId,
      clientId,
      name,
      description: description ?? null,
      budget: budget ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      portalToken: generatePortalToken(),
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "project",
      entityId: project.id,
      action: "create",
    });

    return project;
  },

  async updateProject(
    workspaceId: string,
    projectId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const project = await projectRepository.update(workspaceId, projectId, stripUndefined(data));
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "project",
      entityId: projectId,
      action: "update",
      metadata: { fields: Object.keys(data) },
    });

    return project;
  },

  async deleteProject(workspaceId: string, projectId: string, actorId: string) {
    const project = await projectRepository.softDelete(workspaceId, projectId);
    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "project",
      entityId: projectId,
      action: "delete",
    });

    return project;
  },
};
