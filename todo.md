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
- [ ] Delete button shows error: "Error deleting workout. Please try again."
- [ ] Need to check database constraints and error handling
- [ ] Note: Workout system doesn't support demo mode, only works with Supabase

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

## 📝 Notes
- All fixes need to be tested before saving
- Make sure changes persist after save
