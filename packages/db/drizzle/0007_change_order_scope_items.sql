-- Migration 007: Add scope_items_json to change_orders
-- This column stores SOW clause updates that should be applied when the change order is accepted

ALTER TABLE "change_orders" ADD COLUMN "scope_items_json" jsonb DEFAULT '[]'::jsonb;
