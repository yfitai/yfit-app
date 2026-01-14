# YFIT Bug Fixes - January 5, 2026

## 🐛 Bugs to Fix

### Tracker Page Issues
- [x] Fix avg water display: showing ml instead of oz when in imperial toggle
- [x] Fix avg glucose display: showing mg/dl instead of mmol/l

### Nutrition Page Issues
- [x] Previous fixes seem to have reverted - need to re-apply (fixed field name inconsistency protein_g/carbs_g/fat_g)
- [x] Today's summary sugar card does not update (verified calculation logic is correct)
- [x] Templates say they save but don't persist (fixed field mapping to use protein_g/carbs_g/fat_g)
- [x] Branded foods show no cal, pro, carbs, or fat in search results (verified API extraction working)
- [x] USDA foods show nutrition in search but only cal saves when added (verified all fields being saved)

### Fitness Tracker Issues
- [x] Add ability to delete workout once created (added delete button with confirmation dialog)

## 🔄 Remaining Issues After Testing

### Workout Deletion
- [x] Delete button shows error: "Error deleting workout. Please try again."
- [x] Error: Foreign key constraint violation - workout_sessions table references workouts
- [x] Error code 23503: "Key is still referenced from table 'workout_sessions'"
- [x] **FIXED:** Added cascading delete - deletes workout_sessions first, then workout_exercises, then workout

### Template Saving
- [x] Added extensive debug logging to template save/load
- [ ] Need user to test and check browser console for logs
- [ ] Logs will show if template is being saved and loaded correctly

### Nutrition Data Saving
- [x] Added debug logging to meal saving
- [x] User tested - console shows data IS being saved correctly
- [x] **BUG FOUND:** Meal display was using `meal.protein` instead of `meal.protein_g`
- [x] **FIXED:** Updated meal card display to use protein_g/carbs_g/fat_g fields
- [x] Sugar showing 0 is correct for many foods (eggs, ham, etc. have no sugar)

## 🆕 New Bugs Found During Testing

### Meal Type Constraint Error
- [x] Database error when saving to "snacks" meal type
- [x] Error: "meals_meal_type_check" constraint violated
- [x] App uses "snacks" but database expects "snack" (singular)
- [x] **FIXED:** Changed all "snacks" to "snack" throughout the app

### Sugar Extraction from USDA
- [x] Sugar showing 0g even for sugar cookies and sugar cane beverage
- [x] Added more sugar field name variations: 'sugars, added', 'sugar, total', 'total sugars'
- [x] Added debug logging to show all nutrient names for foods with 'sugar' or 'cookie' in name
- [x] User provided console logs - USDA uses 'Total Sugars' (capital T and S)
- [x] **FIXED:** Added exact match for 'Total Sugars' before lowercase checks

## 📝 Notes
- All fixes need to be tested before saving
- Make sure changes persist after save


### Template Save Dialog Display Bug
- [x] Save template dialog shows 0g for protein, carbs, and fat
- [x] Template actually saves correctly with right values
- [x] Template list displays correct totals
- [x] **FIXED:** Updated SaveNutritionTemplateModal.jsx to use protein_g/carbs_g/fat_g fields


## 📱 Android App Issues

### Start Fresh Journey Button
- [x] Error on Android: "Error resetting data. Please try again"
- [x] Works correctly on desktop/web version
- [x] Root cause: Foreign key constraint violations (same as workout deletion)
- [x] **FIXED:** Added cascading deletes - workout_sessions → workout_exercises → workouts
- [x] Added detailed error logging to console

### Code Sync to Android
- [ ] Need to sync all today's bug fixes to Android build:
  - [ ] Nutrition display fixes (protein_g/carbs_g/fat_g)
  - [ ] Sugar extraction fix (Total Sugars)
  - [ ] Meal type fix (snack vs snacks)
  - [ ] Template dialog fix
  - [ ] Workout deletion fix (cascading delete)


## 🔧 Template System Issues (Daily Tracker)

### Demo Mode Detection Bug
- [x] demoMode flag stuck on 'true' even when using real Supabase
- [x] User manually set to 'false' via console
- [ ] Need to fix auto-detection of demo vs real mode on login

### Template Save/Load Issues
- [x] Templates were saving to `yfit_demo_meal_templates` (demo key)
- [x] App was looking in `yfit_nutrition_templates` (real key)
- [x] After fixing demoMode flag, app now detects Supabase mode correctly
- [x] **FIXED:** Implemented Supabase template save to `meal_templates` table
- [x] **FIXED:** Implemented Supabase template load from `meal_templates` table
- [x] NutritionEnhanced.jsx - handleSaveTemplate now saves to Supabase
- [x] NutritionTemplateModal.jsx - loadTemplates now loads from Supabase

### Weekly Planner Template Issues
- [ ] Apply template fails with "Failed to add meal"
- [ ] Need console logs to debug

### Supabase 406 Errors
- [x] User profile missing (user deleted goals during Start Fresh test)
- [ ] User needs to re-enter goals to create profile
- [ ] Consider using `.maybeSingle()` instead of `.single()` to handle missing profiles gracefully


### Supabase API Key Error
- [x] Template save failing with "No API key found in request"
- [x] Root cause: NutritionTemplateModal was creating new Supabase client with undefined env vars
- [x] **FIXED:** Changed to import existing supabase client from lib/supabase.js
- [x] Both save and load now use the same properly configured client


### meal_templates Table Schema Mismatch
- [x] Table uses `template_name` not `name`
- [x] Table stores macros as strings (text) not numbers
- [x] Table has `description`, `is_favorite`, `updated_at` fields
- [x] Missing `meals` column - added via SQL: `ALTER TABLE meal_templates ADD COLUMN meals jsonb`
- [x] **FIXED:** Updated save to use `template_name` and convert macros to strings
- [x] **FIXED:** Updated load to convert `template_name` to `name` and strings to numbers


### Template Apply Field Name Mismatch
- [x] Template apply failing - meals table uses protein_g/carbs_g/fat_g
- [x] Template stores meals with protein/carbs/fat (no suffix)
- [x] Missing brand column - added via SQL
- [x] Missing meal_date field in insert
- [x] **FIXED:** Updated addMealFromTemplate to map field names correctly
- [x] protein → protein_g, carbs → carbs_g, fat → fat_g


### logged_at vs created_at
- [x] Code was using `logged_at` but table has `created_at`
- [x] **FIXED:** Removed logged_at from insert - created_at auto-set by database


### Template Apply id Field Error
- [x] Error: "null value in column 'id' violates not-null constraint"
- [x] Code was sending `id: undefined` to Supabase
- [x] **FIXED:** Split demo/real mode logic - omit id for Supabase (auto-generated)
- [x] Demo mode uses protein/carbs/fat, real mode uses protein_g/carbs_g/fat_g


## 📧 Email Automation

### Welcome Email on Signup
- [x] Create Supabase Edge Function: send-welcome-email
- [x] Update signup code to call welcome email function
- [x] Test welcome email delivery via Resend
- [x] Fix email HTML template JSON parsing error
- [x] Email delivery working and tested
- [x] Improve email styling (solid colors for better email client compatibility)
- [x] Review email notes for better template design
- [x] Update verification email template with YFIT branding
- [x] Upload YFIT logo for email templates
- [x] Fix queue-email to use user_profiles table for firstName
- [x] Update welcome_email template with logo, colors, and checkboxes
- [x] Update all 5 other email templates with consistent branding
- [x] Fix process-email-queue to use user_profiles for firstName (with auth fallback)
- [x] Fix email from/reply-to addresses (support@yfitai.com)
- [x] Add actual checkmark emojis to welcome template
- [x] Reduce header size in email templates

### Before Stripe Integration & Testing with Real Users
- [ ] Recreate all RLS policies (as per original plan)
- [ ] Fix user_profiles INSERT policy to allow signup profile creation
- [ ] Remove auth metadata fallback workaround from process-email-queue once profiles work


## Google Play Store - Android App
- [ ] Check Google Play Console for review status
- [ ] Verify yfit email is receiving Google Play notifications
- [ ] Respond to any pending review requests
- [ ] Set up closed beta testing track
- [ ] Configure beta tester list (ready for marketing website signups)
- [ ] Verify app submission is complete and approved
- [ ] Test beta distribution flow


## Duration-Based Exercise Tracking (Before Google Play)
- [ ] Review walking implementation
- [ ] Add duration-only exercise type (planks, ab roller, wall sits, etc.)
- [ ] Update workout logging UI for duration exercises
- [ ] Create progress card for duration exercise PRs
- [ ] Test duration tracking and progress display


## 🚨 Critical Data Storage Issues (January 11, 2026)

### Demo Mode Causing Data Loss
- [x] Remove demo mode check from getCurrentUser() in lib/supabase.js
- [x] Remove handleDemoMode function from App.jsx
- [x] Remove demo mode indicator UI from App.jsx
- [x] Remove onDemoMode prop from Auth component
- [x] Test that all data now saves to Supabase correctly with real user IDs - CONFIRMED WORKING!
- [x] Verified new workouts save with real user_id (25407413-11a0-4ea6-8d10-d0f6b7c42b6e)
- [x] Verified data appears in Fitness Progress and Workout Logger
- [ ] **NEXT SESSION:** Clean up all remaining demo mode code from meal planner components (MealPlanner.jsx, NutritionUnified.jsx, AddMealModal.jsx, MealTemplates.jsx, NutritionTemplateModal.jsx, FormAnalysisHistory.jsx) - currently unreachable but should be removed for code cleanliness

### Nutrition Logs Not Saving to Database
- [ ] **NEXT SESSION:** Investigate why nutrition_logs table is empty
- [ ] Verify nutrition logging saves to Supabase (not localStorage)
- [ ] Check if nutrition code has demo mode localStorage fallback that needs fixing
- [ ] Test nutrition logging after demo mode removal

### Android Auto-Update Not Working
- [x] Updated capacitor.config.json to use yfit-deploy.vercel.app (was yfit-app.vercel.app)
- [x] Built new APK with corrected Vercel URL
- [x] User installed APK but auto-update still not working
- [ ] **NEXT SESSION - PRIORITY:** Rebuild Android APK with demo mode fix included
- [ ] User needs to uninstall old APK and install new one (to clear localStorage)
- [ ] Test if new APK loads from Vercel correctly
- [ ] If still not working, investigate Capacitor server.url configuration
- [ ] Consider if cleartext:true is causing issues
- [ ] May need to test with actual device debugging to see network requests


## 🧹 Code Cleanup for Public Launch - IN PROGRESS

### Demo Mode Code Removal (24 files affected)
- [ ] **IN PROGRESS:** Complete removal of all demo mode code from entire app
- [ ] NutritionEnhanced.jsx - Remove demo mode from loadData (lines 81-147)
- [ ] NutritionEnhanced.jsx - Remove demo mode from line 213
- [ ] NutritionEnhanced.jsx - Remove demo mode from handleSaveTemplate (lines 414-432)
- [ ] FoodSearch.jsx
- [ ] FormAnalysisHistory.jsx
- [ ] Goals.jsx
- [ ] GoalsResults.jsx
- [ ] MacroSettings.jsx
- [ ] MealPlanner.jsx
- [ ] AddMealModal.jsx
- [ ] MealTemplates.jsx
- [ ] Nutrition.jsx
- [ ] NutritionTemplateModal.jsx
- [ ] Other components with demo references
- [ ] Test app after cleanup
- [ ] Rebuild Android APK with clean codebase


## 📅 Nutrition Date Picker Feature

- [x] Add date picker UI to NutritionEnhanced component
- [x] Update loadTodaysMeals to use selected date
- [x] Update logFood to save with selected date
- [x] Update template meals to save with selected date
- [x] Add previous/next day navigation buttons
- [x] Add "Today" quick button
- [x] Prevent navigation to future dates
- [x] Update summary title based on selected date
- [ ] Test viewing meals from previous days
- [ ] Test logging meals for past dates


## 🐛 New Bug Fixes - January 14, 2026

### My Foods Favorites Not Saving
- [x] Fix My Foods tab not saving favorites from Search foods
- [x] Investigate if similar to medications fix (reference meds page implementation)
- [x] Added addCustomFood function to foodDatabase.js
- [x] Created CustomFoodModal component for creating custom foods
- [x] Added "Create Custom Food" button to FoodSearch
- [x] Custom foods now save to custom_foods table and appear in "My Foods" filter

### Medication Adherence Calculation Errors
- [x] Fix adherence showing 64% when should be different value
- [x] Fix dose count showing "9 of 14 doses" incorrectly
- [x] User has: 3 medications + 3 supplements, 2 taken twice daily, rest once = 8 total doses
- [x] Fix supplements showing "8/8 taken 100%" when second dose hasn't been taken
- [x] Changed calculation to only count days with active tracking (not full 30 days)
- [x] Now calculates expected doses based on days user actually logged, not calendar days since start

### Progress Charts Showing Cached Demo Data
- [ ] Fix progress page showing data from Oct 21 when user only has 1 day logged
- [ ] Verify demo mode cleanup removed all cached data
- [ ] Check if localStorage or other cache needs clearing
- [ ] Ensure charts only show current user's real logged data


### Favorites Feature Enhancement
- [x] Add star button to food search results to favorite individual foods
- [x] Update "My Foods" filter to show BOTH favorited foods AND custom foods
- [x] Add visual badges to distinguish favorited foods (🌟) from custom foods (✏️)
- [x] Implement add/remove favorite functionality
- [x] Show favorites in quick access section alongside recent foods
- [x] Star button shows ⭐ when favorited, ☆ when not favorited
- [x] Updated searchCustomFoods to include both custom and favorited foods


### Progress Charts Bug - UPDATED
- [x] User started fresh yesterday (new support@yfit account)
- [x] Progress page showing old test data from Oct 21
- [x] "Start Fresh" button may not have cleared all data tables
- [x] Need to verify Start Fresh functionality clears all progress data
- [x] Check which tables are being queried by Progress page
- [x] Ensure all user data is properly filtered by user_id
- [x] Added 5 missing tables to Start Fresh: weight_logs, body_composition_logs, body_measurements_logs, health_metrics_logs, meal_logs


### Start Fresh Enhancement
- [x] Modify Start Fresh to preserve workout templates
- [x] Delete workout_sessions but keep workouts and workout_exercises tables
- [x] Update modal text to clarify workout templates are saved
- [x] Removed deletion of workouts and workout_exercises from handleStartFresh
- [x] Updated confirmation modal to show workout templates will be preserved


### Start Fresh Error - URGENT
- [x] User getting "Error resetting data" when clicking Start Fresh
- [x] Check if table names are correct in handleStartFresh
- [x] Verify all tables exist in Supabase database
- [x] Check browser console for specific error messages
- [x] Fixed: Added error filtering to ignore PGRST116 (table not found) errors
- [x] Start Fresh now works even if some progress tables don't exist yet


### Start Fresh - Preserve Medications
- [x] Update Start Fresh to keep user_medications table
- [x] Delete medication_logs (adherence history) but keep medication list
- [x] Update modal text to clarify medications are preserved
- [x] Added medication_logs deletion to handleStartFresh
- [x] user_medications table already preserved (not deleted)
