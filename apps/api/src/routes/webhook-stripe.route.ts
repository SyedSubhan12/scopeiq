/**
 * Stripe webhook handler - receives and processes Stripe webhook events.
 *
 * Required environment variables (both must be set for the handler to activate):
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 *
 * If either variable is absent the module imports cleanly and every POST
 * returns 503 "Billing not configured" — the API never crashes on boot.
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { db, eq, stripeProcessedEvents } from "@novabots/db";
import { billingService } from "../services/billing.service.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// FIND-017: lazy factory — never throws at import time.
// The module loads successfully even when STRIPE_SECRET_KEY is unset.
let stripeClient: Stripe | undefined;
function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  if (!STRIPE_SECRET_KEY) return null;
  stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });
  return stripeClient;
}

const webhook = new Hono();

webhook.post("/", async (c) => {
  // FIND-017: runtime guard — returns 503 when Stripe is not configured.
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Billing not configured" }, 503);
  }

  // FIND-016: body-size cap — Stripe events are well under 1 MB.
  const len = Number(c.req.header("content-length") ?? 0);
  if (len > 1_048_576) return c.json({ error: "Body too large" }, 413);

  const body = await c.req.text();
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: unknown) {
    // FIND-013: return a generic message to the caller; log detail server-side only.
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[Stripe Webhook] Signature verification failed:", detail);
    return c.json({ error: "Invalid signature" }, 400);
  }

  // FIND-004: claim the event with status='processing'. On retry of an
  // already-completed event we short-circuit. Rows stuck in 'processing' are
  // resumed by the same insert path (we re-run the handler); a sweeper job
  // can also pick them up. 'failed' rows are visible in the DLQ.
  const inserted = await db
    .insert(stripeProcessedEvents)
    .values({ eventId: event.id, eventType: event.type, status: "processing" })
    .onConflictDoNothing()
    .returning({ eventId: stripeProcessedEvents.eventId });

  if (inserted.length === 0) {
    // Existing row — only short-circuit if it actually completed.
    const [existing] = await db
      .select({ status: stripeProcessedEvents.status })
      .from(stripeProcessedEvents)
      .where(eq(stripeProcessedEvents.eventId, event.id))
      .limit(1);

    if (existing?.status === "completed") {
      return c.json({ received: true, idempotent: true });
    }
    // status='processing' or 'failed' — retry the handler. Bump the counter.
    await db
      .update(stripeProcessedEvents)
      .set({
        status: "processing",
        attemptCount: (existing as unknown as { attemptCount?: number } | undefined)?.attemptCount
          ? Number((existing as unknown as { attemptCount?: number }).attemptCount) + 1
          : 2,
      })
      .where(eq(stripeProcessedEvents.eventId, event.id));
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await billingService.handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await billingService.handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await billingService.handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await billingService.handleInvoicePaymentFailed(event.data.object);
        break;

      case "invoice.paid":
        await billingService.handleInvoicePaid(event.data.object);
        break;

      default:
        // Log unhandled event types for debugging
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, message, JSON.stringify(event));

    // FIND-004: distinguish transient infra errors (let Stripe retry) from
    // permanent handler failures (acknowledge to stop Stripe retries) AND
    // mark the row appropriately so sweepers / dashboards can see it.
    const isTransient =
      error instanceof Error && /ECONNREFUSED|ETIMEDOUT|connection/i.test(error.message);

    if (isTransient) {
      // Leave row in 'processing' so the next Stripe redelivery re-runs the handler.
      await db
        .update(stripeProcessedEvents)
        .set({ status: "processing", lastError: message })
        .where(eq(stripeProcessedEvents.eventId, event.id));
      return c.json({ error: "Transient error, please retry" }, 500);
    }

    // Permanent error: mark row 'failed' (DLQ) and acknowledge to Stripe.
    await db
      .update(stripeProcessedEvents)
      .set({ status: "failed", lastError: message, completedAt: new Date() })
      .where(eq(stripeProcessedEvents.eventId, event.id));
    return c.json({ received: true, error: message }, 200);
  }

  // Success — mark the row completed.
  await db
    .update(stripeProcessedEvents)
    .set({ status: "completed", completedAt: new Date(), lastError: null })
    .where(eq(stripeProcessedEvents.eventId, event.id));

  return c.json({ received: true });
});

export default webhook;
