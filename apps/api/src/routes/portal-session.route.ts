import { Hono } from "hono";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { db, projects, workspaces, clients, deliverables, eq, and, isNull } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

export const portalSessionRouter = new Hono();

portalSessionRouter.use("*", portalAuthMiddleware);

/**
 * GET /portal/session
 * Returns the client's view of their project: workspace branding, project info,
 * and deliverable statuses. Used by the portal app on initial load.
 */
portalSessionRouter.get("/", async (c) => {
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

  // Fetch deliverables for the project
  const projectDeliverables = await db
    .select({
      id: deliverables.id,
      name: deliverables.name,
      status: deliverables.status,
      revisionCount: deliverables.revisionCount,
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
        id: workspace!.id,
        name: workspace!.name,
        logoUrl: workspace!.logoUrl,
        brandColor: workspace!.brandColor ?? "#0F6E56",
      },
      deliverables: projectDeliverables,
    },
  });
});
