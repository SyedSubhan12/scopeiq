CREATE TABLE "brief_clarification_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
  "brief_id" uuid NOT NULL REFERENCES "briefs"("id") ON DELETE CASCADE,
  "brief_version_id" uuid REFERENCES "brief_versions"("id") ON DELETE SET NULL,
  "status" varchar(32) NOT NULL DEFAULT 'open',
  "message" text,
  "requested_by" uuid REFERENCES "users"("id"),
  "requested_at" timestamptz DEFAULT now() NOT NULL,
  "resolved_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "brief_clarification_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "brief_clarification_requests"("id") ON DELETE CASCADE,
  "field_key" varchar(100) NOT NULL,
  "field_label" varchar(255) NOT NULL,
  "prompt" text NOT NULL,
  "severity" varchar(16) NOT NULL DEFAULT 'medium',
  "source_flag_id" varchar(100),
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_brief_clarification_requests_brief_status"
  ON "brief_clarification_requests" ("brief_id", "status");

CREATE INDEX "idx_brief_clarification_requests_workspace_brief"
  ON "brief_clarification_requests" ("workspace_id", "brief_id");

CREATE INDEX "idx_brief_clarification_items_request_order"
  ON "brief_clarification_items" ("request_id", "sort_order");
