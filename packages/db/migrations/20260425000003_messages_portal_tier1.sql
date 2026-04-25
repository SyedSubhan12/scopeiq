-- Portal Tier 1: enhance messages table for in-portal messaging
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'agency',
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS thread_id TEXT REFERENCES messages(id),
  ADD COLUMN IF NOT EXISTS attachments_json JSONB,
  ADD COLUMN IF NOT EXISTS scope_check_status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;
