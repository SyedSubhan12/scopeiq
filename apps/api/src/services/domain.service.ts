import { resolveTxt } from "dns/promises";
import { randomBytes } from "crypto";
import { db, writeAuditLog } from "@novabots/db";
import { workspaceRepository } from "../repositories/workspace.repository.js";
import { NotFoundError, ValidationError } from "@novabots/types";
// Enterprise plan gating for custom domains: enforce plan check here when billing tiers are live

const VERIFICATION_TXT_PREFIX = "scopeiq-verify=";

// Max total attempts before the worker gives up (≈24 h with exponential back-off)
const MAX_VERIFICATION_ATTEMPTS = 10;

export interface DnsRecordInstructions {
  recordType: "TXT";
  host: string;
  value: string;
  ttlSeconds: number;
}

export interface RequestDomainVerificationResult {
  workspaceId: string;
  customDomain: string;
  verificationToken: string;
  dnsRecord: DnsRecordInstructions;
}

export interface DomainVerificationStatusResult {
  workspaceId: string;
  customDomain: string | null;
  domainVerificationStatus: "pending" | "verified" | "failed" | null;
  domainVerifiedAt: Date | null;
  domainVerificationAttemptedAt: Date | null;
}

export const domainService = {
  /**
   * Initiates the DNS TXT verification flow for a workspace's custom domain.
   * Generates a new token, persists status=pending, and returns DNS record instructions.
   * The caller is responsible for dispatching the background verification job.
   */
  async requestDomainVerification(
    workspaceId: string,
    actorId: string,
  ): Promise<RequestDomainVerificationResult> {
    const workspace = await workspaceRepository.getByIdWithDomain(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    if (!workspace.customDomain) {
      throw new ValidationError(
        "A custom domain must be set on the workspace before requesting verification",
      );
    }

    const token = randomBytes(24).toString("hex");
    const txtValue = `${VERIFICATION_TXT_PREFIX}${token}`;

    await db.transaction(async (trx) => {
      await workspaceRepository.updateDomainVerification(
        workspaceId,
        {
          domainVerificationStatus: "pending",
          domainVerificationToken: token,
          domainVerifiedAt: null,
          domainVerificationAttemptedAt: null,
        },
        trx as unknown as typeof db,
      );

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        entityType: "workspace",
        entityId: workspaceId,
        action: "update",
        metadata: {
          field: "domainVerificationStatus",
          oldStatus: workspace.domainVerificationStatus,
          newStatus: "pending",
          customDomain: workspace.customDomain,
        },
      });
    });

    return {
      workspaceId,
      customDomain: workspace.customDomain,
      verificationToken: token,
      dnsRecord: {
        recordType: "TXT",
        host: `_scopeiq-challenge.${workspace.customDomain}`,
        value: txtValue,
        ttlSeconds: 300,
      },
    };
  },

  /**
   * Performs a live DNS TXT lookup and flips domainVerificationStatus to
   * "verified" (with domainVerifiedAt) on success, or "failed" on mismatch.
   * Returns the new status.
   */
  async verifyDomain(
    workspaceId: string,
    actorId: string | null = null,
  ): Promise<{ status: "verified" | "failed"; customDomain: string }> {
    const workspace = await workspaceRepository.getByIdWithDomain(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    if (!workspace.customDomain) {
      throw new ValidationError("No custom domain is set for this workspace");
    }

    if (!workspace.domainVerificationToken) {
      throw new ValidationError(
        "No verification token found — call request-verification first",
      );
    }

    const expectedTxtValue = `${VERIFICATION_TXT_PREFIX}${workspace.domainVerificationToken}`;
    const challengeHost = `_scopeiq-challenge.${workspace.customDomain}`;

    let newStatus: "verified" | "failed" = "failed";

    try {
      const records = await resolveTxt(challengeHost);
      // records is string[][] — each entry is an array of string chunks for one record
      const flat = records.flat();
      if (flat.includes(expectedTxtValue)) {
        newStatus = "verified";
      }
    } catch {
      // DNS resolution failure (NXDOMAIN, SERVFAIL, etc.) → treat as failed attempt
      newStatus = "failed";
    }

    const now = new Date();

    await db.transaction(async (trx) => {
      await workspaceRepository.updateDomainVerification(
        workspaceId,
        {
          domainVerificationStatus: newStatus,
          domainVerifiedAt: newStatus === "verified" ? now : null,
          domainVerificationAttemptedAt: now,
        },
        trx as unknown as typeof db,
      );

      await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
        workspaceId,
        actorId,
        actorType: actorId ? "user" : "system",
        entityType: "workspace",
        entityId: workspaceId,
        action: "update",
        metadata: {
          field: "domainVerificationStatus",
          oldStatus: workspace.domainVerificationStatus,
          newStatus,
          customDomain: workspace.customDomain,
        },
      });
    });

    return { status: newStatus, customDomain: workspace.customDomain };
  },

  /**
   * Returns the current domain verification status for a workspace.
   */
  async getDomainStatus(workspaceId: string): Promise<DomainVerificationStatusResult> {
    const workspace = await workspaceRepository.getByIdWithDomain(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    return {
      workspaceId,
      customDomain: workspace.customDomain ?? null,
      domainVerificationStatus:
        (workspace.domainVerificationStatus as "pending" | "verified" | "failed" | null) ?? null,
      domainVerifiedAt: workspace.domainVerifiedAt ?? null,
      domainVerificationAttemptedAt: workspace.domainVerificationAttemptedAt ?? null,
    };
  },

  /** Maximum number of background verification attempts before marking as failed. */
  maxVerificationAttempts: MAX_VERIFICATION_ATTEMPTS,
};
