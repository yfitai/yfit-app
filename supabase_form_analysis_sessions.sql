-- Create form_analysis_sessions table for tracking form analysis results
CREATE TABLE IF NOT EXISTS form_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_id TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  total_reps INTEGER DEFAULT 0,
  average_form_score NUMERIC DEFAULT 0,
  max_form_score NUMERIC DEFAULT 0,
  min_form_score NUMERIC DEFAULT 0,
  feedback_summary JSONB,
  analysis_status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_form_analysis_sessions_user_id ON form_analysis_sessions(user_id);

-- Create index on analysis_status for filtering completed sessions
CREATE INDEX IF NOT EXISTS idx_form_analysis_sessions_status ON form_analysis_sessions(analysis_status);

-- Enable Row Level Security
ALTER TABLE form_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own sessions
CREATE POLICY "Users can view their own form analysis sessions"
  ON form_analysis_sessions
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Create RLS policy: Users can insert their own sessions
CREATE POLICY "Users can insert their own form analysis sessions"
  ON form_analysis_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Create RLS policy: Users can update their own sessions
CREATE POLICY "Users can update their own form analysis sessions"
  ON form_analysis_sessions
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Create RLS policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own form analysis sessions"
  ON form_analysis_sessions
  FOR DELETE
  USING (user_id = auth.uid()::text);
