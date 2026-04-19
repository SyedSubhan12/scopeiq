-- Add status lifecycle column to statements_of_work
-- Existing rows default to 'draft'; already-parsed rows are updated below.

ALTER TABLE "statements_of_work"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'draft';

-- Back-fill: any SOW that has been parsed (parsedAt set) should be 'parsed';
-- any SOW that has clauses AND a parsedAt AND is referenced as active by a
-- project can stay 'parsed' – activation transitions are owned by the service.
UPDATE "statements_of_work"
  SET "status" = 'parsed'
  WHERE "parsed_at" IS NOT NULL
    AND "deleted_at" IS NULL;
