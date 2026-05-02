/**
 * Take-rate service — v3.0 billing model.
 *
 * Per PRD §4.3: ScopeIQ earns revenue exactly when the user does.
 * Take-rate is charged on accepted change orders only.
 * Per Code Rule 10: payment intent created at CO generation (not acceptance),
 * captured only on acceptance, and logged in audit_log when created.
 *
 * Rates by plan:
 *   free    → 4%   (0.0400)
 *   studio  → 3%   (0.0300)
 *   agency  → 2.5% (0.0250)
 *   solo    → 4%   (legacy alias for free)
 */

import Stripe from "stripe";
import { db, workspaces, eq } from "@novabots/db";
import { stripe } from "./billing.service.js";

// ---------------------------------------------------------------------------
// Take-rate map — keyed on plan_enum values
// ---------------------------------------------------------------------------
const TAKE_RATE_BY_PLAN: Record<string, number> = {
  free: 0.04,
  solo: 0.04, // legacy — treated as free
  studio: 0.03,
  agency: 0.025,
};

const DEFAULT_TAKE_RATE = 0.04;

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

export const takeRateService = {
  /**
   * Return the take-rate fraction (e.g. 0.04) for a workspace based on its plan.
   */
  async getTakeRatePct(workspaceId: string): Promise<number> {
    const [workspace] = await db
      .select({ plan: workspaces.plan })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return DEFAULT_TAKE_RATE;
    }

    return TAKE_RATE_BY_PLAN[workspace.plan] ?? DEFAULT_TAKE_RATE;
  },

  /**
   * Create a Stripe PaymentIntent with capture_method: 'manual'.
   * The intent is authorized at CO creation; captured only on client acceptance.
   * Returns the intent ID, take-rate fraction, and take-rate amount in cents.
   *
   * Per Code Rule 10: caller MUST write this to audit_log in the same transaction.
   */
  async createPaymentIntent(opts: {
    workspaceId: string;
    changeOrderId: string;
    amountCents: number;
    currency: string;
    customerId?: string | null;
  }): Promise<{
    paymentIntentId: string;
    takeRatePct: number;
    takeRateAmountCents: number;
  }> {
    const takeRatePct = await this.getTakeRatePct(opts.workspaceId);
    const takeRateAmountCents = Math.ceil(opts.amountCents * takeRatePct);

    const params: Stripe.PaymentIntentCreateParams = {
      amount: takeRateAmountCents,
      currency: opts.currency.toLowerCase(),
      capture_method: "manual",
      metadata: {
        workspaceId: opts.workspaceId,
        changeOrderId: opts.changeOrderId,
        takeRatePct: String(takeRatePct),
      },
    };

    if (opts.customerId) {
      params.customer = opts.customerId;
    }

    // FIND-002: idempotencyKey ties retries to one PaymentIntent.
    // Stripe enforces idempotency for 24h on this key.
    const intent = await stripe.paymentIntents.create(params, {
      idempotencyKey: `co_intent_${opts.changeOrderId}`,
    });

    return {
      paymentIntentId: intent.id,
      takeRatePct,
      takeRateAmountCents,
    };
  },

  /**
   * Capture a previously-authorized Stripe PaymentIntent.
   * Called inside db.transaction on CO acceptance — if this throws,
   * the entire transaction rolls back.
   */
  async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.capture(paymentIntentId);
  },
};
