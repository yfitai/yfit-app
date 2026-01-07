# 📱 Android Build Update Guide

## Overview
This guide will help you update your Android app with all the latest bug fixes from GitHub.

---

## ✅ All Fixes Included in This Update

### 1. **Nutrition Display Fixes**
- Fixed protein/carbs/fat showing 0g in meal cards
- Fixed template save dialog showing 0g for macros
- Updated field names from `protein` to `protein_g`, `carbs` to `carbs_g`, `fat` to `fat_g`

### 2. **Sugar Extraction Fix**
- Fixed sugar showing 0g for all foods
- Now correctly extracts "Total Sugars" from USDA API

### 3. **Meal Type Fix**
- Fixed database constraint error when adding foods to "Snacks"
- Changed from "snacks" (plural) to "snack" (singular) to match database

### 4. **Workout Deletion Fix**
- Fixed "Error deleting workout" caused by foreign key constraints
- Added cascading delete: workout_sessions → workout_exercises → workouts

### 5. **Start Fresh Journey Fix** (NEW!)
- Fixed "Error resetting data" on Android
- Added cascading deletes for proper data cleanup
- Now safely deletes all user data while preserving custom foods and templates

---

## 🔄 Update Process

### **Option 1: Pull Latest Code from GitHub (Recommended)**

Since you have your phone connected in debug mode with file transfer enabled:

#### **Step 1: Pull Latest Code**
```bash
cd /path/to/your/yfit-app
git pull origin main
```

#### **Step 2: Verify Changes**
Check that you have the latest commit:
```bash
git log -1
```
You should see: `commit 0e13d53` - "Update from Manus: 2026-01-07 12:09"

#### **Step 3: Rebuild Android App**
```bash
# Install dependencies (if needed)
npm install

# Build Android app
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

#### **Step 4: Build APK in Android Studio**
1. In Android Studio, click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. Click **locate** to find the APK file
4. Transfer APK to your phone and install

---

### **Option 2: Manual File Transfer (If Git Pull Doesn't Work)**

If you can't use git pull, you can manually transfer the updated files:

#### **Files That Changed Today:**

1. **src/lib/foodDatabase.js**
   - Sugar extraction fix
   
2. **src/components/NutritionEnhanced.jsx**
   - Meal type fix (snacks → snack)
   
3. **src/components/Nutrition/SaveNutritionTemplateModal.jsx**
   - Template dialog display fix
   
4. **src/components/WorkoutLogger.jsx**
   - Workout deletion cascading delete fix
   
5. **src/components/Goals.jsx**
   - Start Fresh cascading delete fix

#### **Transfer Process:**
1. Download these 5 files from GitHub: https://github.com/yfitai/yfit-app
2. Connect your phone via USB with file transfer enabled
3. Copy the files to your local project folder
4. Rebuild the Android app (see Step 3 above)

---

## 🧪 Testing After Update

Once you've installed the updated APK on your phone, test these features:

### ✅ **Test 1: Nutrition Display**
1. Go to Nutrition page
2. Add a food to any meal
3. **Verify:** Protein, Carbs, and Fat show correct values (not 0g)

### ✅ **Test 2: Sugar Extraction**
1. Search for "sugar cookie" or "candy"
2. Add to a meal
3. **Verify:** Sugar value shows correct amount (not 0g)

### ✅ **Test 3: Snack Meal Type**
1. Add a food to "Snacks" meal
2. **Verify:** Saves without error (no constraint violation)

### ✅ **Test 4: Template Save Dialog**
1. Add foods to a meal
2. Click "Save as Template"
3. **Verify:** Dialog shows correct P/C/F values (not 0g)

### ✅ **Test 5: Workout Deletion**
1. Go to Fitness Tracking
2. Click trash icon on a workout
3. **Verify:** Workout deletes successfully (no error)

### ✅ **Test 6: Start Fresh Journey**
1. Go to Goals page
2. Click "🔄 Start Fresh Journey"
3. Confirm the action
4. **Verify:** Data resets successfully (no error)

---

## 📊 Summary

**Total Commits Today:** 5 commits  
**Total Files Modified:** 8 files  
**Bugs Fixed:** 7 major bugs  
**Latest Commit:** `0e13d53` - "Update from Manus: 2026-01-07 12:09"

---

## 🆘 Troubleshooting

### **Issue: Git pull fails**
**Solution:** Use Option 2 (Manual File Transfer)

### **Issue: Build fails in Android Studio**
**Solution:** 
1. Clean project: **Build** → **Clean Project**
2. Rebuild: **Build** → **Rebuild Project**
3. Sync Gradle: Click "Sync Now" if prompted

### **Issue: APK won't install on phone**
**Solution:**
1. Uninstall old version first
2. Enable "Install from Unknown Sources" in phone settings
3. Try installing again

### **Issue: App crashes after update**
**Solution:**
1. Clear app data: Settings → Apps → YFIT → Storage → Clear Data
2. Reinstall the app
3. Log in again

---

## 📞 Need Help?

If you encounter any issues during the update process, let me know and I'll help troubleshoot!
