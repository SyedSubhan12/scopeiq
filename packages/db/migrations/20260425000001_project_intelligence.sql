CREATE TYPE project_intelligence_event_type AS ENUM (
  'brief_submitted',
  'brief_scored',
  'brief_clarified',
  'deliverable_uploaded',
  'deliverable_approved',
  'revision_requested',
  'scope_flag_created',
  'scope_flag_confirmed',
  'scope_flag_dismissed',
  'change_order_generated',
  'change_order_accepted',
  'change_order_declined',
  'message_sent',
  'message_out_of_scope',
  'sow_uploaded',
  'sow_activated',
  'sow_updated'
);

CREATE TYPE project_intelligence_entity_type AS ENUM (
  'brief',
  'deliverable',
  'scope_flag',
  'change_order',
  'message',
  'sow'
);

CREATE TABLE IF NOT EXISTS project_intelligence (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  client_id TEXT,
  event_type project_intelligence_event_type NOT NULL,
  entity_type project_intelligence_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata_json JSONB,
  searchable_text TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', summary)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_pi_workspace ON project_intelligence(workspace_id);
CREATE INDEX idx_pi_project ON project_intelligence(project_id);
CREATE INDEX idx_pi_client ON project_intelligence(client_id);
CREATE INDEX idx_pi_event_type ON project_intelligence(event_type);
CREATE INDEX idx_pi_created_at ON project_intelligence(created_at);
CREATE INDEX idx_pi_search ON project_intelligence USING GIN(searchable_text);

ALTER TABLE project_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation ON project_intelligence
  AS RESTRICTIVE
  FOR ALL
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.id = auth.uid()
  ));
