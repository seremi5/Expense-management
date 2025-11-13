-- Migration: Remove unique constraint on reference_number
-- This allows multiple expenses to have the same reference/invoice number

-- Drop the unique constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_reference_number_unique;

-- Drop the unique index
DROP INDEX IF EXISTS expenses_reference_number_unique;

-- Create a regular (non-unique) index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS reference_number_idx ON expenses(reference_number);
