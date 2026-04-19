-- Migration: create brief_embeds table
-- Supports embeddable public intake forms per workspace

CREATE TABLE IF NOT EXISTS "brief_embeds" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id"     UUID NOT NULL REFERENCES "workspaces"("id"),
  "token"            TEXT NOT NULL UNIQUE,
  "form_config_json" JSONB NOT NULL DEFAULT '{}',
  "is_active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at"       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_brief_embeds_workspace" ON "brief_embeds"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_brief_embeds_token"     ON "brief_embeds"("token");
