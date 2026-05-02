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
  // FIND-005: O(1) indexed lookup via portal_token_lookup_hash (SHA-256). The
  // previous implementation scanned up to 500 candidate rows and ran scrypt
  // against each — both a CPU-DoS surface and silently broken past 500 rows.
  // The scrypt verifyPortalToken still runs for tokens that have one stored,
  // protecting against rainbow tables on a leaked DB.
  const lookupHash = createHash("sha256").update(token).digest("hex");

  const [matchedProject] = await db
    .select({
      id: projects.id,
      workspaceId: projects.workspaceId,
      portalToken: projects.portalToken,
    })
    .from(projects)
    .where(and(eq(projects.portalTokenLookupHash, lookupHash), isNull(projects.deletedAt)))
    .limit(1);

  if (matchedProject?.portalToken) {
    const matches = matchedProject.portalToken.includes(":")
      ? verifyPortalToken(token, matchedProject.portalToken)
      : constantTimeCompare(token, matchedProject.portalToken);
    if (matches) {
      c.set("portalProjectId", matchedProject.id);
      c.set("portalWorkspaceId", matchedProject.workspaceId);
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
    // FIND-001: Reject expired tokens before doing any further work.
    if (matchedClient.tokenExpiresAt && matchedClient.tokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // FIND-005: Use limit(2) so we can detect the ambiguous multi-project case.
    const clientProjects = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(
        eq(projects.clientId, matchedClient.id),
        isNull(projects.deletedAt),
      ))
      .limit(2);

    if (clientProjects.length > 1) {
      throw new UnauthorizedError("Client token is ambiguous — multiple active projects");
    }

    const clientProject = clientProjects[0];
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
