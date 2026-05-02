-- FIND-005: index-friendly portal token lookup.
-- The previous middleware fetched up to 500 candidate projects and ran scrypt
-- against each — O(n) KDF in the auth hot path, capped silently at 500.
-- Add a SHA-256 lookup column for O(1) seek; verifyPortalToken still runs to
-- protect against rainbow-table attacks on a leaked DB.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS portal_token_lookup_hash varchar(64);

-- Backfill: SHA-256(plaintext token) where plaintext is recoverable.
-- Plaintext rows are stored in `portal_token` without a colon. Scrypt rows
-- contain a colon ("salt:hash") and cannot be backfilled — those rows must
-- be rotated by the application on next use.
UPDATE projects
SET portal_token_lookup_hash = encode(digest(portal_token, 'sha256'), 'hex')
WHERE portal_token IS NOT NULL
  AND position(':' IN portal_token) = 0
  AND portal_token_lookup_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_portal_token_lookup_hash
  ON projects (portal_token_lookup_hash)
  WHERE portal_token_lookup_hash IS NOT NULL;
