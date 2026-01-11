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
