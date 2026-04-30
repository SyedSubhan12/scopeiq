import { projectRepository } from "../repositories/project.repository.js";
import { writeAuditLog, db, generatePortalToken, statementsOfWork, sowClauses, clients, workspaces, eq, and, isNull } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";
import { briefService } from "./brief.service.js";
import { deliverableService } from "./deliverable.service.js";
import { sendPortalInvitationEmail as sendPortalInvitationEmailLib } from "../lib/resend.js";

async function dispatchPortalInvitation(
  workspaceId: string,
  project: { id: string; name: string; clientId: string | null; portalToken: string | null },
  appBaseUrl: string,
): Promise<void> {
  if (!project.clientId || !project.portalToken) return;

  // Fetch client contact details
  const [client] = await db
    .select({ name: clients.name, contactEmail: clients.contactEmail })
    .from(clients)
    .where(and(eq(clients.id, project.clientId), eq(clients.workspaceId, workspaceId), isNull(clients.deletedAt)))
    .limit(1);

  if (!client?.contactEmail) return; // No email on file — skip silently

  // Fetch workspace name for the "from" label
  const [workspace] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const agencyName = workspace?.name ?? "Your Agency";
  const portalUrl = `${appBaseUrl}/portal/${project.portalToken}`;

  await sendPortalInvitationEmailLib({
    to: client.contactEmail,
    clientName: client.name,
    agencyName,
    projectName: project.name,
    portalUrl,
  });
}

function getProjectPortalToken(): string {
  const generated = generatePortalToken();
  if (typeof generated === "string") {
    return generated;
  }

  if (generated && typeof generated === "object" && typeof generated.raw === "string") {
    return generated.raw;
  }

  throw new Error("generatePortalToken returned an invalid value");
}

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
      portalToken: getProjectPortalToken(),
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "project",
      entityId: project.id,
      action: "create",
    });

    // Send portal invitation email to client (fire and forget — does not block project creation)
    if (clientId) {
      const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";
      void dispatchPortalInvitation(workspaceId, project, APP_BASE_URL).catch((err: unknown) => {
        console.error("[ProjectService] Failed to send portal invitation email:", err);
      });
    }

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

  async getProjectSOW(workspaceId: string, projectId: string) {
    const project = await this.getProject(workspaceId, projectId);
    if (!project.sowId) return null;

    const [sow] = await db
      .select()
      .from(statementsOfWork)
      .where(and(eq(statementsOfWork.id, project.sowId), isNull(statementsOfWork.deletedAt)))
      .limit(1);

    if (!sow) return null;

    const clauses = await db
      .select()
      .from(sowClauses)
      .where(eq(sowClauses.sowId, sow.id));

    return {
      ...sow,
      clauses
    };
  },

  async getProjectBriefs(workspaceId: string, projectId: string) {
    const project = await this.getProject(workspaceId, projectId);
    return briefService.listBriefs(workspaceId, { projectId });
  },

  async getProjectDeliverables(workspaceId: string, projectId: string) {
    const project = await this.getProject(workspaceId, projectId);
    return deliverableService.list(workspaceId, { projectId });
  },

  async createProjectDeliverable(workspaceId: string, projectId: string, actorId: string, data: any) {
    const project = await this.getProject(workspaceId, projectId);
    return deliverableService.create(workspaceId, actorId, { ...data, projectId });
  },
};
