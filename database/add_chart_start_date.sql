-- Add chart_start_date column to user_goals table
-- This allows users to control when Progress page charts begin displaying data

ALTER TABLE user_goals 
ADD COLUMN IF NOT EXISTS chart_start_date DATE;

-- Add comment explaining the column
COMMENT ON COLUMN user_goals.chart_start_date IS 'Optional start date for filtering Progress page charts. If null, charts show all available data.';
