-- YFIT Daily Logs Table Schema
-- This table stores daily health tracking data (sleep, water, steps, vitals, etc.)

-- Drop table if exists (be careful in production!)
-- DROP TABLE IF EXISTS public.daily_logs CASCADE;

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamp
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Sleep tracking
  sleep_hours DECIMAL(4,2),  -- e.g., 7.5 hours
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  
  -- Hydration
  water_ml INTEGER,  -- milliliters
  
  -- Activity
  steps INTEGER,
  
  -- Vital signs
  bp_systolic INTEGER,  -- Blood pressure systolic (mmHg)
  bp_diastolic INTEGER,  -- Blood pressure diastolic (mmHg)
  glucose_mg_dl INTEGER,  -- Blood glucose (mg/dL)
  
  -- Body measurements
  weight_kg DECIMAL(6,2),  -- Weight in kilograms
  body_fat_percent DECIMAL(5,2),  -- Body fat percentage
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_logged_at ON public.daily_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, logged_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own logs
CREATE POLICY "Users can view their own daily logs"
  ON public.daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON public.daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
  ON public.daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
GRANT ALL ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'daily_logs table created successfully!';
  RAISE NOTICE 'Remember to run this SQL in your Supabase SQL Editor';
  RAISE NOTICE 'Go to: https://mxggxpoxgqubojvumjlt.supabase.co/project/_/sql';
END $$;
