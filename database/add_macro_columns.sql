-- Add macro target columns to user_preferences table
-- Run this in the Supabase SQL editor

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS use_custom_macros BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS protein_percent    NUMERIC(5,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS carb_percent       NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS fat_percent        NUMERIC(5,2) DEFAULT 30;
