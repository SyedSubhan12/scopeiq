/**
 * Cloudflare for SaaS — Custom Hostname API
 *
 * Manages custom hostnames on the configured Cloudflare zone so client
 * domains (e.g. portal.acme.com) terminate at ScopeIQ's portal edge.
 *
 * Env vars required:
 *   CLOUDFLARE_API_TOKEN   — scoped to Zone:SSL and Certificates:Edit
 *   CLOUDFLARE_ZONE_ID     — the zone that has "Cloudflare for SaaS" enabled
 *   CLOUDFLARE_ACCOUNT_ID  — Cloudflare account ID (used for fallback lookups)
 *
 * Reference:
 *   https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/
 */

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

/** Status values returned by the Cloudflare Custom Hostnames API. */
export type CfHostnameStatus =
  | "pending"
  | "active"
  | "moved"
  | "deleted"
  | "blocked"
  | "pending_blocked"
  | "pending_migration"
  | "pending_provisioned"
  | "test_pending"
  | "test_active"
  | "test_blocked"
  | "test_failed";

export interface CfCustomHostname {
  /** Cloudflare-generated ID for the custom hostname object. */
  id: string;
  /** The customer's domain, e.g. "portal.acme.com". */
  hostname: string;
  /** Cloudflare-reported SSL/hostname status. */
  status: CfHostnameStatus;
  /** Opaque metadata stored against the hostname (we store workspaceId). */
  // TODO: confirm cloudflare API field name for custom metadata
  customMetadata?: Record<string, string>;
  /** When the record was created (ISO string). */
  createdAt?: string;
}

interface CfApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[cloudflare] Missing required env var: ${key}`);
  }
  return value;
}

async function cfRequest<T>(
  method: "GET" | "POST" | "DELETE" | "PATCH",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = getRequiredEnv("CLOUDFLARE_API_TOKEN");
  const zoneId = getRequiredEnv("CLOUDFLARE_ZONE_ID");

  const url = `${CF_API_BASE}/zones/${zoneId}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = (await res.json()) as CfApiResponse<T>;

  if (!json.success) {
    const msg = json.errors.map((e) => `${e.code}: ${e.message}`).join("; ");
    throw new Error(`[cloudflare] API error — ${msg}`);
  }

  return json.result;
}

export const customHostnameService = {
  /**
   * Register a new custom hostname with Cloudflare for SaaS.
   * Returns the Cloudflare hostname object including its ID, which must be
   * persisted so we can poll/remove it later.
   */
  async addCustomHostname(
    domain: string,
    workspaceId: string,
  ): Promise<CfCustomHostname> {
    return cfRequest<CfCustomHostname>("POST", "/custom_hostnames", {
      hostname: domain,
      ssl: {
        // Cloudflare manages certificate provisioning via Let's Encrypt / DigiCert
        method: "http",
        type: "dv",
        settings: {
          min_tls_version: "1.2",
          // TODO: confirm cloudflare API field name for certificate_authority
          certificate_authority: "lets_encrypt",
        },
      },
      // Custom metadata so we can tie this back to a workspace without a DB query
      // TODO: confirm cloudflare API field name for custom_metadata vs metadata
      custom_metadata: { workspaceId },
    });
  },

  /**
   * Poll Cloudflare to get the current status of a custom hostname.
   * Use this in the background job to determine when to flip the workspace
   * domain_verification_status to "verified".
   */
  async verifyCustomHostname(hostnameId: string): Promise<CfCustomHostname> {
    return cfRequest<CfCustomHostname>("GET", `/custom_hostnames/${hostnameId}`);
  },

  /**
   * Remove a custom hostname from Cloudflare (on domain removal or plan downgrade).
   * Cloudflare returns an empty object on success — we ignore the result.
   */
  async removeCustomHostname(hostnameId: string): Promise<void> {
    await cfRequest<unknown>("DELETE", `/custom_hostnames/${hostnameId}`);
  },

  /**
   * List all custom hostnames registered on the zone, optionally filtered by
   * the customer's domain string.
   */
  async listCustomHostnames(
    filter?: { hostname?: string },
  ): Promise<CfCustomHostname[]> {
    const qs = filter?.hostname
      ? `?hostname=${encodeURIComponent(filter.hostname)}`
      : "";
    return cfRequest<CfCustomHostname[]>("GET", `/custom_hostnames${qs}`);
  },
};
