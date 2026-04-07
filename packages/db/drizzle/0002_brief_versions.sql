ALTER TABLE "briefs"
ADD COLUMN "reviewer_id" uuid REFERENCES "users"("id");

CREATE TABLE "brief_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "brief_id" uuid NOT NULL REFERENCES "briefs"("id") ON DELETE CASCADE,
  "version_number" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "status" "brief_status_enum" NOT NULL,
  "scope_score" integer,
  "scoring_result_json" jsonb,
  "answers_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "attachments_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "reviewer_id" uuid REFERENCES "users"("id"),
  "review_note" text,
  "submitted_by" uuid,
  "submitted_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_brief_versions_brief_version"
  ON "brief_versions" ("brief_id", "version_number");

CREATE INDEX "idx_brief_versions_workspace_brief"
  ON "brief_versions" ("workspace_id", "brief_id");
