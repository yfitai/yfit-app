# YFIT Deployment Changelog

All deployments are tracked here automatically.

## [1.0.3] - Build 4 - 2026-01-14 22:33

**Changes:**
- **Bug Fix:** My Foods - Added custom food creation + favorites system
  - New CustomFoodModal component for creating custom foods
  - Added star button (⭐/☆) to favorite any food from search results
  - "My Foods" filter now shows both custom foods (✏️) and favorites (🌟)
  - Quick access section displays your favorite foods
  
- **Bug Fix:** Medication Adherence - Fixed calculation accuracy
  - Now counts only active tracking days instead of assuming 30 days
  - Fixes incorrect adherence percentages for new users
  - More accurate dose counting based on actual logged days
  
- **Bug Fix:** Progress Charts - Fixed Start Fresh missing tables
  - Added 5 missing tables to Start Fresh: weight_logs, body_composition_logs, body_measurements_logs, health_metrics_logs, meal_logs
  - Progress page will now show clean data after using Start Fresh
  
- **Enhancement:** Start Fresh now preserves workout templates
  - Workout templates (exercises) are no longer deleted when starting fresh
  - Only completed workout sessions are deleted
  - Updated confirmation modal to clarify what gets saved vs deleted

---

## [1.0.2] - Build 3 - 2026-01-13 19:00

**Changes:**
- Removed test banner and added deployment documentation
- Auto-update system fully tested and working
- Desktop and Android both update automatically
- No manual cache clearing needed
- Ready for beta testing

---

## [1.0.1] - Build 2 - 2026-01-13 18:00

**Changes:**
- Added purple test banner to verify auto-update system
- Testing automatic version checking system
- Mobile app should detect new buildNumber and auto-reload within 30 seconds

---

## [1.0.0] - Build 1 - 2026-01-13 00:00

**Changes:**
- Initial version with automatic update system
- Implemented VersionChecker component
- Created version.json for tracking app versions
- Configured cache-busting for Android WebView

---
