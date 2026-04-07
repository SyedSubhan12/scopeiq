/**
 * Billing service - Stripe integration for ScopeIQ subscription management.
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Stripe secret key (server-side only)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret
 * - STRIPE_PRICE_ID_SOLO: Stripe price ID for Solo plan
 * - STRIPE_PRICE_ID_STUDIO: Stripe price ID for Studio plan
 * - STRIPE_PRICE_ID_AGENCY: Stripe price ID for Agency plan
 * - APP_BASE_URL: Base URL for success/cancel redirects
 */

import Stripe from "stripe";
import { db, workspaces, eq, writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError, AppError } from "@novabots/types";

// Environment variables for Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID_SOLO = process.env.STRIPE_PRICE_ID_SOLO;
const STRIPE_PRICE_ID_STUDIO = process.env.STRIPE_PRICE_ID_STUDIO;
const STRIPE_PRICE_ID_AGENCY = process.env.STRIPE_PRICE_ID_AGENCY;
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

// Price ID lookup map
const PRICE_ID_MAP: Record<string, string | undefined> = {
  solo: STRIPE_PRICE_ID_SOLO,
  studio: STRIPE_PRICE_ID_STUDIO,
  agency: STRIPE_PRICE_ID_AGENCY,
};

// Plan configuration with features and pricing (in cents)
const PLAN_CONFIG = {
  solo: {
    price: 7900,
    features: {
      maxUsers: 1,
      maxClients: 5,
      whiteLabel: false,
      apiAccess: false,
      customDomain: false,
    },
  },
  studio: {
    price: 12900,
    features: {
      maxUsers: 5,
      maxClients: 20,
      whiteLabel: true,
      apiAccess: false,
      customDomain: true,
    },
  },
  agency: {
    price: 19900,
    features: {
      maxUsers: -1,
      maxClients: -1,
      whiteLabel: true,
      apiAccess: true,
      customDomain: true,
    },
  },
} as const;

type PlanTier = keyof typeof PLAN_CONFIG;

// ---------------------------------------------------------------------------
// Helper: get or create Stripe customer for a workspace
// ---------------------------------------------------------------------------
async function getOrCreateStripeCustomer(
  workspaceId: string,
  workspaceName: string,
  existingCustomerId: string | null,
): Promise<string> {
  // If workspace already has a Stripe customer ID, return it
  if (existingCustomerId) {
    return existingCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    metadata: {
      workspaceId,
    },
    name: workspaceName,
  });

  return customer.id;
}

// ---------------------------------------------------------------------------
// Helper: get workspace price ID for a plan tier
// ---------------------------------------------------------------------------
function getPriceIdForTier(tier: PlanTier): string {
  const priceId = PRICE_ID_MAP[tier];
  if (!priceId) {
    throw new ValidationError(`Stripe price ID not configured for plan: ${tier}`);
  }
  return priceId;
}

function calculateMonthlyRevenueFromSubscription(subscription: Stripe.Subscription): number {
  const monthlyRevenueCents = subscription.items.data.reduce((total, item) => {
    const price = item.price;
    const unitAmount =
      typeof price.unit_amount === "number"
        ? price.unit_amount
        : price.unit_amount_decimal
          ? Number(price.unit_amount_decimal)
          : 0;
    const quantity = item.quantity ?? 1;
    const recurring = price.recurring;

    if (!recurring) {
      return total + unitAmount * quantity;
    }

    const intervalCount = recurring.interval_count || 1;
    const lineAmount = unitAmount * quantity;

    switch (recurring.interval) {
      case "year":
        return total + lineAmount / (12 * intervalCount);
      case "month":
        return total + lineAmount / intervalCount;
      case "week":
        return total + (lineAmount * 52) / (12 * intervalCount);
      case "day":
        return total + (lineAmount * 365) / (12 * intervalCount);
      default:
        return total + lineAmount;
    }
  }, 0);

  return Math.round(monthlyRevenueCents / 100);
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------
export const billingService = {
  /**
   * Create a Stripe Checkout session for a new subscription.
   */
  async createCheckoutSession(
    workspaceId: string,
    userId: string,
    data: { planTier: PlanTier; successUrl: string; cancelUrl: string },
  ): Promise<{ checkoutUrl: string }> {
    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // 2. Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      workspaceId,
      workspace.name,
      workspace.stripeCustomerId,
    );

    // 3. Get price ID for the selected tier
    const priceId = getPriceIdForTier(data.planTier);

    // 4. Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        workspaceId,
        userId,
        planTier: data.planTier,
      },
      subscription_data: {
        metadata: {
          workspaceId,
          planTier: data.planTier,
        },
      },
    });

    if (!session.url) {
      throw new AppError("CHECKOUT_ERROR", "Failed to create checkout session", 500);
    }

    return { checkoutUrl: session.url };
  },

  /**
   * Create a Stripe Billing Portal session for managing an existing subscription.
   */
  async createBillingPortalSession(
    workspaceId: string,
    _userId: string,
    data: { returnUrl: string },
  ): Promise<{ portalUrl: string }> {
    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // 2. Verify workspace has a Stripe customer
    if (!workspace.stripeCustomerId) {
      throw new ValidationError("No Stripe customer found for this workspace");
    }

    // 3. Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: data.returnUrl,
    });

    return { portalUrl: portalSession.url };
  },

  /**
   * Get current billing status for a workspace.
   */
  async getBillingStatus(workspaceId: string): Promise<{
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    usage: { users: number; clients: number };
  }> {
    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    const features = (workspace.features as Record<string, unknown>) ?? {};

    // 2. If workspace has a Stripe subscription, fetch status from Stripe
    let currentPeriodEnd: string | null = null;
    let cancelAtPeriodEnd = false;
    let status = "active";

    if (workspace.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          workspace.stripeSubscriptionId,
        );
        currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
        status = subscription.status;
      } catch {
        // If Stripe lookup fails, fall back to local data
        status = workspace.stripeSubscriptionId ? "unknown" : "active";
      }
    }

    // 3. Count current usage from the workspace settings (or defaults)
    const settings = (workspace.settingsJson as Record<string, unknown>) ?? {};
    const userCount = typeof settings.userCount === "number" ? settings.userCount : 1;
    const clientCount = typeof settings.clientCount === "number" ? settings.clientCount : 0;

    return {
      plan: workspace.plan,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      usage: {
        users: userCount,
        clients: clientCount,
      },
    };
  },

  async getMonthlyRecurringRevenue(workspaceId: string): Promise<number> {
    const [workspace] = await db
      .select({ stripeSubscriptionId: workspaces.stripeSubscriptionId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace?.stripeSubscriptionId) {
      return 0;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId);
      return calculateMonthlyRevenueFromSubscription(subscription);
    } catch {
      return 0;
    }
  },

  /**
   * Handle checkout.session.completed webhook event.
   * Updates workspace with Stripe customer/subscription IDs and plan tier.
   */
  async handleSubscriptionCreated(session: Stripe.Checkout.Session): Promise<void> {
    const { workspaceId, planTier } = session.metadata ?? {};

    if (!workspaceId || !planTier) {
      throw new ValidationError("Missing workspaceId or planTier in session metadata");
    }

    if (!session.subscription) {
      throw new ValidationError("Checkout session does not have a subscription");
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as { id: string }).id;

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer as { id: string })?.id;

    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // 2. Validate plan tier
    const tier = planTier as PlanTier;
    if (!PLAN_CONFIG[tier]) {
      throw new ValidationError(`Invalid plan tier: ${planTier}`);
    }

    // 3. Update workspace with Stripe info and plan
    const planFeatures = PLAN_CONFIG[tier].features;

    await db
      .update(workspaces)
      .set({
        stripeCustomerId: customerId ?? workspace.stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        plan: tier,
        features: planFeatures,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    // 4. Write audit log
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: (session.metadata as Record<string, string> | undefined)?.userId ?? null,
      actorType: "system",
      entityType: "billing",
      entityId: workspaceId,
      action: "update",
      metadata: {
        event: "subscription.created",
        planTier: tier,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
      },
    });
  },

  /**
   * Handle customer.subscription.updated webhook event.
   * Handles upgrades, downgrades, and plan changes.
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const { workspaceId, planTier } = subscription.metadata ?? {};

    if (!workspaceId) {
      throw new ValidationError("Missing workspaceId in subscription metadata");
    }

    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // 2. Determine plan tier from metadata or from the subscription item price
    let tier = planTier as PlanTier | undefined;

    if (!tier && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0]?.price.id;
      tier = Object.entries(PRICE_ID_MAP).find(
        ([, id]) => id === priceId,
      )?.[0] as PlanTier | undefined;
    }

    if (!tier) {
      throw new ValidationError("Could not determine plan tier from subscription");
    }

    if (!PLAN_CONFIG[tier]) {
      throw new ValidationError(`Invalid plan tier: ${tier}`);
    }

    // 3. Update workspace plan and features
    const planFeatures = PLAN_CONFIG[tier].features;

    await db
      .update(workspaces)
      .set({
        plan: tier,
        features: planFeatures,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    // 4. Write audit log
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "billing",
      entityId: workspaceId,
      action: "update",
      metadata: {
        event: "subscription.updated",
        planTier: tier,
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  },

  /**
   * Handle customer.subscription.deleted webhook event.
   * Downgrades workspace to free plan.
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const { workspaceId } = subscription.metadata ?? {};

    if (!workspaceId) {
      throw new ValidationError("Missing workspaceId in subscription metadata");
    }

    // 1. Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new NotFoundError("Workspace", workspaceId);
    }

    // 2. Downgrade to solo (free) plan
    const planFeatures = PLAN_CONFIG.solo.features;

    await db
      .update(workspaces)
      .set({
        plan: "solo",
        features: planFeatures,
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    // 3. Write audit log
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "billing",
      entityId: workspaceId,
      action: "update",
      metadata: {
        event: "subscription.deleted",
        previousPlan: workspace.plan,
        newPlan: "solo",
        reason: "subscription_cancelled",
      },
    });
  },

  /**
   * Handle invoice.payment_failed webhook event.
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : (invoice.customer as { id: string })?.id;

    if (!customerId) {
      return;
    }

    // Find workspace by Stripe customer ID
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.stripeCustomerId, customerId))
      .limit(1);

    if (!workspace) {
      return;
    }

    // Write audit log for payment failure
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId: workspace.id,
      actorId: null,
      actorType: "system",
      entityType: "billing",
      entityId: workspace.id,
      action: "update",
      metadata: {
        event: "invoice.payment_failed",
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
      },
    });
  },

  /**
   * Handle invoice.paid webhook event.
   */
  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : (invoice.customer as { id: string })?.id;

    if (!customerId) {
      return;
    }

    // Find workspace by Stripe customer ID
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.stripeCustomerId, customerId))
      .limit(1);

    if (!workspace) {
      return;
    }

    // Write audit log for successful payment
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId: workspace.id,
      actorId: null,
      actorType: "system",
      entityType: "billing",
      entityId: workspace.id,
      action: "update",
      metadata: {
        event: "invoice.paid",
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
      },
    });
  },
};
