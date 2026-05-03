-- Migration: Add preferred_language to user_profiles
-- Run this in the Supabase SQL Editor
-- Date: 2026-05-03

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- Add a comment for documentation
COMMENT ON COLUMN user_profiles.preferred_language IS
  'ISO 639-1 language code for the user''s preferred display language. '
  'Supported: en, fr, es, pt, zh, hi, de, ja';

-- Optional: backfill existing rows to English
UPDATE user_profiles
SET preferred_language = 'en'
WHERE preferred_language IS NULL;
