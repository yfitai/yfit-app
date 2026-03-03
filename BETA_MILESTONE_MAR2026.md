# YFIT Beta Testing Milestone — March 2026

## Status: ✅ App Complete for Beta Testing

This document marks the reference point at which all known bugs were resolved and the app was declared ready for beta tester onboarding.

---

## Fixes Completed in This Session

### Macro Sliders (Nutrition Page)
- **Protein anchor behavior:** Protein slider is fixed/constant; adjusting Carbs auto-adjusts Fat and vice versa to maintain calorie budget
- **1g precision:** Sliders now move in 1g increments instead of 3–5g jumps
- **Persistence on navigation:** Custom macro settings now save correctly and persist when navigating away and back (required SQL migration to add `use_custom_macros`, `protein_percent`, `carb_percent`, `fat_percent` columns to `user_preferences`)

### Dashboard (Home Page)
- **Steps goal:** Now reads correct user-set value (e.g. 2,000) instead of hardcoded 10,000 default
- **Calorie goal:** Now reads from `calculated_metrics` ordered by `calculated_at DESC` instead of non-existent `adjusted_calories` column on `user_goals`

### Progress Page
- **Slider bars start at 0%:** Fixed `loadGoals` and `calculatePredictions` functions that were accidentally defined outside the React component (closure bug — state setters were no-ops). Also fixed the progress formula to use journey-based calculation: 0% at start, 100% at goal
- **Root cause:** Code was editing `Progress/Progress.jsx` but app imports `Progress.jsx` — fixed in the correct file

### Goals Page — Daily Goals Section
- **Blood Pressure goal fields added:** Systolic (default 120 mmHg) and Diastolic (default 80 mmHg)
- **Fasting Glucose goal field added:** Default 100 mg/dL
- All three fields save to `user_goals` and are read by the Tracker page goal cards
- Required SQL migration: `ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS bp_systolic_goal INTEGER DEFAULT 120, ADD COLUMN IF NOT EXISTS bp_diastolic_goal INTEGER DEFAULT 80, ADD COLUMN IF NOT EXISTS glucose_goal INTEGER DEFAULT 100`

### Weight Loss Prediction (Analytics Page)
- Now reads actual `target_weight_kg` from `user_goals` instead of defaulting to 10% of starting weight
- Falls back to 10% default only if no target weight is saved
- Also fixed `fetchUserTDEE` to order by `calculated_at` (correct column name)

---

## SQL Migrations Applied (Supabase)

```sql
-- Session 1: Macro columns
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS use_custom_macros BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS protein_percent    NUMERIC(5,2) DEFAULT 30,
  ADD COLUMN IF NOT EXISTS carb_percent       NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS fat_percent        NUMERIC(5,2) DEFAULT 30;

-- Session 2: BP and glucose goal columns
ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS bp_systolic_goal  INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS bp_diastolic_goal INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS glucose_goal      INTEGER DEFAULT 100;
```

---

## Known Limitations at Beta Launch

- Weight Loss Prediction requires **at least 3 weight log entries** to generate a projection
- 7-Day Summary on Tracker page appears only after **at least 1 daily log entry** in the past 7 days
- Prediction confidence score increases with more data entries over time

---

## Next Steps (Post-Beta)
- Set up beta tester accounts and onboarding flow
- Collect feedback and triage bugs from beta testers
- Weight Loss Prediction: consider adding a "not enough data yet" message for users with fewer than 3 entries
