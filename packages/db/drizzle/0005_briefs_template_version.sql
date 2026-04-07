ALTER TABLE "briefs"
  ADD COLUMN IF NOT EXISTS "template_version_id" uuid REFERENCES "brief_template_versions"("id");

CREATE INDEX IF NOT EXISTS "idx_briefs_template_version"
  ON "briefs" ("template_version_id");
