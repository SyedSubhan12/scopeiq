-- Migration: add signed PDF artifact columns to change_orders
-- Additive only — no existing columns dropped or altered

ALTER TABLE change_orders
  ADD COLUMN IF NOT EXISTS signed_by_ip    text,
  ADD COLUMN IF NOT EXISTS signed_pdf_key  text,
  ADD COLUMN IF NOT EXISTS signed_pdf_hash text;
