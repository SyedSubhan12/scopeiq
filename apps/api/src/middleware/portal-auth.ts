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
  const token = c.req.header("X-Portal-Token");
  if (!token) {
    throw new UnauthorizedError("Missing portal token");
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.portalToken, token), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) {
    throw new UnauthorizedError("Invalid portal token");
  }

  c.set("portalProjectId", project.id);
  c.set("portalWorkspaceId", project.workspaceId);

  await next();
});
