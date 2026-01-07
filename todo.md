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
