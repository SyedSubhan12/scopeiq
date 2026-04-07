-- Add parentId column to feedback_items for threaded replies
ALTER TABLE feedback_items ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES feedback_items(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_feedback_items_parent ON feedback_items(parent_id);
