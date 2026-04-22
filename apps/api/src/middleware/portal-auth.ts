import { createHash } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "@novabots/types";
import { db, projects, clients, eq, and, isNull, constantTimeCompare } from "@novabots/db";

declare module "hono" {
  interface ContextVariableMap {
    portalProjectId: string;
    portalWorkspaceId: string;
    portalClientId: string | null;
  }
}

export const portalAuthMiddleware = createMiddleware(async (c, next) => {
  const tokenInput = c.req.header("X-Portal-Token");
  const token = tokenInput?.trim();
  if (!token) {
    throw new UnauthorizedError("Missing portal token");
  }

  const tokenHash = Buffer.from(token, "utf8").length === 64 ? token : createHash("sha256").update(token).digest("hex");

  // Try projects.portal_token first (direct project tokens)
  const projectCandidates = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      portalToken: projects.portalToken,
    })
    .from(projects)
    .where(isNull(projects.deletedAt))
    .limit(100);

  for (const project of projectCandidates) {
    if (!project.portalToken) continue;
    if (constantTimeCompare(token, project.portalToken)) {
      c.set("portalProjectId", project.id);
      c.set("portalWorkspaceId", project.workspaceId);
      c.set("portalClientId", null);
      await next();
      return;
    }
  }

  // Try clients.portal_token_hash with constant-time comparison
  const clientCandidates = await db
    .select({
      id: clients.id,
      workspaceId: clients.workspaceId,
      portalTokenHash: clients.portalTokenHash,
      tokenExpiresAt: clients.tokenExpiresAt,
    })
    .from(clients)
    .where(isNull(clients.deletedAt))
    .limit(100);

  for (const client of clientCandidates) {
    if (!client.portalTokenHash) continue;
    if (!constantTimeCompare(tokenHash, client.portalTokenHash)) continue;

    const [clientProject] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(
        eq(projects.clientId, client.id),
        isNull(projects.deletedAt),
      ))
      .limit(1);

    if (clientProject) {
      c.set("portalProjectId", clientProject.id);
      c.set("portalWorkspaceId", clientProject.workspaceId);
      c.set("portalClientId", client.id);
      await next();
      return;
    }
  }

  throw new UnauthorizedError("Invalid or expired token");
});
