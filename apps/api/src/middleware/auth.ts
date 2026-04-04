import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import { UnauthorizedError } from "@novabots/types";
import { db, users, eq } from "@novabots/db";
import { env } from "../lib/env.js";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    workspaceId: string;
    userRole: string;
  }
}

import { userSyncService } from "../services/user-sync.service.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Ensure user is synced between Auth and Database (Lazy Provisioning)
  const user = await userSyncService.ensureUser(authUser);

  c.set("userId", user.id);
  c.set("workspaceId", user.workspaceId);
  c.set("userRole", user.role);

  await next();
});
