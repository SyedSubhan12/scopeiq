/**
 * Custom Domain API
 *
 * POST   /v1/custom-domain          — add custom domain, dispatch CF + verify-domain job
 * GET    /v1/custom-domain          — get current domain status for the workspace
 * DELETE /v1/custom-domain/:hostnameId — remove domain from CF and clear workspace record
 *
 * All routes require JWT auth.
 * Mutations are owner-only and write an audit log entry.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { domainService } from "../services/domain.service.js";
import { customHostnameService } from "../services/cloudflare/custom-hostname.service.js";
import { dispatchVerifyDomainJob } from "../jobs/verify-domain.job.js";
import { workspaceRepository } from "../repositories/workspace.repository.js";
import { db, writeAuditLog } from "@novabots/db";
import { ForbiddenError, NotFoundError } from "@novabots/types";

export const customDomainRouter = new Hono();

customDomainRouter.use("*", authMiddleware);

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(4)
    .max(253)
    // Basic hostname validation — must have at least one dot, no spaces
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$/, {
      message: "Invalid domain format",
    }),
});

/**
 * POST /v1/custom-domain
 * Owner-only: set a custom domain and kick off Cloudflare + DNS verification.
 */
customDomainRouter.post(
  "/",
  zValidator("json", addDomainSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const userRole = c.get("userRole");

    if (userRole !== "owner") {
      throw new ForbiddenError("Only workspace owners can configure custom domains");
    }

    const { domain } = c.req.valid("json");

    // 1. Persist domain on workspace (sets status → pending)
    await workspaceRepository.update(workspaceId, { customDomain: domain });

    // 2. Register with Cloudflare for SaaS (non-fatal if CF creds not yet set)
    let cfHostnameId: string | null = null;
    try {
      const cfHostname = await customHostnameService.addCustomHostname(domain, workspaceId);
      cfHostnameId = cfHostname.id;
    } catch (err) {
      // In local dev / staging without CF creds, log and continue.
      // The domain will still go through TXT verification.
      console.warn("[custom-domain] Cloudflare hostname registration skipped:", (err as Error).message);
    }

    // 3. Initiate TXT verification flow (generates token, writes to workspace)
    const verificationResult = await domainService.requestDomainVerification(workspaceId, userId);

    // 4. Dispatch background verification job (starts polling after 60 s)
    await dispatchVerifyDomainJob(workspaceId);

    // 5. Audit log
    await writeAuditLog(db, {
      workspaceId,
      actorId: userId,
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: {
        field: "customDomain",
        domain,
        cfHostnameId,
        event: "custom_domain_added",
      },
    });

    return c.json(
      {
        data: {
          domain,
          cfHostnameId,
          status: "pending",
          dnsRecord: verificationResult.dnsRecord,
          cnameRecord: {
            // Clients must point their domain here for Cloudflare for SaaS to terminate TLS
            // TODO: replace YOURSAAS_FALLBACK with actual Cloudflare for SaaS fallback origin
            host: domain,
            pointsTo: "portal.scopeiq.app",
            type: "CNAME",
          },
        },
      },
      201,
    );
  },
);

/**
 * GET /v1/custom-domain
 * Any authenticated workspace member can read domain status.
 */
customDomainRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId");

  const status = await domainService.getDomainStatus(workspaceId);

  // Attempt to fetch Cloudflare status if domain is present
  let cfStatus: string | null = null;
  if (status.customDomain) {
    try {
      const hostnames = await customHostnameService.listCustomHostnames({
        hostname: status.customDomain,
      });
      cfStatus = hostnames[0]?.status ?? null;
    } catch {
      // Non-fatal — CF creds may not be set in local/staging
    }
  }

  return c.json({
    data: {
      ...status,
      cfStatus,
      cnameRecord: status.customDomain
        ? {
            host: status.customDomain,
            pointsTo: "portal.scopeiq.app",
            type: "CNAME",
          }
        : null,
    },
  });
});

/**
 * DELETE /v1/custom-domain/:hostnameId
 * Owner-only: remove the custom domain from Cloudflare and clear the workspace record.
 * hostnameId is the Cloudflare hostname ID (pass "local" if CF was skipped).
 */
customDomainRouter.delete("/:hostnameId", async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const userRole = c.get("userRole");
  const hostnameId = c.req.param("hostnameId");

  if (userRole !== "owner") {
    throw new ForbiddenError("Only workspace owners can remove custom domains");
  }

  const workspace = await workspaceRepository.getByIdWithDomain(workspaceId);
  if (!workspace) {
    throw new NotFoundError("Workspace", workspaceId);
  }

  const domainBeingRemoved = workspace.customDomain;

  // Remove from Cloudflare (non-fatal)
  if (hostnameId !== "local") {
    try {
      await customHostnameService.removeCustomHostname(hostnameId);
    } catch (err) {
      console.warn("[custom-domain] Cloudflare hostname removal skipped:", (err as Error).message);
    }
  }

  // Clear domain fields on workspace
  await workspaceRepository.update(workspaceId, {
    customDomain: null,
    domainVerificationStatus: null,
    domainVerificationToken: null,
    domainVerifiedAt: null,
    domainVerificationAttemptedAt: null,
  });

  // Audit log
  await writeAuditLog(db, {
    workspaceId,
    actorId: userId,
    entityType: "workspace",
    entityId: workspaceId,
    action: "update",
    metadata: {
      field: "customDomain",
      domainRemoved: domainBeingRemoved,
      cfHostnameId: hostnameId,
      event: "custom_domain_removed",
    },
  });

  return c.json({ data: { removed: true } });
});
