-- Add duration-based bodyweight exercises to the exercises table
INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, video_url, created_at)
VALUES
  ('Plank', '["stretching"]', '["core", "abs"]', '["bodyweight"]', 'beginner', 
   'Hold a push-up position with forearms on the ground, body straight from head to heels. Keep core engaged and hold for time.',
   NULL, NOW()),
  
  ('Side Plank (Left)', '["stretching"]', '["core", "obliques"]', '["bodyweight"]', 'intermediate',
   'Lie on left side, prop up on left forearm. Stack feet and lift hips off ground. Hold for time.',
   NULL, NOW()),
  
  ('Side Plank (Right)', '["stretching"]', '["core", "obliques"]', '["bodyweight"]', 'intermediate',
   'Lie on right side, prop up on right forearm. Stack feet and lift hips off ground. Hold for time.',
   NULL, NOW()),
  
  ('Ab Roller', '["stretching"]', '["core", "abs"]', '["ab_roller"]', 'advanced',
   'Kneel with ab roller in hands. Roll forward extending arms, then roll back to starting position. Track total time under tension.',
   NULL, NOW()),
  
  ('Wall Sit', '["stretching"]', '["quads", "glutes"]', '["bodyweight"]', 'beginner',
   'Lean back against wall, slide down until thighs parallel to ground. Hold position for time.',
   NULL, NOW()),
  
  ('Dead Hang', '["stretching"]', '["forearms", "grip", "lats"]', '["pull_up_bar"]', 'beginner',
   'Hang from pull-up bar with arms fully extended. Keep shoulders engaged. Hold for time.',
   NULL, NOW()),
  
  ('L-Sit', '["stretching"]', '["core", "hip_flexors"]', '["bodyweight"]', 'advanced',
   'Sit on ground, place hands beside hips. Lift body off ground with legs extended forward forming an L shape. Hold for time.',
   NULL, NOW()),
  
  ('Hollow Body Hold', '["stretching"]', '["core", "abs"]', '["bodyweight"]', 'intermediate',
   'Lie on back, lift shoulders and legs off ground. Press lower back into floor. Arms extended overhead. Hold for time.',
   NULL, NOW())
ON CONFLICT (name) DO NOTHING;
