# Prediction Page Fixes for Version 1.0.43

## Issues Found

### 1. Weight Loss Prediction
- **Issue**: Using `measurement_date` instead of `tracker_date`
- **Result**: NaN for weekly change, invalid goal date
- **Fix**: Change all `measurement_date` references to `tracker_date`

### 2. TDEE Calculation
- **Issue**: Same date field issue + using wrong formula for weight conversion
- **Result**: NaN for TDEE and all calorie targets
- **Fix**: Change date field + fix conversion formula (1 kg = 2.2 lbs, 1 lb = 3500 cal)

### 3. Body Recomposition Forecast
- **Issue**: Same date field issue + no unit conversion to lbs for display
- **Result**: Shows kg values, NaN for projections
- **Fix**: Change date field + add kg to lbs conversion for display

### 4. Nutrition Pattern Analysis
- **Issue**: Using `log_date` instead of `meal_date` for meals table
- **Result**: Invalid dates for highest/lowest consistency
- **Fix**: Change `log_date` to `meal_date`

### 5. Injury Risk Assessment
- **Issue**: Need 7 strength workouts but user only has 5
- **Result**: Shows "not enough data"
- **Fix**: Add 2 more test strength workouts to database

## Changes Required

### File: src/components/PredictionsUnified.jsx

**Lines to change:**
- Line 205, 209-212, 254, 257, 259: `measurement_date` → `tracker_date`
- Line 709, 712-716: `measurement_date` → `tracker_date`
- Line 229-230: Add kg to lbs conversion (multiply by 2.2)
- Line 263: Fix formula: `(weightChange * 2.2 * 3500) / days`
- Line 752-753, 756-757: Add kg to lbs conversion for display values

### Database: Add test workout data
- Add 2 strength workouts to reach minimum 7 required
