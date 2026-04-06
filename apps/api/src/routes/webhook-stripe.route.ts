/**
 * Stripe webhook handler - receives and processes Stripe webhook events.
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { billingService } from "../services/billing.service.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

const webhook = new Hono();

webhook.post("/", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: `Invalid signature: ${message}` }, 400);
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
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, message);
    return c.json({ error: "Webhook handler failed" }, 500);
  }

  return c.json({ received: true });
});

export default webhook;
