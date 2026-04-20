CREATE TABLE IF NOT EXISTS marketplace_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug VARCHAR(128) NOT NULL,
  brief_template_id UUID REFERENCES brief_templates(id) ON DELETE SET NULL,
  installed_by_user_id UUID NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_marketplace_installs_workspace_slug UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_installs_workspace ON marketplace_installs(workspace_id);
