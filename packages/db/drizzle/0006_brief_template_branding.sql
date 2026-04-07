ALTER TABLE "brief_templates"
ADD COLUMN "branding_json" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "brief_template_versions"
ADD COLUMN "branding_json" jsonb DEFAULT '{}'::jsonb NOT NULL;
