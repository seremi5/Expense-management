-- Migration: Make file_url and file_name nullable
-- This allows expenses to be created without immediately uploading files

ALTER TABLE expenses
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;
