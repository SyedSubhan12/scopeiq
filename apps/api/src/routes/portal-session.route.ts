import { Hono } from "hono";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";
import { db, projects, workspaces, clients, deliverables, briefs, briefFields, changeOrders, eq, and, isNull, asc, inArray } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { analyticsService } from "../services/analytics.service.js";

export const portalSessionRouter = new Hono();

portalSessionRouter.use("*", portalAuthMiddleware);

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
  const [pendingBrief] = await db
    .select()
    .from(briefs)
    .where(
      and(
        eq(briefs.projectId, projectId),
        isNull(briefs.submittedAt),
        isNull(briefs.deletedAt)
      )
    )
    .limit(1);

  let fields: any[] = [];
  if (pendingBrief) {
    fields = await db
      .select()
      .from(briefFields)
      .where(eq(briefFields.briefId, pendingBrief.id))
      .orderBy(asc(briefFields.sortOrder));
  }

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
      description: changeOrders.description,
      amount: changeOrders.amount,
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
        plan: (workspace as any).plan ?? "solo",
      },
      deliverables: projectDeliverables,
      health,
      pendingBrief: pendingBrief ? {
        ...pendingBrief,
        fields
      } : null,
      pendingChangeOrders: sentChangeOrders,
    },
  });
});
