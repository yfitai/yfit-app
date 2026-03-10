-- ============================================================
-- YFIT Beta Infrastructure Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. BETA INVITE CODES
-- Controls who can sign up during beta
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by TEXT DEFAULT 'admin',
  email TEXT, -- optional: pre-assign to specific email
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  max_uses INT DEFAULT 1,
  use_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for beta_invites (public can read active codes to validate, only admin can write)
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can validate a code" ON beta_invites
  FOR SELECT USING (is_active = true);
CREATE POLICY "Only owner can manage codes" ON beta_invites
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. USER FEEDBACK / BUG REPORTS
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature_request', 'general', 'praise')),
  category TEXT, -- 'nutrition', 'fitness', 'medications', 'predictions', 'other'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  app_version TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'wont_fix')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 3. ERROR LOGS
-- Captures frontend JS errors and crashes
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  app_version TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  extra_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4. FEATURE ANALYTICS
-- Tracks which features users actually use
CREATE TABLE IF NOT EXISTS feature_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL, -- e.g. 'page_view', 'scan_food', 'log_workout', 'view_predictions'
  feature TEXT NOT NULL,    -- e.g. 'nutrition', 'fitness', 'medications', 'ai_coach'
  page TEXT,
  properties JSONB,         -- flexible extra data
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feature_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own analytics" ON feature_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 5. ONBOARDING STATE
-- Tracks where user is in onboarding flow
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beta_invite_code TEXT,
  ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT false;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_feature_analytics_user_event ON feature_analytics(user_id, event_name);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_feature ON feature_analytics(feature, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status, created_at);
CREATE INDEX IF NOT EXISTS idx_beta_invites_code ON beta_invites(code);

-- Insert some initial beta invite codes (customize as needed)
INSERT INTO beta_invites (code, notes, max_uses) VALUES
  ('YFIT-BETA-2026', 'General beta access code', 100),
  ('YFIT-EARLY', 'Early adopter code', 50),
  ('YFIT-VIP', 'VIP/friend access', 20)
ON CONFLICT (code) DO NOTHING;
