import { Hono } from "hono";
import { db, projects, workspaces, deliverables, eq, and, isNull } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

export const portalRouter = new Hono();

/**
 * GET /portal/:token
 *
 * Public endpoint that validates a portal token and returns
 * project info + workspace branding + deliverables.
 *
 * DOES NOT return sensitive workspace data (stripe keys, settings, etc.).
 * Returns a generic 404 for invalid tokens to prevent information leakage.
 */
portalRouter.get("/:token", async (c) => {
  const token = c.req.param("token")?.trim();

  if (!token) {
    throw new NotFoundError("Portal", "invalid-token");
  }

  // 1. Find project by portal token
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      clientId: projects.clientId,
      workspaceId: projects.workspaceId,
      portalEnabled: projects.portalEnabled,
    })
    .from(projects)
    .where(and(eq(projects.portalToken, token), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) {
    throw new NotFoundError("Portal", "not-found");
  }

  // 2. Get workspace branding only (no sensitive fields)
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      logoUrl: workspaces.logoUrl,
      brandColor: workspaces.brandColor,
      plan: workspaces.plan,
    })
    .from(workspaces)
    .where(eq(workspaces.id, project.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new NotFoundError("Portal", "not-found");
  }

  // 3. Fetch deliverables for the project (public-safe fields only)
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
      description: deliverables.description,
      dueDate: deliverables.dueDate,
    })
    .from(deliverables)
    .where(
      and(
        eq(deliverables.projectId, project.id),
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
        portalEnabled: project.portalEnabled === "true",
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logoUrl: workspace.logoUrl,
        brandColor: workspace.brandColor ?? "#0F6E56",
        plan: workspace.plan ?? "solo",
      },
      deliverables: projectDeliverables,
    },
  });
});
