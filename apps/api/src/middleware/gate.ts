import { createMiddleware } from "hono/factory";
import { db, workspaces, eq } from "@novabots/db";
import { HTTPException } from "hono/http-exception";

export type GateName = "approval_portal" | "brief_builder";

export const gateMiddleware = (gate: GateName) =>
  createMiddleware(async (c, next) => {
    const workspaceId = c.get("workspaceId");
    if (!workspaceId) {
      throw new HTTPException(401, { message: "Unauthorized: Missing workspaceId" });
    }

    const [ws] = await db
      .select({ features: workspaces.features })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    const features = (ws?.features as Record<string, boolean> | null) ?? {};
    
    // Gate 1 (Scope Guard) is always enabled for launch.
    // Gate 2 (Approval Portal) and Gate 3 (Brief Builder) check feature flags.
    const isEnabled = features[gate] === true;

    if (!isEnabled) {
      throw new HTTPException(403, {
        message: `Gate Enforcement: ${gate} is not enabled for this workspace. Metrics not proven.`,
      });
    }

    await next();
  });
