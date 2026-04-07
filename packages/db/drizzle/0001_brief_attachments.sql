CREATE TABLE IF NOT EXISTS "brief_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"brief_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"object_key" text NOT NULL,
	"file_url" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(255),
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brief_attachments" ADD CONSTRAINT "brief_attachments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brief_attachments" ADD CONSTRAINT "brief_attachments_brief_id_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_brief_attachments_brief" ON "brief_attachments" ("brief_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_brief_attachments_brief_field" ON "brief_attachments" ("brief_id","field_key");
