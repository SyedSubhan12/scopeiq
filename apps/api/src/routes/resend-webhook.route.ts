import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, messages, projects, eq, and, isNull } from "@novabots/db";
import { dispatchCheckScopeJob } from "../jobs/check-scope.job.js";
import { ValidationError } from "@novabots/types";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export const resendWebhookRouter = new Hono();

/**
 * Validate Resend webhook signature using HMAC-SHA256.
 * In production, rejects all requests when the secret is not configured.
 */
function verifyResendSignature(payload: string, signature: string | undefined): boolean {
  if (!RESEND_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("[ResendWebhook] RESEND_WEBHOOK_SECRET not set in production — rejecting all requests");
      return false;
    }
    console.warn("[ResendWebhook] RESEND_WEBHOOK_SECRET not set — allowing in development");
    return true;
  }
  if (!signature) return false;

  const expectedSignature = createHmac("sha256", RESEND_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");

  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * POST /webhooks/resend
 *
 * Handles Resend inbound email webhook (email forwarding → scope check)
 * and delivery status webhooks.
 */
resendWebhookRouter.post("/", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("Resend-Signature");

  if (!verifyResendSignature(rawBody, signature)) {
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

    const { to, from, subject, html, text, project_id } = data;

    if (!project_id) {
      return c.json({ error: "Missing project_id in email headers" }, 400);
    }

    const [project] = await db
      .select({ id: projects.id, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(eq(projects.id, project_id), isNull(projects.deletedAt)))
      .limit(1);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const messageBody = html ?? text ?? subject ?? "";
    const [messageRecord] = await db
      .insert(messages)
      .values({
        workspaceId: project.workspaceId,
        projectId: project.id,
        authorName: from ?? null,
        source: "email_forward",
        body: messageBody,
      })
      .returning();

    if (!messageRecord) {
      throw new ValidationError("Failed to create message from inbound email");
    }

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
