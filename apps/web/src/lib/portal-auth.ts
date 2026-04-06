const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface PortalProjectData {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    portalEnabled: boolean;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    brandColor: string;
    plan: string;
  };
  deliverables: {
    id: string;
    name: string;
    status: string;
    revisionRound: number;
    maxRevisions: number;
    fileUrl: string | null;
    mimeType: string | null;
    externalUrl: string | null;
    type: string;
    description: string | null;
    dueDate: string | null;
  }[];
}

/**
 * In-memory token store — intentionally avoids localStorage for security.
 * Token is cleared on page refresh.
 */
let storedToken: string | null = null;

/**
 * Store the portal token in memory for the current session.
 */
export function setPortalToken(token: string | null): void {
  storedToken = token;
}

/**
 * Retrieve the current in-memory portal token.
 */
export function getPortalToken(): string | null {
  return storedToken;
}

/**
 * Validate a portal token by hitting the public validation endpoint.
 * Returns the parsed JSON response or null if invalid.
 */
export async function validatePortalToken(token: string): Promise<PortalProjectData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/portal/${encodeURIComponent(token)}`);
    if (!response.ok) return null;
    const json = await response.json();
    return json.data as PortalProjectData;
  } catch {
    return null;
  }
}

/**
 * Fetch full portal project data (wrapper around validatePortalToken).
 * This is the canonical way to get project + workspace + deliverables
 * for a given portal token.
 */
export async function getPortalProject(token: string): Promise<PortalProjectData | null> {
  return validatePortalToken(token);
}

/**
 * Generate the headers required for authenticated portal API requests.
 * Use these headers on any endpoint that requires X-Portal-Token.
 */
export function generatePortalHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Portal-Token": token,
  };
}
