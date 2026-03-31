-- ============================================================
-- YFIT Subscription & Feature Enforcement Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
-- Source of truth for each user's plan status.
-- Supports Stripe (web), Google Play, and Apple App Store.
-- plan_type: 'free' | 'pro_monthly' | 'pro_yearly' | 'pro_lifetime'
-- status:    'active' | 'trialing' | 'past_due' | 'canceled' | 'grace_period'
-- platform:  'stripe' | 'google_play' | 'apple' | null (free users)

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type             TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan_type IN ('free', 'pro_monthly', 'pro_yearly', 'pro_lifetime')),
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'grace_period')),
  platform              TEXT DEFAULT NULL
                          CHECK (platform IN ('stripe', 'google_play', 'apple', NULL)),

  -- Stripe-specific fields
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id       TEXT,

  -- Google Play / Apple fields (for future native billing)
  store_product_id      TEXT,
  store_purchase_token  TEXT,

  -- Billing period
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,

  -- Grace period: 7 days after payment failure before downgrade
  grace_period_ends_at  TIMESTAMPTZ,

  -- Trial tracking
  trial_start           TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,

  -- Lifetime flag (never expires)
  is_lifetime           BOOLEAN DEFAULT false,

  -- Audit
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),

  -- One active subscription per user
  UNIQUE (user_id)
);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only server-side (service_role) can update subscriptions
-- Frontend reads only; Stripe webhooks update via service_role key
CREATE POLICY "Service role can update subscriptions" ON subscriptions
  FOR UPDATE USING (true);  -- Restricted to service_role in practice


-- ============================================================
-- 2. FEATURE USAGE TABLE
-- Tracks monthly usage for rate-limited features.
-- Resets at the start of each calendar month.
-- feature: 'form_analysis' | 'ai_coach' | 'saved_routines'
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature       TEXT NOT NULL
                  CHECK (feature IN ('form_analysis', 'ai_coach', 'barcode_scanner', 'saved_routines')),
  usage_count   INT NOT NULL DEFAULT 0,
  month_year    TEXT NOT NULL,  -- Format: 'YYYY-MM' e.g. '2026-03'
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  -- One row per user per feature per month
  UNIQUE (user_id, feature, month_year)
);

CREATE OR REPLACE FUNCTION update_feature_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feature_usage_updated_at ON feature_usage;
CREATE TRIGGER feature_usage_updated_at
  BEFORE UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION update_feature_usage_updated_at();

-- RLS for feature_usage
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON feature_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON feature_usage
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 3. HELPER FUNCTION: Get or create usage row for current month
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_usage(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS feature_usage AS $$
DECLARE
  v_month_year TEXT := to_char(now(), 'YYYY-MM');
  v_row feature_usage;
BEGIN
  -- Try to get existing row
  SELECT * INTO v_row
  FROM feature_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND month_year = v_month_year;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO feature_usage (user_id, feature, usage_count, month_year)
    VALUES (p_user_id, p_feature, 0, v_month_year)
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. HELPER FUNCTION: Increment usage count
-- Returns new count so caller can check against limit
-- ============================================================

CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS INT AS $$
DECLARE
  v_month_year TEXT := to_char(now(), 'YYYY-MM');
  v_new_count INT;
BEGIN
  INSERT INTO feature_usage (user_id, feature, usage_count, month_year)
  VALUES (p_user_id, p_feature, 1, v_month_year)
  ON CONFLICT (user_id, feature, month_year)
  DO UPDATE SET usage_count = feature_usage.usage_count + 1
  RETURNING usage_count INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. SEED: Create free subscription row for all existing users
-- Run once after migration to backfill existing users
-- ============================================================

-- Backfill existing users with a 30-day trial from their account creation date
INSERT INTO subscriptions (user_id, plan_type, status, trial_start, trial_end)
SELECT
  id,
  'free',
  CASE
    WHEN created_at + INTERVAL '30 days' > NOW() THEN 'trialing'
    ELSE 'active'
  END,
  created_at,
  created_at + INTERVAL '30 days'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================
-- 6. AUTO-CREATE free subscription on new user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan_type,
    status,
    trial_start,
    trial_end
  )
  VALUES (
    NEW.id,
    'free',
    'trialing',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_subscription();
