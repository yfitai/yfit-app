-- ============================================================
-- YFIT FAQ System - Tables + Full Seed Data
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. CREATE TABLES (safe re-run)

CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  keywords TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES faq_articles(id) ON DELETE CASCADE,
  user_id UUID,
  was_helpful BOOLEAN,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  interaction_type TEXT,
  source TEXT,
  result_type TEXT,
  result_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_interactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can read active categories" ON faq_categories;
CREATE POLICY "Anyone can read active categories" ON faq_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read published articles" ON faq_articles;
CREATE POLICY "Anyone can read published articles" ON faq_articles FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated users can update article counts" ON faq_articles;
CREATE POLICY "Authenticated users can update article counts" ON faq_articles FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert views" ON faq_article_views;
CREATE POLICY "Authenticated users can insert views" ON faq_article_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert interactions" ON help_interactions;
CREATE POLICY "Authenticated users can insert interactions" ON help_interactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faq_articles_category ON faq_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_published ON faq_articles(is_published, display_order);

-- ============================================================
-- 2. SEED CATEGORIES
-- ============================================================

-- Clear existing data for clean re-seed
DELETE FROM faq_article_views;
DELETE FROM faq_articles;
DELETE FROM faq_categories;

INSERT INTO faq_categories (id, name, slug, description, icon, display_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Getting Started',        'getting-started',        'New to YFIT? Start here.',                       '🚀', 1),
  ('a0000002-0000-0000-0000-000000000002', 'Nutrition Tracking',     'nutrition-tracking',     'Logging food, macros, and meal planning.',       '🥗', 2),
  ('a0000003-0000-0000-0000-000000000003', 'Fitness & Workouts',     'fitness-workouts',       'Workout logging, form analysis, and strength.',  '💪', 3),
  ('a0000004-0000-0000-0000-000000000004', 'Goals & Progress',       'goals-progress',         'Setting goals and tracking your results.',       '🎯', 4),
  ('a0000005-0000-0000-0000-000000000005', 'Medications & Health',   'medications-health',     'Medication reminders and health tracking.',      '💊', 5),
  ('a0000006-0000-0000-0000-000000000006', 'AI Coach',               'ai-coach',               'Using the AI coaching and chat features.',       '🤖', 6),
  ('a0000007-0000-0000-0000-000000000007', 'Account Settings',       'account-settings',       'Profile, preferences, and privacy.',             '⚙️', 7),
  ('a0000008-0000-0000-0000-000000000008', 'Subscription & Billing', 'subscription-billing',   'Plans, payments, and upgrades.',                 '💳', 8),
  ('a0000009-0000-0000-0000-000000000009', 'Troubleshooting',        'troubleshooting',        'Fixing common issues and errors.',               '🔧', 9);

-- ============================================================
-- 3. SEED ARTICLES
-- ============================================================

-- ---- GETTING STARTED ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000001-0000-0000-0000-000000000001',
'How do I set up my YFIT profile for the first time?',
'Welcome to YFIT! Here''s how to get set up in a few minutes:

1. Open the app and sign in with your email address.
2. Tap the Goals icon in the top navigation bar.
3. Enter your personal details: age, height, weight, and biological sex.
4. Choose your primary goal (lose fat, build muscle, maintain, or body recomposition).
5. Select your activity level — pick the one that best matches your typical week.
6. Set your calorie and macro targets (or let YFIT calculate them for you).
7. Optionally add body measurements in the Body Measurements section.

Once your goals are saved, your Dashboard will show personalised calorie targets and your weekly wellness score will start tracking.',
'how-do-i-set-up-my-yfit-profile-for-the-first-time',
ARRAY['setup', 'profile', 'first time', 'getting started', 'onboarding'], false, 1),

('a0000001-0000-0000-0000-000000000001',
'What does YFIT actually track?',
'YFIT is a comprehensive health and fitness app that tracks:

- Nutrition: daily calories, macros (protein, carbs, fat), meal logs, and water intake
- Fitness: workout sessions, exercises, sets, reps, weights, and form analysis scores
- Body metrics: weight, body fat %, BMI, and 9 body measurements (waist, hips, biceps, etc.)
- Daily activity: step count, calories burned, and activity streaks
- Medications: medication schedules, dosages, and reminders
- Progress: charts and trends for all tracked metrics over time
- AI coaching: personalised advice, workout recommendations, and Q&A

Everything is connected so your AI Coach can give you advice based on your actual data.',
'what-does-yfit-actually-track',
ARRAY['tracking', 'features', 'what does yfit do', 'overview'], false, 2),

('a0000001-0000-0000-0000-000000000001',
'How do I navigate between pages in the app?',
'The main navigation bar runs across the top of the screen with icons for each section:

- Dashboard: your daily summary and quick stats
- Nutrition: food logging and meal tracking
- Fitness: workouts and form analysis
- Progress: charts and trends
- Goals: targets and body measurements
- Medications: medication tracker
- Predictions: AI body recomposition forecast
- Body Recomp: body measurement progress
- AI Coach: chat with your AI coach and browse FAQs
- Daily Tracker: log steps, water, sleep, and measurements

Tap any icon to navigate to that section. On smaller screens, you may need to scroll the navigation bar left or right to see all icons.',
'how-do-i-navigate-between-pages-in-the-app',
ARRAY['navigation', 'how to use', 'tabs', 'pages', 'menu'], false, 3),

('a0000001-0000-0000-0000-000000000001',
'Is my data private and secure?',
'Yes. YFIT takes your privacy seriously:

- All data is stored securely in an encrypted database.
- Your account is protected by email and password authentication.
- Health data (weight, medications, body measurements) is never shared with third parties.
- AI Coach conversations are processed to generate responses but are not used to train external models.
- You can delete your account and all associated data at any time from Account Settings.

YFIT does not sell your personal data. Your health information stays yours.',
'is-my-data-private-and-secure',
ARRAY['privacy', 'security', 'data', 'safe', 'personal information'], false, 4),

('a0000001-0000-0000-0000-000000000001',
'Can I use YFIT on both my phone and a web browser?',
'Yes! YFIT works on:

- Android app: download from the Google Play Store
- Web browser: visit the YFIT web app on any device

Your data syncs automatically between all platforms. Log a meal on your phone and it will appear instantly on the web version, and vice versa. There is no separate sync button — everything updates in real time.',
'can-i-use-yfit-on-both-my-phone-and-a-web-browser',
ARRAY['web', 'android', 'sync', 'cross platform', 'browser', 'phone'], false, 5),

('a0000001-0000-0000-0000-000000000001',
'How do I change my units between metric and imperial?',
'To switch between metric (kg, cm) and imperial (lbs, inches):

1. Tap the Goals icon in the navigation bar.
2. Scroll to the Units section.
3. Toggle between Metric and Imperial.
4. Tap Save Goals.

All measurements throughout the app will immediately display in your chosen unit system.',
'how-do-i-change-my-units-between-metric-and-imperial',
ARRAY['units', 'metric', 'imperial', 'kg', 'lbs', 'cm', 'inches', 'toggle'], false, 6),

('a0000001-0000-0000-0000-000000000001',
'What is the beta programme and how do I join?',
'YFIT is currently in beta — a testing phase where a small group of users try the app before it launches publicly. Beta testers get:

- Early access to all features
- Direct influence on the app''s development
- The ability to report bugs and request features using the feedback button (blue/green circle, bottom-right of every page)

To join the beta, you need an invite code. Current codes are YFIT-BETA-2026, YFIT-EARLY, and YFIT-VIP. Enter your code during sign-up. If you''re already signed in, you''re already a beta tester!',
'what-is-the-beta-programme-and-how-do-i-join',
ARRAY['beta', 'invite', 'testing', 'early access', 'beta code'], false, 7),

('a0000001-0000-0000-0000-000000000001',
'How do I log out of YFIT?',
'To log out:

1. Tap the Account Settings icon in the navigation bar.
2. Scroll to the bottom of the page.
3. Tap Sign Out.

You will be returned to the login screen. Your data is saved in the cloud, so everything will be there when you log back in.',
'how-do-i-log-out-of-yfit',
ARRAY['log out', 'sign out', 'logout'], false, 8),

('a0000001-0000-0000-0000-000000000001',
'How do I delete my account?',
'To delete your YFIT account and all associated data:

1. Go to Account Settings.
2. Scroll to the Danger Zone section.
3. Tap Delete Account.
4. Confirm by entering your email address.

This action is permanent and cannot be undone. All your logs, measurements, workout history, and personal data will be deleted immediately.',
'how-do-i-delete-my-account',
ARRAY['delete account', 'remove account', 'cancel', 'data deletion'], false, 9),

('a0000001-0000-0000-0000-000000000001',
'What should I do first after signing up?',
'After signing up, follow these steps to get the most out of YFIT:

1. Set your Goals: enter your age, height, weight, goal, and activity level. This unlocks personalised calorie targets.
2. Log your first meal: go to Nutrition and search for a food to log breakfast or lunch.
3. Log a workout: go to Fitness and start a workout session to see how the tracker works.
4. Check your Dashboard: see your daily summary, step count, and streak.
5. Try the AI Coach: ask it a question about your fitness or nutrition goals.

Most users are fully set up within 10 minutes.',
'what-should-i-do-first-after-signing-up',
ARRAY['first steps', 'what to do', 'new user', 'start', 'setup guide'], false, 10);

-- ---- NUTRITION TRACKING ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000002-0000-0000-0000-000000000002',
'How do I log a meal or food item?',
'To log food in YFIT:

1. Tap the Nutrition icon in the navigation bar.
2. Select the meal you want to log (Breakfast, Lunch, Dinner, or Snacks).
3. Tap the + Add Food button.
4. Search for your food by name, or tap the barcode scanner icon to scan a product.
5. Adjust the serving size and quantity.
6. Tap Log Food.

Your calories and macros will update immediately on the Nutrition page and on your Dashboard.',
'how-do-i-log-a-meal-or-food-item',
ARRAY['log food', 'add meal', 'track food', 'log meal', 'food diary'], false, 1),

('a0000002-0000-0000-0000-000000000002',
'How does the barcode scanner work?',
'The barcode scanner lets you instantly log packaged foods:

1. In the Nutrition page, tap + Add Food for any meal.
2. Tap the barcode icon next to the search bar.
3. Point your camera at the barcode on the product packaging.
4. YFIT will automatically look up the nutritional information from the Open Food Facts database.
5. Confirm the serving size and tap Log Food.

The scanner works on both the Android app and the web browser (web requires camera permission). If a product is not found, you can add it manually using the Create Custom Food option.',
'how-does-the-barcode-scanner-work',
ARRAY['barcode', 'scanner', 'scan food', 'camera', 'packaged food'], false, 2),

('a0000002-0000-0000-0000-000000000002',
'How do I create a custom food?',
'If a food is not in the database, you can create it:

1. In Nutrition, tap + Add Food.
2. Scroll down and tap Create Custom Food.
3. Enter the food name, serving size, and nutritional values (calories, protein, carbs, fat).
4. Tap Save.

The food is added to your My Foods list for quick access in the future.',
'how-do-i-create-a-custom-food',
ARRAY['custom food', 'add food', 'create food', 'manual entry', 'not in database'], false, 3),

('a0000002-0000-0000-0000-000000000002',
'What is the My Foods tab?',
'My Foods is your personal food library. It contains:

- Foods you have saved as favourites from search results
- Foods you have scanned with the barcode scanner and saved
- Custom foods you have created

To save a food to My Foods: search for it, tap the heart/star icon next to it.
To delete a food from My Foods: go to the My Foods tab, tap the trash can icon next to the food, and confirm deletion.',
'what-is-the-my-foods-tab',
ARRAY['my foods', 'favourites', 'saved foods', 'food library', 'delete food'], false, 4),

('a0000002-0000-0000-0000-000000000002',
'How do I set my calorie and macro targets?',
'YFIT can calculate your targets automatically or you can set them manually:

Automatic calculation:
1. Go to Goals.
2. Enter your age, height, weight, goal, and activity level.
3. Tap Save Goals — YFIT calculates your TDEE and sets calorie and macro targets.

Manual override:
1. Go to Goals.
2. Scroll to the Nutrition Targets section.
3. Enter your own calorie and macro values.
4. Tap Save.

Your targets appear as the daily limit bars on the Nutrition page.',
'how-do-i-set-my-calorie-and-macro-targets',
ARRAY['calorie target', 'macro target', 'TDEE', 'calorie goal', 'protein goal'], false, 5),

('a0000002-0000-0000-0000-000000000002',
'What is TDEE and how is it calculated?',
'TDEE stands for Total Daily Energy Expenditure — the total number of calories your body burns in a day, including exercise.

YFIT calculates your TDEE using the Mifflin-St Jeor formula:

1. First it calculates your BMR (Basal Metabolic Rate) — the calories you burn at rest — based on your age, height, weight, and sex.
2. Then it multiplies your BMR by an activity factor:
   - Sedentary (little/no exercise): x 1.2
   - Light (1-3 days/week): x 1.375
   - Moderate (3-5 days/week): x 1.55
   - Active (6-7 days/week): x 1.725
   - Very Active (hard exercise daily): x 1.9

Your calorie target is then adjusted based on your goal (deficit for fat loss, surplus for muscle gain).',
'what-is-tdee-and-how-is-it-calculated',
ARRAY['TDEE', 'calories', 'BMR', 'activity level', 'calorie calculation'], false, 6),

('a0000002-0000-0000-0000-000000000002',
'Can I log water intake?',
'Yes! To log water:

1. Go to the Daily Tracker page.
2. Find the Water Intake section.
3. Tap the + button to add glasses or enter a custom amount in ml/oz.

Your daily water intake is shown on the Dashboard and in the Daily Tracker. You can set a daily water goal in the Goals page.',
'can-i-log-water-intake',
ARRAY['water', 'hydration', 'water intake', 'log water', 'drink'], false, 7),

('a0000002-0000-0000-0000-000000000002',
'Why are my calories showing differently than expected?',
'If your calorie totals look wrong, check these common causes:

1. Serving size: make sure you selected the correct serving size and quantity when logging.
2. Duplicate entries: you may have logged the same food twice. Scroll through your meal log to check.
3. Database values: nutritional values come from Open Food Facts and the USDA database. These may differ slightly from the label on your product. Use the custom food feature to enter exact values from your packaging.
4. Calorie target: if your target seems wrong, revisit your Goals page and check your weight, activity level, and goal are set correctly.',
'why-are-my-calories-showing-differently-than-expected',
ARRAY['calories wrong', 'calorie error', 'incorrect calories', 'nutrition wrong'], false, 8),

('a0000002-0000-0000-0000-000000000002',
'How do I edit or delete a food I already logged?',
'To edit a logged food:
1. Go to Nutrition and find the meal containing the food.
2. Tap the food item.
3. Adjust the serving size or quantity.
4. Tap Update.

To delete a logged food:
1. Go to Nutrition and find the meal.
2. Swipe left on the food item, or tap it and select Delete.
3. Confirm deletion.

Your daily totals will update immediately.',
'how-do-i-edit-or-delete-a-food-i-already-logged',
ARRAY['edit food', 'delete food', 'remove food', 'change serving', 'fix log'], false, 9),

('a0000002-0000-0000-0000-000000000002',
'What food databases does YFIT use?',
'YFIT searches two databases to find nutritional information:

1. Open Food Facts: a free, open-source database of packaged foods from around the world. Ideal for branded products and anything with a barcode.
2. USDA FoodData Central: the official US government database with detailed nutritional data for whole foods, ingredients, and restaurant items.

When you search for a food, YFIT searches both databases simultaneously and shows the best matches. If a food is not found in either database, you can create a custom food entry with your own nutritional values.',
'what-food-databases-does-yfit-use',
ARRAY['food database', 'Open Food Facts', 'USDA', 'data source', 'nutritional data'], false, 10);

-- ---- FITNESS & WORKOUTS ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000003-0000-0000-0000-000000000003',
'How do I log a workout?',
'To log a workout in YFIT:

1. Tap the Fitness icon in the navigation bar.
2. Tap Start Workout.
3. Select a workout plan or choose exercises manually.
4. For each exercise, log your sets, reps, and weight.
5. Tap Complete Workout when finished.

Your workout is saved to your history and counts toward your weekly workout total on the Dashboard.',
'how-do-i-log-a-workout',
ARRAY['log workout', 'start workout', 'track workout', 'exercise log'], false, 1),

('a0000003-0000-0000-0000-000000000003',
'What is Form Analysis and how does it work?',
'Form Analysis uses your device''s camera and AI to analyse your exercise technique in real time:

1. Go to Fitness and tap Form Analysis.
2. Select the exercise you want to analyse (e.g. squat, deadlift, push-up).
3. Position your phone so the camera can see your full body.
4. Perform the exercise — the AI tracks your joint positions and movement.
5. After the set, you receive a Form Score (0-100%) with specific feedback on what to improve.

Form scores are saved to your history. Regular form analysis helps prevent injury and maximises training effectiveness.',
'what-is-form-analysis-and-how-does-it-work',
ARRAY['form analysis', 'form score', 'technique', 'AI analysis', 'camera', 'posture'], false, 2),

('a0000003-0000-0000-0000-000000000003',
'What exercises are available in the workout library?',
'YFIT includes a comprehensive exercise library with hundreds of exercises across all muscle groups:

- Upper body: bench press, shoulder press, rows, pull-ups, curls, tricep extensions
- Lower body: squats, deadlifts, lunges, leg press, calf raises
- Core: planks, crunches, Russian twists, leg raises
- Cardio: running, cycling, rowing, HIIT
- Flexibility: stretching routines and yoga flows

Each exercise includes instructions, muscle group tags, and equipment requirements. You can also add custom exercises if something is missing.',
'what-exercises-are-available-in-the-workout-library',
ARRAY['exercise library', 'exercises', 'workout list', 'muscle groups', 'custom exercise'], false, 3),

('a0000003-0000-0000-0000-000000000003',
'How do I create a custom workout plan?',
'To create your own workout plan:

1. Go to Fitness and tap the Plans tab.
2. Tap Create New Plan.
3. Name your plan (e.g. "Push Day" or "Full Body Monday").
4. Add exercises by searching the library.
5. Set default sets, reps, and weight for each exercise.
6. Save the plan.

Your custom plans appear in the Plans list and can be started with one tap.',
'how-do-i-create-a-custom-workout-plan',
ARRAY['workout plan', 'custom plan', 'create plan', 'routine', 'program'], false, 4),

('a0000003-0000-0000-0000-000000000003',
'What does the Strength Stats tab show?',
'The Strength Stats tab shows your progress for strength training:

- Weekly workout count: number of completed strength sessions this week
- Total volume: total weight lifted (sets x reps x weight) over time
- Personal records: your best performance for each exercise
- Progress charts: strength trends for individual exercises over 30/90/180 days
- Recent sessions: a log of your last 10 completed workouts

Only strength and resistance training sessions are counted here.',
'what-does-the-strength-stats-tab-show',
ARRAY['strength stats', 'progress', 'personal record', 'volume', 'strength tracking'], false, 5),

('a0000003-0000-0000-0000-000000000003',
'How do I track cardio workouts?',
'To log a cardio session:

1. Go to Fitness and tap Start Workout.
2. Select a cardio exercise (running, cycling, rowing, etc.) or create a custom cardio entry.
3. Log duration, distance (if applicable), and perceived effort.
4. Tap Complete Workout.

Cardio sessions are saved to your workout history. Your step count from the Daily Tracker also contributes to your overall activity picture.',
'how-do-i-track-cardio-workouts',
ARRAY['cardio', 'running', 'cycling', 'cardio tracking', 'aerobic'], false, 6),

('a0000003-0000-0000-0000-000000000003',
'Can I see my workout history?',
'Yes. To view your workout history:

1. Go to Fitness and tap the History tab.
2. Your completed sessions are listed in reverse chronological order.
3. Tap any session to see the full details: exercises, sets, reps, weights, and duration.

You can also see workout trends in the Progress page, which shows volume and frequency charts over time.',
'can-i-see-my-workout-history',
ARRAY['workout history', 'past workouts', 'exercise history', 'session log'], false, 7),

('a0000003-0000-0000-0000-000000000003',
'What is the difference between a workout session and a workout plan?',
'A workout plan is a template — a list of exercises with default sets, reps, and weights that you can reuse. Think of it as your routine or programme.

A workout session is a single completed workout — a record of what you actually did on a specific date, including the exact weights lifted and reps completed.

You start a session by selecting a plan (or building one on the fly), then log your actual performance during the session.',
'what-is-the-difference-between-a-workout-session-and-a-worko',
ARRAY['workout plan', 'workout session', 'difference', 'template', 'routine'], false, 8),

('a0000003-0000-0000-0000-000000000003',
'How do I use progressive overload tracking?',
'Progressive overload means gradually increasing the challenge of your workouts over time — the key driver of strength and muscle gains.

YFIT tracks progressive overload automatically:
- Each time you complete a set, the weight and reps are saved.
- In the Strength Stats tab, you can see your progress charts for each exercise.
- Personal records are highlighted when you beat a previous best.
- The AI Coach can suggest when to increase weight based on your recent performance.

Aim to increase weight or reps slightly every 1-2 weeks for each exercise.',
'how-do-i-use-progressive-overload-tracking',
ARRAY['progressive overload', 'increase weight', 'strength progress', 'personal record'], false, 9),

('a0000003-0000-0000-0000-000000000003',
'How is my workout compliance tracked?',
'The workout section of your Dashboard shows completed strength sessions for the current week. The target is 3 strength sessions per week — a common evidence-based recommendation for most goals.

Your weekly workout count is compared against this 3-session target. If you train more or less than 3 times per week, you can discuss adjusting your programme with the AI Coach.',
'how-is-my-workout-compliance-tracked',
ARRAY['workout compliance', 'workout target', 'sessions per week', 'workout goal'], false, 10);

-- ---- GOALS & PROGRESS ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000004-0000-0000-0000-000000000004',
'How do I set my fitness goals?',
'To set your goals in YFIT:

1. Tap the Goals icon in the navigation bar.
2. Fill in your personal details: age, height, current weight, and biological sex.
3. Select your primary goal:
   - Lose Fat: creates a calorie deficit
   - Build Muscle: creates a calorie surplus
   - Maintain Weight: sets maintenance calories
   - Body Recomposition: targets fat loss and muscle gain simultaneously
4. Choose your activity level.
5. Set your target weight and target body fat % if desired.
6. Tap Save Goals.',
'how-do-i-set-my-fitness-goals',
ARRAY['set goals', 'fitness goals', 'target weight', 'goal setting', 'objectives'], false, 1),

('a0000004-0000-0000-0000-000000000004',
'What is body recomposition?',
'Body recomposition (or "recomp") means losing body fat and gaining muscle at the same time. It is the most challenging goal but achievable for most people, especially beginners and those returning after a break.

YFIT supports recomposition by:
- Setting calories at or near maintenance (not a large deficit or surplus)
- Prioritising high protein intake to preserve and build muscle
- Tracking body measurements over time in the Body Recomp tab
- Providing a body recomposition forecast in the Predictions page

Recomposition is slower than pure fat loss or pure muscle gain, but the results are more balanced.',
'what-is-body-recomposition',
ARRAY['body recomposition', 'recomp', 'lose fat gain muscle', 'body composition'], false, 2),

('a0000004-0000-0000-0000-000000000004',
'How do I track my weight and body fat?',
'To log your weight and body fat:

1. Go to the Daily Tracker.
2. Find the Body Metrics section.
3. Enter your weight and/or body fat percentage.
4. Tap Save.

Your weight and body fat history are shown as charts on the Progress page, alongside your BMI trend.',
'how-do-i-track-my-weight-and-body-fat',
ARRAY['weight tracking', 'body fat', 'log weight', 'weigh in', 'BMI'], false, 3),

('a0000004-0000-0000-0000-000000000004',
'How do I track body measurements?',
'To log body measurements (waist, hips, biceps, etc.):

1. Go to the Daily Tracker.
2. Scroll to the Weekly Body Measurements section.
3. Enter your measurements for any body parts you want to track.
4. Tap Save Measurements.

Your measurements are shown in the Body Recomp tab with direction-aware progress bars — reducing measurements (waist, hips) show progress as they decrease, while building measurements (biceps, neck, thighs) show progress as they increase.',
'how-do-i-track-body-measurements',
ARRAY['body measurements', 'waist', 'hips', 'biceps', 'measurements', 'tape measure'], false, 4),

('a0000004-0000-0000-0000-000000000004',
'What does the Progress page show?',
'The Progress page shows your long-term trends across all tracked metrics:

- Weight chart: your weight history with starting point, current, and goal markers
- Body Fat % chart: your body fat trend over time
- BMI chart: your BMI history
- Measurements: charts for each body measurement you track
- Workout volume: total weight lifted per week
- Nutrition averages: average daily calories and macros over time

Use the time range selector (30 / 90 / 180 days / 1 year) to zoom in or out on your progress.',
'what-does-the-progress-page-show',
ARRAY['progress page', 'charts', 'trends', 'progress tracking', 'history'], false, 5),

('a0000004-0000-0000-0000-000000000004',
'What is the Day Streak on my Dashboard?',
'The Day Streak counts how many consecutive days you have logged any activity in the Daily Tracker. It resets to 0 if you miss a day.

The streak is shown on your Dashboard with a fire icon. Building a logging streak is one of the most effective habits for long-term fitness success — consistency beats perfection every time.',
'what-is-the-day-streak-on-my-dashboard',
ARRAY['streak', 'day streak', 'consistency', 'habit', 'logging streak'], false, 6),

('a0000004-0000-0000-0000-000000000004',
'How do I set body measurement goals?',
'To set goals for body measurements:

1. Go to Goals.
2. Scroll to the Body Measurements section.
3. Enter your current measurements and your goal measurements for each body part.
4. Tap Save Goals.

Your goals appear in the Body Recomp tab as target lines on the progress bars and charts.',
'how-do-i-set-body-measurement-goals',
ARRAY['measurement goals', 'body goals', 'waist goal', 'bicep goal', 'target measurements'], false, 7),

('a0000004-0000-0000-0000-000000000004',
'How accurate are the calorie and macro calculations?',
'YFIT''s calculations are based on well-established scientific formulas (Mifflin-St Jeor for BMR, standard activity multipliers). They provide a good starting estimate for most people.

However, individual metabolism varies. If you are consistently losing or gaining weight faster or slower than expected, adjust your calorie target by 100-200 calories and monitor for 2 weeks before adjusting again.

The AI Coach can help you fine-tune your targets based on your actual results.',
'how-accurate-are-the-calorie-and-macro-calculations',
ARRAY['calorie accuracy', 'macro accuracy', 'calculation', 'metabolism', 'adjust calories'], false, 8),

('a0000004-0000-0000-0000-000000000004',
'What is the Predictions page?',
'The Predictions page uses your current data to forecast your body composition results over time:

- Body Recomposition Forecast: projects your weight, body fat %, and muscle mass based on your current calorie intake, protein targets, and workout frequency
- Timeline to goal: estimates when you will reach your target weight or body fat %
- Scenario modelling: shows how different calorie targets or workout frequencies would change your timeline

The forecast updates as you log more data.',
'what-is-the-predictions-page',
ARRAY['predictions', 'forecast', 'timeline', 'body composition forecast', 'goal date'], false, 9),

('a0000004-0000-0000-0000-000000000004',
'How does the activity level setting affect my calorie target?',
'The activity level you select in Goals applies a multiplier to your BMR to calculate your TDEE:

- Sedentary (little/no exercise): BMR x 1.2
- Light (1-3 days/week): BMR x 1.375
- Moderate (3-5 days/week): BMR x 1.55
- Active (6-7 days/week): BMR x 1.725
- Very Active (hard exercise daily): BMR x 1.9

Update your activity level in Goals if your training frequency changes significantly.',
'how-does-the-activity-level-setting-affect-my-calorie-target',
ARRAY['activity level', 'calorie multiplier', 'TDEE', 'exercise frequency', 'sedentary'], false, 10);

-- ---- MEDICATIONS & HEALTH ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000005-0000-0000-0000-000000000005',
'How do I add a medication to track?',
'To add a medication:

1. Tap the Medications icon in the navigation bar.
2. Tap Add Medication.
3. Enter the medication name, dosage, and unit (mg, ml, tablets, etc.).
4. Set the schedule: how many times per day and at what times.
5. Add any notes (e.g. "take with food").
6. Tap Save.

Your medication will appear on the Medications page with its schedule.',
'how-do-i-add-a-medication-to-track',
ARRAY['add medication', 'medication setup', 'drug', 'prescription', 'dosage'], false, 1),

('a0000005-0000-0000-0000-000000000005',
'How do medication reminders work?',
'YFIT tracks your medication schedule and shows upcoming and overdue doses on the Medications page.

On the Android app, you can enable push notifications for medication reminders:
1. Go to Account Settings.
2. Enable Medication Reminders.
3. Allow notification permissions when prompted.

On the web version, reminders appear as in-app alerts when you open the app. The Medications page shows a colour-coded status for each dose: green (taken), yellow (due soon), red (overdue).',
'how-do-medication-reminders-work',
ARRAY['medication reminder', 'reminder', 'notification', 'dose reminder', 'alert'], false, 2),

('a0000005-0000-0000-0000-000000000005',
'Can I track supplements as well as medications?',
'Yes — the Medications tracker works for any supplement or health product, not just prescription medications. You can track:

- Prescription medications
- Over-the-counter medications
- Vitamins and minerals (vitamin D, magnesium, zinc, etc.)
- Protein supplements
- Pre-workout, creatine, omega-3, and other sports supplements

Simply add it the same way as a medication, using the supplement name and your dosage.',
'can-i-track-supplements-as-well-as-medications',
ARRAY['supplements', 'vitamins', 'creatine', 'protein powder', 'omega-3', 'track supplements'], false, 3),

('a0000005-0000-0000-0000-000000000005',
'How do I mark a dose as taken?',
'To mark a medication dose as taken:

1. Go to the Medications page.
2. Find the medication and the specific dose time.
3. Tap the checkmark button next to the dose.

The dose will be marked as taken and the time recorded. You can also mark a dose as skipped if you intentionally did not take it.',
'how-do-i-mark-a-dose-as-taken',
ARRAY['mark taken', 'dose taken', 'medication log', 'adherence', 'check off'], false, 4),

('a0000005-0000-0000-0000-000000000005',
'Can I see my medication history?',
'Yes. To view your medication history:

1. Go to Medications.
2. Tap on a specific medication.
3. Select the History tab.

You will see a calendar view showing which doses were taken, skipped, or missed over the past 30 days.',
'can-i-see-my-medication-history',
ARRAY['medication history', 'adherence history', 'dose history', 'medication log'], false, 5),

('a0000005-0000-0000-0000-000000000005',
'How do I edit or delete a medication?',
'To edit a medication:
1. Go to Medications.
2. Tap on the medication name.
3. Tap Edit, make your changes, and tap Save.

To delete a medication:
1. Go to Medications.
2. Tap on the medication name.
3. Tap Delete and confirm.

Deleting a medication removes it from your schedule but your historical dose logs are retained.',
'how-do-i-edit-or-delete-a-medication',
ARRAY['edit medication', 'delete medication', 'remove medication', 'change dosage'], false, 6),

('a0000005-0000-0000-0000-000000000005',
'Does YFIT provide medical advice?',
'No. YFIT is a fitness and health tracking app, not a medical service. The app does not provide medical diagnoses, treatment recommendations, or advice about specific medications.

The AI Coach can answer general questions about nutrition, fitness, and healthy habits, but it is not a substitute for professional medical advice. Always consult your doctor or pharmacist before starting, stopping, or changing any medication.',
'does-yfit-provide-medical-advice',
ARRAY['medical advice', 'doctor', 'medical disclaimer', 'health advice', 'prescription'], false, 7),

('a0000005-0000-0000-0000-000000000005',
'Can I set different schedules for different days?',
'Yes. When adding or editing a medication, you can customise the schedule:

- Daily: same times every day
- Specific days: e.g. Monday, Wednesday, Friday only
- Every X days: e.g. every 2 days or every week
- As needed: no fixed schedule, just log when taken

Select the schedule type that matches your prescription or supplement routine.',
'can-i-set-different-schedules-for-different-days',
ARRAY['medication schedule', 'days of week', 'every other day', 'weekly', 'custom schedule'], false, 8),

('a0000005-0000-0000-0000-000000000005',
'What health metrics can I track beyond medications?',
'In addition to medications, YFIT tracks:

- Weight: daily weigh-ins with trend charts
- Body fat %: manual entry or estimated from measurements
- BMI: calculated automatically from height and weight
- Body measurements: waist, hips, chest, biceps, thighs, calves, neck, shoulders, forearms
- Steps: daily step count
- Water intake: daily hydration tracking
- Sleep: hours of sleep per night

All metrics are shown in the Progress page with historical charts.',
'what-health-metrics-can-i-track-beyond-medications',
ARRAY['health metrics', 'tracking', 'BMI', 'body fat', 'sleep', 'steps', 'water'], false, 9),

('a0000005-0000-0000-0000-000000000005',
'How do I log my daily steps?',
'To log steps:

1. Go to the Daily Tracker.
2. Find the Steps section.
3. Enter your step count for the day.
4. Tap Save.

Your steps appear on the Dashboard and contribute to your daily activity summary. You can set a daily step goal in the Goals page.',
'how-do-i-log-my-daily-steps',
ARRAY['steps', 'step count', 'pedometer', 'daily steps', 'walking'], false, 10);

-- ---- AI COACH ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000006-0000-0000-0000-000000000006',
'What can the AI Coach help me with?',
'The YFIT AI Coach is a personalised fitness and nutrition assistant that can help you with:

- Workout advice: exercise selection, programming, progressive overload strategies
- Nutrition guidance: meal planning, macro targets, food choices
- Goal setting: realistic timelines, strategy adjustments
- Form tips: technique advice for specific exercises
- Motivation: accountability, habit building, overcoming plateaus
- General health questions: sleep, recovery, stress management
- App help: how to use YFIT features

The AI Coach has access to your logged data to give personalised advice based on your actual progress.',
'what-can-the-ai-coach-help-me-with',
ARRAY['AI coach', 'what can AI do', 'coach features', 'personal trainer', 'nutrition advice'], false, 1),

('a0000006-0000-0000-0000-000000000006',
'How do I start a conversation with the AI Coach?',
'To chat with the AI Coach:

1. Tap the AI Coach icon in the navigation bar.
2. The AI Coach tab opens by default.
3. Type your question in the message box at the bottom.
4. Tap Send.

The AI will respond within a few seconds. You can ask follow-up questions in the same conversation. Tap New Conversation to start a fresh chat.',
'how-do-i-start-a-conversation-with-the-ai-coach',
ARRAY['start chat', 'AI conversation', 'how to use AI coach', 'chat'], false, 2),

('a0000006-0000-0000-0000-000000000006',
'Does the AI Coach remember my previous conversations?',
'Within a single conversation session, the AI Coach remembers the full context of your chat. However, when you start a New Conversation, the previous chat history is not carried over.

The AI Coach does have access to your profile data (goals, weight, activity level) to give personalised advice in every new conversation — it just does not remember the specific questions you asked in previous sessions.',
'does-the-ai-coach-remember-my-previous-conversations',
ARRAY['AI memory', 'conversation history', 'remember', 'context', 'previous chat'], false, 3),

('a0000006-0000-0000-0000-000000000006',
'Is the AI Coach advice safe to follow?',
'The AI Coach provides general fitness and nutrition guidance based on widely accepted principles. It is designed to be helpful and evidence-based.

However, the AI Coach is not a licensed personal trainer, registered dietitian, or medical professional. Its advice should be treated as a starting point, not a definitive prescription.

- Consult a doctor before starting a new exercise programme if you have health conditions
- Consult a registered dietitian for specific medical nutrition therapy
- Use your own judgement and listen to your body

If the AI gives advice that seems unsafe, please report it using the feedback button.',
'is-the-ai-coach-advice-safe-to-follow',
ARRAY['AI safety', 'AI advice', 'reliable', 'trust AI', 'disclaimer'], false, 4),

('a0000006-0000-0000-0000-000000000006',
'Can the AI Coach create a workout plan for me?',
'Yes! Ask the AI Coach to create a personalised workout plan. For best results, tell it:

- Your goal (fat loss, muscle gain, strength, general fitness)
- How many days per week you can train
- What equipment you have access to (gym, home, bodyweight only)
- Your experience level (beginner, intermediate, advanced)
- Any injuries or limitations

The AI will generate a structured programme with exercises, sets, reps, and progression guidelines.',
'can-the-ai-coach-create-a-workout-plan-for-me',
ARRAY['workout plan', 'AI workout', 'create programme', 'personalised plan', 'training plan'], false, 5),

('a0000006-0000-0000-0000-000000000006',
'Can the AI Coach help with meal planning?',
'Yes. The AI Coach can help you plan meals that fit your calorie and macro targets. Tell it:

- Your daily calorie target
- Your macro split (protein/carbs/fat goals)
- Your food preferences and any dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- How many meals per day you prefer

The AI will suggest meal ideas, portion sizes, and even full day meal plans. You can then log these meals in the Nutrition section.',
'can-the-ai-coach-help-with-meal-planning',
ARRAY['meal plan', 'AI meal planning', 'diet plan', 'food suggestions', 'meal ideas'], false, 6),

('a0000006-0000-0000-0000-000000000006',
'Why is the AI Coach slow to respond sometimes?',
'The AI Coach response time depends on your internet connection speed, server load, and the complexity of your question.

Typical response time is 3-10 seconds. If the AI does not respond after 30 seconds, try sending your message again. If the problem persists, check your internet connection and try refreshing the app.',
'why-is-the-ai-coach-slow-to-respond-sometimes',
ARRAY['AI slow', 'response time', 'AI not responding', 'loading', 'delay'], false, 7),

('a0000006-0000-0000-0000-000000000006',
'How do I give feedback on an AI response?',
'If an AI Coach response was unhelpful, incorrect, or inappropriate:

1. Use the feedback button (blue/green circle, bottom-right of any page).
2. Select Bug Report or General Feedback.
3. Describe the issue — include the question you asked and what was wrong with the response.

Your feedback helps improve the AI Coach for all users.',
'how-do-i-give-feedback-on-an-ai-response',
ARRAY['AI feedback', 'report AI', 'bad response', 'incorrect answer', 'improve AI'], false, 8),

('a0000006-0000-0000-0000-000000000006',
'What is the FAQ tab in the AI Coach section?',
'The FAQ tab contains a searchable library of common questions and answers about using YFIT. It covers all major features and is organised into 9 categories.

Use the search bar at the top to find answers quickly, or browse by category using the filter buttons. If you cannot find what you need in the FAQ, tap Ask AI Coach to switch to the chat interface and ask your question directly.',
'what-is-the-faq-tab-in-the-ai-coach-section',
ARRAY['FAQ', 'help articles', 'knowledge base', 'support', 'FAQ tab'], false, 9),

('a0000006-0000-0000-0000-000000000006',
'Does the AI Coach use my personal data?',
'The AI Coach uses your YFIT profile data to personalise its responses:

- Your goals (fat loss, muscle gain, etc.)
- Your current weight and target weight
- Your activity level
- Your calorie and macro targets

This data is sent to the AI model only to generate your response and is not stored by the AI provider or used to train future models.',
'does-the-ai-coach-use-my-personal-data',
ARRAY['AI data', 'privacy', 'personal data', 'AI training', 'data usage'], false, 10);

-- ---- ACCOUNT SETTINGS ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000007-0000-0000-0000-000000000007',
'How do I change my email address or password?',
'To change your email or password:

1. Go to Account Settings in the navigation bar.
2. Tap Edit Profile.
3. To change email: enter your new email address and tap Save. You will receive a confirmation email.
4. To change password: tap Change Password, enter your current password, then your new password twice, and tap Save.',
'how-do-i-change-my-email-address-or-password',
ARRAY['change email', 'change password', 'update email', 'reset password', 'account security'], false, 1),

('a0000007-0000-0000-0000-000000000007',
'How do I turn on or off notifications?',
'To manage notifications:

1. Go to Account Settings.
2. Tap Notifications.
3. Toggle on/off for each notification type:
   - Medication reminders
   - Daily logging reminders
   - Weekly progress summaries
   - App updates

On Android, you may also need to allow notifications in your phone''s system settings (Settings > Apps > YFIT > Notifications).',
'how-do-i-turn-on-or-off-notifications',
ARRAY['notifications', 'reminders', 'push notifications', 'alerts', 'turn off notifications'], false, 2),

('a0000007-0000-0000-0000-000000000007',
'How do I export my data?',
'Data export is coming in a future update. When available, you will be able to export:

- Nutrition logs (CSV)
- Workout history (CSV)
- Body measurements and weight history (CSV)
- Progress charts (PDF)

In the meantime, you can view all your historical data in the Progress page. If you need a data export urgently, use the feedback button to submit a request.',
'how-do-i-export-my-data',
ARRAY['export data', 'download data', 'data export', 'CSV', 'backup'], false, 3),

('a0000007-0000-0000-0000-000000000007',
'How do I reset my data and start fresh?',
'To reset your tracking data and start fresh:

1. Go to Account Settings.
2. Scroll to the Data Management section.
3. Tap Reset Data.
4. Select which data to reset (nutrition logs, workout history, measurements, or all).
5. Confirm the reset.

This permanently deletes the selected data. Your account, goals, and settings are not affected.',
'how-do-i-reset-my-data-and-start-fresh',
ARRAY['reset data', 'start fresh', 'clear data', 'delete logs', 'wipe data'], false, 4),

('a0000007-0000-0000-0000-000000000007',
'Can I connect YFIT to other health apps?',
'Integration with other health platforms (Apple Health, Google Fit, Fitbit, Garmin, etc.) is on the roadmap for a future update.

Currently, step counts can be entered manually in the Daily Tracker. Use the feedback button to vote for specific integrations — your requests help prioritise our development roadmap.',
'can-i-connect-yfit-to-other-health-apps',
ARRAY['integrations', 'Apple Health', 'Google Fit', 'Fitbit', 'connect apps', 'sync'], false, 5),

('a0000007-0000-0000-0000-000000000007',
'What happens to my data if I uninstall the app?',
'Your data is stored in the cloud (not on your device), so uninstalling the app does not delete your data. When you reinstall and log back in, all your logs, measurements, and history will be exactly as you left them.

To permanently delete your data, you must delete your account from Account Settings before uninstalling.',
'what-happens-to-my-data-if-i-uninstall-the-app',
ARRAY['uninstall', 'reinstall', 'data loss', 'cloud storage', 'delete app'], false, 6),

('a0000007-0000-0000-0000-000000000007',
'How do I contact support?',
'To get support:

1. Use the feedback button (blue/green circle, bottom-right of any page) to submit a bug report or question.
2. For urgent issues, email support directly at support@yfitai.com.

The feedback button is the fastest way to reach us — reports are reviewed daily. Include as much detail as possible about the issue.',
'how-do-i-contact-support',
ARRAY['contact support', 'help', 'support', 'bug report', 'customer service', 'email support'], false, 7),

('a0000007-0000-0000-0000-000000000007',
'How do I update my display name?',
'To change your display name:

1. Go to Account Settings.
2. Tap Edit Profile.
3. Update the Name field.
4. Tap Save.

Your display name appears in the app header and in your profile.',
'how-do-i-update-my-display-name',
ARRAY['display name', 'username', 'name', 'change name'], false, 8),

('a0000007-0000-0000-0000-000000000007',
'How do I manage my privacy settings?',
'YFIT does not share your personal data with third parties. Your privacy settings include:

- Data retention: choose how long to keep historical logs
- Account visibility: your account is private by default
- Data deletion: delete your account and all data at any time

For full details, review the YFIT Privacy Policy in Account Settings > Privacy Policy.',
'how-do-i-manage-my-privacy-settings',
ARRAY['privacy settings', 'data privacy', 'account privacy', 'privacy policy'], false, 9),

('a0000007-0000-0000-0000-000000000007',
'How do I update my profile photo?',
'To update your profile photo:

1. Go to Account Settings.
2. Tap on your current profile photo or the placeholder avatar.
3. Select a photo from your device gallery, or take a new photo.
4. Crop and confirm.

Your profile photo appears in the Account Settings page and in the app header.',
'how-do-i-update-my-profile-photo',
ARRAY['profile photo', 'avatar', 'profile picture', 'change photo'], false, 10);

-- ---- SUBSCRIPTION & BILLING ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000008-0000-0000-0000-000000000008',
'What subscription plans does YFIT offer?',
'YFIT offers the following plans:

- Starter (Free): basic workout tracking, manual meal logging, 3 saved routines
- Pro Monthly ($12.99/month): full AI features, barcode scanner, unlimited AI coaching, advanced analytics, priority support
- Pro Yearly ($99.99/year): all Pro features, save 35% vs monthly, exclusive workshops, early access to new features
- Lifetime ($249.99 one-time): permanent Pro access, Founder''s Badge, direct developer access

During the beta period, all features are available to beta testers at no charge.',
'what-subscription-plans-does-yfit-offer',
ARRAY['subscription', 'pricing', 'plans', 'cost', 'price', 'pro', 'free'], false, 1),

('a0000008-0000-0000-0000-000000000008',
'How do I upgrade to Pro?',
'To upgrade to a Pro plan:

1. Go to Account Settings.
2. Tap Subscription.
3. Select your preferred plan (Monthly, Yearly, or Lifetime).
4. Complete payment through the secure checkout.

Your Pro features will be activated immediately after payment.',
'how-do-i-upgrade-to-pro',
ARRAY['upgrade', 'pro plan', 'subscribe', 'payment', 'upgrade to pro'], false, 2),

('a0000008-0000-0000-0000-000000000008',
'How do I cancel my subscription?',
'To cancel your subscription:

1. Go to Account Settings.
2. Tap Subscription.
3. Tap Cancel Subscription.
4. Confirm the cancellation.

Your Pro features will remain active until the end of your current billing period. After that, your account will revert to the free Starter plan.',
'how-do-i-cancel-my-subscription',
ARRAY['cancel subscription', 'cancel', 'unsubscribe', 'stop payment', 'end subscription'], false, 3),

('a0000008-0000-0000-0000-000000000008',
'Can I get a refund?',
'Refund requests are handled on a case-by-case basis. If you are unsatisfied with YFIT Pro, contact support within 7 days of your purchase using the feedback button and we will review your request.

Lifetime purchases are non-refundable after 30 days. Monthly and yearly subscriptions cancelled within 7 days of the initial purchase may be eligible for a full refund.',
'can-i-get-a-refund',
ARRAY['refund', 'money back', 'refund policy', 'cancel and refund'], false, 4),

('a0000008-0000-0000-0000-000000000008',
'Is there a free trial?',
'Yes! New users get a free trial of Pro features. During the beta period, all features are available to all beta testers at no charge.

When YFIT launches publicly, new users will receive a 14-day free trial of Pro before being asked to subscribe.',
'is-there-a-free-trial',
ARRAY['free trial', 'trial', 'try pro', 'test pro'], false, 5),

('a0000008-0000-0000-0000-000000000008',
'What happens to my data if I downgrade to free?',
'If you downgrade from Pro to the free Starter plan:

- All your historical data (logs, measurements, workout history) is retained
- You lose access to Pro features (AI coaching, barcode scanner, advanced analytics)
- Your data remains in your account and will be accessible again if you re-upgrade

Nothing is deleted when you downgrade.',
'what-happens-to-my-data-if-i-downgrade-to-free',
ARRAY['downgrade', 'free plan', 'data after downgrade', 'lose access'], false, 6),

('a0000008-0000-0000-0000-000000000008',
'How do I update my payment method?',
'To update your payment method:

1. Go to Account Settings.
2. Tap Subscription.
3. Tap Update Payment Method.
4. Enter your new card details.

Your payment method is stored securely and is never visible to YFIT staff.',
'how-do-i-update-my-payment-method',
ARRAY['payment method', 'credit card', 'update card', 'billing details'], false, 7),

('a0000008-0000-0000-0000-000000000008',
'What is the Lifetime plan?',
'The Lifetime plan is a one-time payment of $249.99 that gives you permanent access to all Pro features — forever, with no monthly or annual fees.

Lifetime members also receive:
- Founder''s Badge on their profile
- Direct access to the development team for feedback
- Early access to all new features before general release

The Lifetime plan is ideal if you plan to use YFIT long-term.',
'what-is-the-lifetime-plan',
ARRAY['lifetime', 'one time payment', 'lifetime access', 'founders', 'permanent'], false, 8),

('a0000008-0000-0000-0000-000000000008',
'Is my payment information secure?',
'Yes. YFIT uses industry-standard payment processing. Your card details are:

- Never stored on YFIT servers
- Processed by a PCI-DSS compliant payment provider
- Encrypted end-to-end during transmission

YFIT staff cannot see your full card number.',
'is-my-payment-information-secure',
ARRAY['payment security', 'card security', 'PCI', 'secure payment', 'safe payment'], false, 9),

('a0000008-0000-0000-0000-000000000008',
'Do you offer student or family discounts?',
'Student and family plan discounts are planned for a future update. Use the feedback button to register your interest — demand from users helps prioritise these features.',
'do-you-offer-student-or-family-discounts',
ARRAY['discount', 'student discount', 'family plan', 'group plan', 'cheaper'], false, 10);

-- ---- TROUBLESHOOTING ----
INSERT INTO faq_articles (category_id, question, answer, slug, keywords, is_featured, display_order) VALUES

('a0000009-0000-0000-0000-000000000009',
'The app shows a spinning loading screen and will not open. What do I do?',
'A persistent spinning screen is usually caused by a stale cached version of the app. Here is how to fix it:

On Android:
1. Go to Settings > Apps > YFIT.
2. Tap Storage > Clear Cache AND Clear Data.
3. Reopen the app and sign in again.

On web browser:
1. Open the site in an Incognito/Private window — if it loads, the issue is your browser cache.
2. To fix your regular browser: click the padlock icon in the address bar > Site Settings > Clear Data.
3. Alternatively: Chrome Settings > Privacy > Clear browsing data > Cached images and files.

Your data is stored in the cloud and will not be lost by clearing the app cache.',
'the-app-shows-a-spinning-loading-screen-and-will-not-open-wh',
ARRAY['spinning', 'loading', 'stuck', 'wont open', 'spinning disk', 'loading screen', 'cache'], false, 1),

('a0000009-0000-0000-0000-000000000009',
'The barcode scanner is not working. How do I fix it?',
'If the barcode scanner is not working:

On Android:
1. Check camera permissions: Settings > Apps > YFIT > Permissions > Camera > Allow.
2. Make sure you have good lighting — barcodes need clear contrast to scan.
3. Hold the camera steady and ensure the entire barcode is within the scan frame.

On web browser:
1. When the scanner opens, your browser will ask for camera permission — tap Allow.
2. If you accidentally denied permission: click the padlock icon in the address bar > Camera > Allow.
3. Refresh the page after changing permissions.

If a product scans but shows "not found", the product may not be in the database. Use Create Custom Food to add it manually.',
'the-barcode-scanner-is-not-working-how-do-i-fix-it',
ARRAY['barcode scanner', 'scanner not working', 'camera permission', 'scan error', 'barcode error'], false, 2),

('a0000009-0000-0000-0000-000000000009',
'My nutrition data is not saving. What should I check?',
'If food logs are not saving:

1. Check your internet connection — YFIT requires an active connection to save data.
2. Try logging the food again — if the save button spins for more than 10 seconds, there may be a temporary server issue.
3. Refresh the page and check if the food was actually saved (it may have saved despite the error).
4. If the problem persists, log out and back in, then try again.

If you continue to have saving issues, use the feedback button to report the problem.',
'my-nutrition-data-is-not-saving-what-should-i-check',
ARRAY['not saving', 'data not saving', 'food not logging', 'save error', 'sync error'], false, 3),

('a0000009-0000-0000-0000-000000000009',
'The app is very slow. How can I speed it up?',
'If YFIT feels slow:

On Android:
- Close other apps running in the background.
- Clear the app cache (Settings > Apps > YFIT > Storage > Clear Cache).
- Check your internet connection speed.
- Restart your phone.

On web browser:
- Clear your browser cache.
- Close other browser tabs.
- Try a different browser (Chrome is recommended).
- Check your internet connection.',
'the-app-is-very-slow-how-can-i-speed-it-up',
ARRAY['slow', 'slow app', 'performance', 'lag', 'speed up'], false, 4),

('a0000009-0000-0000-0000-000000000009',
'I cannot log in to my account. What should I do?',
'If you cannot log in:

1. Check your email and password are correct — passwords are case-sensitive.
2. Tap Forgot Password on the login screen to reset your password via email.
3. Check your spam folder for the password reset email.
4. Make sure you are using the same email address you registered with.
5. Check your internet connection.

If you still cannot log in after resetting your password, use the feedback button or email support@yfitai.com.',
'i-cannot-log-in-to-my-account-what-should-i-do',
ARRAY['cant login', 'login error', 'forgot password', 'password reset', 'sign in error'], false, 5),

('a0000009-0000-0000-0000-000000000009',
'My workout history has disappeared. What happened?',
'Workout history should never disappear. If you cannot see your workouts:

1. Check you are logged in to the correct account (the right email address).
2. Go to Fitness > History tab — workouts are listed here in reverse date order.
3. Check the date filter — make sure it is not set to a narrow date range that excludes your sessions.
4. Pull down to refresh the list.

If workouts are genuinely missing, use the feedback button to report the issue with the dates of the missing sessions.',
'my-workout-history-has-disappeared-what-happened',
ARRAY['workout missing', 'history gone', 'data missing', 'lost workouts', 'disappeared'], false, 6),

('a0000009-0000-0000-0000-000000000009',
'The AI Coach is not responding. What should I do?',
'If the AI Coach is not responding:

1. Check your internet connection.
2. Wait 30 seconds and try sending your message again.
3. Try starting a New Conversation.
4. Refresh the page or restart the app.

If the problem persists for more than an hour, use the feedback button to report it.',
'the-ai-coach-is-not-responding-what-should-i-do',
ARRAY['AI not working', 'AI not responding', 'coach error', 'AI down', 'chat not working'], false, 7),

('a0000009-0000-0000-0000-000000000009',
'My step count is not updating. How do I fix it?',
'Step count in YFIT is entered manually in the Daily Tracker — it does not automatically sync from your phone''s step counter (automatic sync is planned for a future update).

To log your steps:
1. Go to Daily Tracker.
2. Find the Steps section.
3. Enter your step count for today.
4. Tap Save.',
'my-step-count-is-not-updating-how-do-i-fix-it',
ARRAY['steps not updating', 'step count wrong', 'steps not syncing', 'pedometer'], false, 8),

('a0000009-0000-0000-0000-000000000009',
'How do I report a bug?',
'To report a bug:

1. Tap the feedback button — the blue/green circle in the bottom-right corner of any page.
2. Select Bug Report.
3. Choose the relevant category (e.g. Nutrition, Fitness, AI Coach).
4. Enter a title describing the bug (e.g. "Barcode scanner freezes on Android").
5. Describe what happened, what you expected to happen, and the steps to reproduce it.
6. Tap Submit.

Bug reports are reviewed daily. The more detail you provide, the faster we can fix the issue.',
'how-do-i-report-a-bug',
ARRAY['report bug', 'bug report', 'feedback', 'report issue', 'error report'], false, 9),

('a0000009-0000-0000-0000-000000000009',
'The app updated and now something is broken. What should I do?',
'After an app update, a cached file can sometimes conflict with the new version.

Fix steps:
1. Android: Settings > Apps > YFIT > Storage > Clear Cache (not Clear Data — this keeps your login).
2. Web: Open in Incognito first to confirm it works, then clear site data for your regular browser.
3. Restart the app.

If the problem persists after clearing cache, use the feedback button to report exactly what is broken.',
'the-app-updated-and-now-something-is-broken-what-should-i-do',
ARRAY['after update', 'update broke', 'new version broken', 'update issue', 'post update'], false, 10);

-- Done!
SELECT 'FAQ seed complete: ' || COUNT(*) || ' articles inserted' AS result FROM faq_articles;
