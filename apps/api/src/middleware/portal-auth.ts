import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "@novabots/types";
import { db, projects, eq, and, isNull } from "@novabots/db";

declare module "hono" {
  interface ContextVariableMap {
    portalProjectId: string;
    portalWorkspaceId: string;
  }
}

export const portalAuthMiddleware = createMiddleware(async (c, next) => {
  const tokenInput = c.req.header("X-Portal-Token");
  const token = tokenInput?.trim();
  console.log(`[PortalAuth] Token received: '${token}' (length: ${token?.length})`);
  if (!token) {
    throw new UnauthorizedError("Missing portal token");
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.portalToken, token), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) {
    console.warn(`[PortalAuth] Token invalid: ${token}`);
    throw new UnauthorizedError("Invalid portal token");
  }

  console.log(`[PortalAuth] Project found: ${project.name} (${project.id})`);
  c.set("portalProjectId", project.id);
  c.set("portalWorkspaceId", project.workspaceId);

  await next();
});
