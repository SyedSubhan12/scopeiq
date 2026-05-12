-- Migration: add 'system' value to message_source_enum
-- Required for FR-SG-002 bilateral scope flag notification:
-- system-authored messages must carry source='system' to distinguish them
-- from portal/email/manual messages in queries and UI rendering.

ALTER TYPE message_source_enum ADD VALUE IF NOT EXISTS 'system';
