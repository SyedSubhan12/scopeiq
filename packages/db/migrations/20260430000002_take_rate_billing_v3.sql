-- Migration: v3.0 take-rate billing model
-- Adds take-rate columns to change_orders, adds 'free' plan tier,
-- migrates 'solo' workspaces to 'free', sets 'free' as default.

-- ============================================================
-- 1. change_orders: add three take-rate columns
-- ============================================================

ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS take_rate_pct numeric(5,4),
  ADD COLUMN IF NOT EXISTS take_rate_amount_cents integer;

-- ============================================================
-- 2. plan_enum: add 'free' value
-- NOTE: 'solo' is intentionally NOT dropped from the enum.
-- Postgres enum value removal is destructive. We stop using
-- 'solo' via application logic and the DEFAULT change below.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'free'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_enum')
  ) THEN
    ALTER TYPE plan_enum ADD VALUE 'free' BEFORE 'solo';
  END IF;
END $$;

-- ============================================================
-- 3. Migrate existing solo workspaces → free
-- ============================================================

UPDATE workspaces
SET plan = 'free', updated_at = now()
WHERE plan = 'solo';

-- ============================================================
-- 4. Change default for workspaces.plan to 'free'
-- ============================================================

ALTER TABLE workspaces
  ALTER COLUMN plan SET DEFAULT 'free';
