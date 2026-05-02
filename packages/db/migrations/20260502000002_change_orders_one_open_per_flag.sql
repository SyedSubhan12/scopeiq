-- FIND-009: prevent duplicate open change orders per scope flag.
-- Without this, a worker retry that mints a fresh changeOrderId can create a
-- second draft CO for the same flag and a second Stripe PaymentIntent —
-- enabling take-rate double-billing.

-- 1. Defensive backfill: void any pre-existing open duplicates per scope_flag.
--    Keep the earliest by created_at; void the rest.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY scope_flag_id
      ORDER BY created_at ASC
    ) AS rn
  FROM change_orders
  WHERE status IN ('draft', 'sent')
    AND scope_flag_id IS NOT NULL
)
UPDATE change_orders
SET status = 'voided',
    updated_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Partial unique index: at most one open CO per scope flag.
CREATE UNIQUE INDEX IF NOT EXISTS change_orders_one_open_per_flag
  ON change_orders (scope_flag_id)
  WHERE status IN ('draft', 'sent') AND scope_flag_id IS NOT NULL;
