ALTER TABLE "brief_templates"
  ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "published_at" timestamptz;

CREATE INDEX IF NOT EXISTS "idx_brief_templates_workspace_status"
  ON "brief_templates" ("workspace_id", "status");

CREATE TABLE IF NOT EXISTS "brief_template_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "template_id" uuid NOT NULL REFERENCES "brief_templates"("id") ON DELETE CASCADE,
  "version_number" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "fields_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_default" boolean NOT NULL DEFAULT false,
  "template_status" varchar(32) NOT NULL DEFAULT 'published',
  "published_by" uuid REFERENCES "users"("id"),
  "published_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_brief_template_versions_template_version"
  ON "brief_template_versions" ("template_id", "version_number");

CREATE INDEX IF NOT EXISTS "idx_brief_template_versions_workspace_template"
  ON "brief_template_versions" ("workspace_id", "template_id");
