import { Hono } from "hono";
import { createHmac } from "node:crypto";
import { deliverableService } from "../services/deliverable.service.js";
import { db, projects, clients, eq, and, isNull, constantTimeCompare } from "@novabots/db";

// Lazy accessor — only throws when a route is actually called, not at import time.
function getEmailApprovalSecret(): string {
  const secret = process.env.EMAIL_APPROVAL_SECRET;
  if (!secret) throw new Error("EMAIL_APPROVAL_SECRET environment variable is required");
  return secret;
}

const PORTAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scopeiq.app";

/**
 * Generate an HMAC-signed approval link token for a deliverable.
 * Returns: { token, approveUrl, declineUrl }
 */
export function generateEmailApprovalToken(deliverableId: string, projectId: string): {
  token: string;
  approveUrl: string;
  declineUrl: string;
} {
  const payload = `${deliverableId}:${projectId}`;
  const hmac = createHmac("sha256", getEmailApprovalSecret());
  const signature = hmac.update(payload).digest("hex");
  const token = `${payload}:${signature}`;

  const baseUrl = `${PORTAL_BASE_URL}/api/portal`;
  return {
    token,
    approveUrl: `${baseUrl}/email-approve/${encodeURIComponent(token)}?deliverableId=${deliverableId}`,
    declineUrl: `${baseUrl}/email-decline/${encodeURIComponent(token)}?deliverableId=${deliverableId}`,
  };
}

/**
 * Validate an email approval token using constant-time comparison.
 * Returns { deliverableId, projectId } if valid, null otherwise.
 */
function validateEmailApprovalToken(token: string): { deliverableId: string; projectId: string } | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [deliverableId, projectId, providedSig] = parts;
  if (!deliverableId || !projectId || !providedSig) return null;

  const payload = `${deliverableId}:${projectId}`;
  const hmac = createHmac("sha256", getEmailApprovalSecret());
  const expectedSig = hmac.update(payload).digest("hex");

  if (!constantTimeCompare(providedSig, expectedSig)) {
    return null;
  }

  return { deliverableId, projectId };
}

async function resolveProjectWorkspace(projectId: string): Promise<{ workspaceId: string; contactEmail: string | null } | null> {
  const [row] = await db
    .select({
      workspaceId: projects.workspaceId,
      contactEmail: clients.contactEmail,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  return row ? { workspaceId: row.workspaceId, contactEmail: row.contactEmail ?? null } : null;
}

// ---------------------------------------------------------------------------
// Shared HTML helpers
// ---------------------------------------------------------------------------

function confirmationPage(title: string, body: string, actionLabel: string, actionUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
    .card{background:#fff;border-radius:8px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);text-align:center;max-width:400px;width:100%}
    h1{color:#111;margin:0 0 12px;font-size:22px}
    p{color:#555;margin:0 0 24px}
    form{display:inline}
    button{background:#0F6E56;color:#fff;border:none;border-radius:6px;padding:12px 28px;font-size:15px;font-weight:600;cursor:pointer}
    button:hover{background:#0a5a46}
    a{display:block;margin-top:16px;color:#888;font-size:13px;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${body}</p>
    <form method="POST" action="${actionUrl}">
      <button type="submit">${actionLabel}</button>
    </form>
    <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
  </div>
</body>
</html>`;
}

function resultPage(title: string, body: string, color: string, icon: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
    .card{background:#fff;border-radius:8px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);text-align:center;max-width:400px}
    .icon{font-size:48px;margin-bottom:16px}
    h1{color:${color};margin:0 0 8px;font-size:24px}
    p{color:#4a4a4a;margin:0 0 24px}
    a{color:#0F6E56;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const emailApprovalRouter = new Hono();

/**
 * GET /api/portal/email-approve/:token
 * Shows a confirmation page — does NOT approve immediately.
 * Prevents email scanners and link prefetchers from triggering approval.
 */
emailApprovalRouter.get("/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed || deliverableId !== parsed.deliverableId) {
    return c.html("<h1>Invalid or expired link</h1><p>This approval link is no longer valid.</p>", 400);
  }

  const actionUrl = `?deliverableId=${encodeURIComponent(deliverableId ?? "")}`;
  return c.html(confirmationPage(
    "Confirm Approval",
    "Please confirm that you want to approve this deliverable.",
    "Confirm Approval",
    actionUrl,
  ));
});

/**
 * POST /api/portal/email-approve/:token
 * Performs the approval after the user confirms on the GET page.
 */
emailApprovalRouter.post("/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed) {
    return c.html("<h1>Invalid or expired link</h1><p>This approval link is no longer valid.</p>", 400);
  }

  if (deliverableId !== parsed.deliverableId) {
    return c.html("<h1>Token mismatch</h1><p>The deliverable ID does not match the approval token.</p>", 400);
  }

  const projectInfo = await resolveProjectWorkspace(parsed.projectId);
  if (!projectInfo) {
    return c.html("<h1>Project not found</h1><p>The associated project no longer exists.</p>", 404);
  }

  try {
    await deliverableService.approveViaEmail(projectInfo.workspaceId, parsed.deliverableId);
    return c.html(resultPage("Deliverable Approved", "The deliverable has been successfully approved. Thank you!", "#0F6E56", "&#9989;"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.html(resultPage("Approval Failed", message, "#c0392b", "&#10060;"), 400);
  }
});

/**
 * GET /api/portal/email-decline/:token
 * Shows a confirmation page — does NOT decline immediately.
 */
emailApprovalRouter.get("/decline/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed || deliverableId !== parsed.deliverableId) {
    return c.html("<h1>Invalid or expired link</h1><p>This decline link is no longer valid.</p>", 400);
  }

  const actionUrl = `decline/${encodeURIComponent(token)}?deliverableId=${encodeURIComponent(deliverableId ?? "")}`;
  return c.html(confirmationPage(
    "Request Changes",
    "Please confirm that you want to request changes on this deliverable.",
    "Request Changes",
    actionUrl,
  ));
});

/**
 * POST /api/portal/email-decline/:token
 * Performs the decline after the user confirms on the GET page.
 */
emailApprovalRouter.post("/decline/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed) {
    return c.html("<h1>Invalid or expired link</h1><p>This decline link is no longer valid.</p>", 400);
  }

  if (deliverableId !== parsed.deliverableId) {
    return c.html("<h1>Token mismatch</h1><p>The deliverable ID does not match the decline token.</p>", 400);
  }

  const projectInfo = await resolveProjectWorkspace(parsed.projectId);
  if (!projectInfo) {
    return c.html("<h1>Project not found</h1><p>The associated project no longer exists.</p>", 404);
  }

  try {
    await deliverableService.declineViaEmail(projectInfo.workspaceId, parsed.deliverableId);
    return c.html(resultPage("Changes Requested", "Your request for changes has been recorded. The project team will be notified.", "#d4870e", "&#128221;"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.html(resultPage("Decline Failed", message, "#c0392b", "&#10060;"), 400);
  }
});
