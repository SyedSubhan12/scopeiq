import { Hono } from "hono";
import { createHmac } from "node:crypto";
import { deliverableService } from "../services/deliverable.service.js";
import { db, projects, clients, eq, and, isNull, constantTimeCompare } from "@novabots/db";

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

/**
 * Resolve workspaceId from projectId, ensuring the project belongs to a valid workspace.
 */
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
// Router
// ---------------------------------------------------------------------------

export const emailApprovalRouter = new Hono();

/**
 * GET /api/portal/email-approve/:token
 * Token-based auth, approves deliverable via query param ?deliverableId=xxx
 */
emailApprovalRouter.get("/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed) {
    return c.html(
      "<h1>Invalid or expired link</h1><p>This approval link is no longer valid. Please contact the project team.</p>",
      400,
    );
  }

  // If deliverableId in query doesn't match the token, reject
  if (deliverableId !== parsed.deliverableId) {
    return c.html("<h1>Token mismatch</h1><p>The deliverable ID does not match the approval token.</p>", 400);
  }

  const projectInfo = await resolveProjectWorkspace(parsed.projectId);
  if (!projectInfo) {
    return c.html("<h1>Project not found</h1><p>The associated project no longer exists.</p>", 404);
  }

  try {
    await deliverableService.approveViaEmail(projectInfo.workspaceId, parsed.deliverableId);

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Deliverable Approved</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: #0F6E56; margin: 0 0 8px; font-size: 24px; }
          p { color: #4a4a4a; margin: 0 0 24px; }
          a { color: #0F6E56; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">&#9989;</div>
          <h1>Deliverable Approved</h1>
          <p>The deliverable has been successfully approved. Thank you!</p>
          <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Approval Failed</title></head>
      <body>
        <h1>Approval Failed</h1>
        <p>${message}</p>
        <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
      </body>
      </html>
    `, 400);
  }
});

/**
 * GET /api/portal/email-decline/:token
 * Token-based auth, declines deliverable via query param ?deliverableId=xxx
 */
emailApprovalRouter.get("/decline/:token", async (c) => {
  const token = c.req.param("token");
  const deliverableId = c.req.query("deliverableId");

  const parsed = validateEmailApprovalToken(token);
  if (!parsed) {
    return c.html(
      "<h1>Invalid or expired link</h1><p>This decline link is no longer valid. Please contact the project team.</p>",
      400,
    );
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

    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Changes Requested</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: #d4870e; margin: 0 0 8px; font-size: 24px; }
          p { color: #4a4a4a; margin: 0 0 24px; }
          a { color: #0F6E56; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">&#128221;</div>
          <h1>Changes Requested</h1>
          <p>Your request for changes has been recorded. The project team will be notified.</p>
          <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Decline Failed</title></head>
      <body>
        <h1>Decline Failed</h1>
        <p>${message}</p>
        <a href="${PORTAL_BASE_URL}/portal">Return to portal</a>
      </body>
      </html>
    `, 400);
  }
});
