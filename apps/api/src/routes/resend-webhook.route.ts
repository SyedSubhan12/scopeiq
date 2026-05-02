import { Hono } from "hono";
import { Webhook, WebhookVerificationError } from "svix";
import sanitizeHtml from "sanitize-html";
import { db, messages, projects, eq, and, isNull, writeAuditLog } from "@novabots/db";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";
import { ValidationError } from "@novabots/types";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
let webhookVerifier: Webhook | null = null;
function getVerifier(): Webhook | null {
  if (webhookVerifier) return webhookVerifier;
  if (!RESEND_WEBHOOK_SECRET) return null;
  webhookVerifier = new Webhook(RESEND_WEBHOOK_SECRET);
  return webhookVerifier;
}

/** Allowlist used to strip unsafe HTML from inbound email bodies (FIND-010 XSS). */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "blockquote", "code", "pre"],
  allowedAttributes: { a: ["href", "title"] },
  allowedSchemes: ["http", "https", "mailto"],
};

export const resendWebhookRouter = new Hono();

/**
 * Validate Resend webhook using Svix-format signing (Resend's actual scheme).
 * Fail-closed in every environment — no dev bypass.
 */
function verifyResendWebhook(
  payload: string,
  headers: {
    svixId: string | undefined;
    svixTimestamp: string | undefined;
    svixSignature: string | undefined;
  },
): boolean {
  const verifier = getVerifier();
  if (!verifier) {
    console.error("[ResendWebhook] RESEND_WEBHOOK_SECRET not set — rejecting request");
    return false;
  }
  if (!headers.svixId || !headers.svixTimestamp || !headers.svixSignature) {
    return false;
  }
  try {
    verifier.verify(payload, {
      "svix-id": headers.svixId,
      "svix-timestamp": headers.svixTimestamp,
      "svix-signature": headers.svixSignature,
    });
    return true;
  } catch (err) {
    if (err instanceof WebhookVerificationError) return false;
    console.warn("[ResendWebhook] Unexpected verification error:", err);
    return false;
  }
}

/**
 * POST /webhooks/resend
 *
 * Handles Resend inbound email webhook (email forwarding → scope check)
 * and delivery status webhooks.
 *
 * Security fixes (2026-05-02):
 * - FIND-010: projectId derived from `To:` address only — never from data.project_id
 * - FIND-010 XSS: HTML body sanitized with strict allowlist before persisting
 * - FIND-016: 10 MB Content-Length cap to prevent oversized body attacks
 * - Defensive DKIM/SPF status logging (warn only, no reject)
 */
resendWebhookRouter.post("/", async (c) => {
  // FIND-016: Reject oversized payloads before reading the body.
  const len = Number(c.req.header("content-length") ?? 0);
  if (len > 10 * 1024 * 1024) return c.json({ error: "Body too large" }, 413);

  const rawBody = await c.req.text();
  const ok = verifyResendWebhook(rawBody, {
    svixId: c.req.header("svix-id"),
    svixTimestamp: c.req.header("svix-timestamp"),
    svixSignature: c.req.header("svix-signature"),
  });

  if (!ok) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const type = body.type as string | undefined;

  // Handle inbound email (email forwarding)
  if (type === "email.received") {
    const data = body.data as Record<string, string> | undefined;
    if (!data) return c.json({ error: "Missing data" }, 400);

    const { to, from, subject, html, text } = data;
    // NOTE: data.project_id is intentionally NOT read — it is attacker-controlled
    // (FIND-010 IDOR). Project identity is derived solely from the To: address.

    // FIND-010: Derive projectId from the validated inbound To: address.
    // Resend inbound addresses follow the convention: project-<uuid>@<inbound-domain>
    const localPart = (to ?? "").split("@")[0]?.toLowerCase() ?? "";
    const match = /^project-([0-9a-f-]{36})$/.exec(localPart);
    if (!match) {
      return c.json({ error: "Unrecognized inbound address" }, 400);
    }
    const projectId = match[1]!;

    // Defensive DKIM/SPF logging — do NOT reject; Resend may omit these fields.
    const spfStatus = (data as Record<string, string>)["spf_status"];
    const dkimStatus = (data as Record<string, string>)["dkim_status"];
    if (spfStatus && spfStatus !== "pass") {
      console.warn("[ResendWebhook] SPF check did not pass", { spfStatus, to, from });
    }
    if (dkimStatus && dkimStatus !== "pass") {
      console.warn("[ResendWebhook] DKIM check did not pass", { dkimStatus, to, from });
    }

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    // FIND-010 XSS: Sanitize HTML with a strict allowlist before persisting.
    const cleanHtml = html
      ? sanitizeHtml(html, SANITIZE_OPTIONS)
      : null;
    const messageBody = cleanHtml ?? text ?? subject ?? "";

    const messageRecord = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(messages)
        .values({
          workspaceId: project.workspaceId,
          projectId: project.id,
          authorName: from ?? null,
          source: "email_forward",
          body: messageBody,
        })
        .returning();

      if (!inserted) {
        throw new ValidationError("Failed to create message from inbound email");
      }

      await writeAuditLog(tx, {
        workspaceId: project.workspaceId,
        actorType: "system",
        actorId: "resend-webhook",
        entityType: "message",
        entityId: inserted.id,
        action: "create",
        metadata: {
          source: "resend-webhook",
          from: from ?? null,
          to: to ?? null,
          subject: subject ?? null,
          projectId: project.id,
        },
      });

      return inserted;
    });

    try {
      await dispatchCheckScopeJob(messageRecord.id, project.id, project.workspaceId, messageBody, null);
    } catch (err) {
      console.error("[ResendWebhook] Failed to dispatch scope check:", err);
    }

    return c.json({ received: true, messageId: messageRecord.id }, 200);
  }

  // Handle delivery status notifications
  if (type === "email.delivered" || type === "email.complained" || type === "email.bounced") {
    // Log delivery status — could update reminder_logs.delivery_status
    console.log(`[ResendWebhook] Delivery event: ${type}`, body);
    return c.json({ received: true }, 200);
  }

  return c.json({ received: true }, 200);
});
