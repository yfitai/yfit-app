-- Add 2 strength workouts to reach minimum 7 required for injury risk assessment
-- User ID: 00a4ce06-aa3b-4073-b136-b30a240295d8

INSERT INTO workouts (
  user_id,
  workout_name,
  workout_type,
  start_time,
  end_time,
  duration_minutes,
  total_sets,
  total_reps,
  total_volume,
  notes,
  created_at
) VALUES
  (
    '00a4ce06-aa3b-4073-b136-b30a240295d8',
    'Upper Body Strength',
    'strength',
    '2026-02-15 09:00:00+00',
    '2026-02-15 10:15:00+00',
    75,
    12,
    96,
    8500,
    'Bench press, rows, shoulder press',
    NOW()
  ),
  (
    '00a4ce06-aa3b-4073-b136-b30a240295d8',
    'Lower Body Strength',
    'strength',
    '2026-02-17 09:00:00+00',
    '2026-02-17 10:30:00+00',
    90,
    15,
    120,
    12000,
    'Squats, deadlifts, leg press',
    NOW()
  );
