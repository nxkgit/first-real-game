-- Adds the status column (docs/CARD_WORKFLOW.md) to a database created before it existed. Idempotent: a no-op when the column is there.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'ready', 'built', 'blocked'));
