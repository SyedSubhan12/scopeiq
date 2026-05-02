-- TS-FIX: workspaces.schema defaults plan to 'free' and billing.service writes
-- 'free' on subscription cancellation, but the plan_enum did not include the
-- value. Add it idempotently. ALTER TYPE ... ADD VALUE cannot run inside a
-- transaction in older Postgres; drizzle's migrator runs each file alone.
ALTER TYPE plan_enum ADD VALUE IF NOT EXISTS 'free' BEFORE 'solo';
