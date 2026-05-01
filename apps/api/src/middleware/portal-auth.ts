import { createHash } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "@novabots/types";
import { db, projects, clients, eq, and, isNull, constantTimeCompare, verifyPortalToken } from "@novabots/db";

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

  // ── Project tokens ────────────────────────────────────────────────────────
  // projects.portal_token is unique-indexed. Legacy plaintext tokens are stored
  // directly; scrypt tokens are stored as "salt:hash". Both require fetching
  // candidates because scrypt cannot be reversed for an index lookup.
  // TODO: add a portal_token_fast_hash (SHA-256) column + index to projects so
  //       this can be resolved with a single indexed lookup instead of a scan.
  const projectCandidates = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      portalToken: projects.portalToken,
    })
    .from(projects)
    .where(isNull(projects.deletedAt))
    .limit(500);

  for (const project of projectCandidates) {
    if (!project.portalToken) continue;
    const matches = project.portalToken.includes(":")
      ? verifyPortalToken(token, project.portalToken)
      : constantTimeCompare(token, project.portalToken);
    if (matches) {
      c.set("portalProjectId", project.id);
      c.set("portalWorkspaceId", project.workspaceId);
      c.set("portalClientId", null);
      await next();
      return;
    }
  }

  // ── Client tokens ─────────────────────────────────────────────────────────
  // clients.portal_token_hash stores SHA-256(token), indexed, so we can do a
  // single indexed lookup instead of scanning all clients.
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const [matchedClient] = await db
    .select({
      id: clients.id,
      workspaceId: clients.workspaceId,
      portalTokenHash: clients.portalTokenHash,
      tokenExpiresAt: clients.tokenExpiresAt,
    })
    .from(clients)
    .where(and(eq(clients.portalTokenHash, tokenHash), isNull(clients.deletedAt)))
    .limit(1);

  if (matchedClient) {
    const [clientProject] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(
        eq(projects.clientId, matchedClient.id),
        isNull(projects.deletedAt),
      ))
      .limit(1);

    if (clientProject) {
      c.set("portalProjectId", clientProject.id);
      c.set("portalWorkspaceId", clientProject.workspaceId);
      c.set("portalClientId", matchedClient.id);
      await next();
      return;
    }
  }

  throw new UnauthorizedError("Invalid or expired token");
});
