-- ============================================================
-- YFIT Feedback Automation Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add testimonial_queued column to user_feedback
--    (safe to run multiple times — checks if column exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'testimonial_queued'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN testimonial_queued BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Add index for efficient testimonial queries on marketing site
CREATE INDEX IF NOT EXISTS idx_user_feedback_testimonial
  ON user_feedback (testimonial_queued, created_at DESC)
  WHERE testimonial_queued = TRUE;

-- 3. Add index for weekly report queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at
  ON user_feedback (created_at DESC);

-- 4. Add index for type-based filtering
CREATE INDEX IF NOT EXISTS idx_user_feedback_type
  ON user_feedback (type, created_at DESC);

-- ============================================================
-- CRON JOB SETUP
-- Requires pg_cron extension (enabled in Supabase by default)
-- Run this separately in the SQL Editor
-- ============================================================

-- Enable pg_cron if not already enabled
-- (Supabase enables this automatically for Pro plans)

-- Schedule weekly-feedback-report every Monday at 8:00 AM UTC
SELECT cron.schedule(
  'yfit-weekly-feedback-report',           -- job name (unique)
  '0 8 * * 1',                             -- every Monday at 08:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://mxggxpoxgqubojvumjlt.supabase.co/functions/v1/weekly-feedback-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To verify the cron job was created:
-- SELECT * FROM cron.job WHERE jobname = 'yfit-weekly-feedback-report';

-- To manually trigger a test run immediately:
-- SELECT net.http_post(
--   url := 'https://mxggxpoxgqubojvumjlt.supabase.co/functions/v1/weekly-feedback-report',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4"}'::jsonb,
--   body := '{}'::jsonb
-- );

-- ============================================================
-- TESTIMONIALS VIEW (for marketing site)
-- Query this to get approved testimonials for display
-- ============================================================
CREATE OR REPLACE VIEW public.testimonials AS
  SELECT
    id,
    title,
    description,
    category,
    created_at
  FROM user_feedback
  WHERE testimonial_queued = TRUE
    AND type = 'praise'
  ORDER BY created_at DESC;

-- Grant read access to anon role for the marketing site
GRANT SELECT ON public.testimonials TO anon;
