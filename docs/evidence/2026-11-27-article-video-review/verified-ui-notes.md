# Verified actual UI — article-led review assets

The three PNGs are real authenticated-route components rendered headlessly from the existing static compile of revision `20cae3de9b8d9160618299a1f81fa2b79021258a`, with synthetic offline authentication and fictional GET fixture rows. They are not guest screens, mockups, redesigns or a live account. All 203 archived `src` modules match that commit byte-for-byte. The canonical checkout is a different documentation branch HEAD and was not modified. Original app CSS and colors are retained, with only ordinary page scrolling used for framing.

## Recommended assets

- `png/01-nutrition-overview.png`: 1080×1920, original 540×960 CSS viewport at device scale 2. Shows Nutrition, Friday Nov 27 2026, daily calorie progress 1450/2200 kcal, 1450 consumed, 750 remaining; protein 90/150 g (60%), carbs 160/265 g (60%), fat 50/60 g (83%).
- `png/02-nutrition-logged-meals.png`: 1080×1920. Actual expanded Breakfast and Lunch sections, including Greek yogurt, oats & berries (450 kcal; P25/C55/F14) and Chicken, quinoa & vegetables (600 kcal; P40/C65/F20). A fictional Dinner row (Salmon, rice & broccoli; 400 kcal; P25/C40/F16) exists below and contributes to the exact overview totals. Meal rows use `food_name`, not `meal_name`.
- `png/03-daily-tracker-overview.png`: 1080×1920. Actual Daily Tracker/Daily Summary with Sleep, Water 1800 ml (1.8 L), daily goal 2000 ml, Steps 6400, daily goal 10000. Further actual clinical tracking cards are visible lower in the unchanged source UI; do not characterize fictional numbers as medical guidance. The sleep goal is labeled “Streak” by existing app translation; avoid narrating that typo.

## Exact genuine controls verified in source

`App.jsx` maps authenticated `/nutrition` to `NutritionUnified` → `NutritionEnhanced`, and authenticated `/daily-tracker` to `DailyTracker`. Guest routes are separate and were not used.

Nutrition outer tabs: **Daily Tracker**, **Weekly Planner**, **Templates**. There is **no separate Meals tab**. Logged meals are already-expanded **Breakfast**, **Lunch**, **Dinner**, **Snacks** sections; their header click toggles expansion using local React state only. Each row displays calories and P/C/F values. Actual meal controls include food search, **Scan Barcode**, **Saved Meals**, **Plate Scan**, **Save as Template**, edit-serving and delete. None of those action controls was clicked in the captures. Date arrows and native date picker are real controls; capture day was unchanged. Macro-setting sliders/toggles were not clicked because they can write preferences.

Daily Tracker actual Water unit selector: **ml**, **oz**, **cups**. No liters option: narrate “1.8 liters” if desired but keep the honest UI label **1800 ml**. Water/steps progress cards show daily goals. Daily entry form reads `sleep_hours`, `sleep_quality`, `water_ml`, `steps`, `bp_systolic`, `bp_diastolic`, `glucose_mg_dl`, `weight_kg`, `body_fat_percent`, `notes`. Water-add and step-add controls update local state, but final save/update actions write; no entry, add, save, finish-day or delete action was triggered.

## Narration support and limits

Supported: “Track calories and macros in Nutrition”; “see logged meals”; “keep daily entries such as steps and water in Daily Tracker.” This is demonstrated UI, not proof of health outcomes or automatic synchronization. Do not imply the article endorses YFIT, or that the app guarantees body recomposition, weight loss or any medical result.

## Safety and reproduction

`capture_actual_ui.py` adapts the existing actual-component harness. Browser is fresh isolated local headless Chromium, not cloud browser or My Browser. Exact loopback static GETs only are allowed; Supabase GET requests are fulfilled in-memory with fictional JSON; every non-GET is aborted; all other external GETs are blocked; WebSockets are closed; service workers are blocked; external DNS is disabled. Expected source-internal `feature_analytics` POST attempts are aborted, never sent. No real sign-in, signup, auth refresh, API write, analytics record, upload, production action, model, media generation or publish occurred. Server shuts down in `finally`.

`safe-audit-provenance.json` includes SHA256 hashes, verified source modules, build hashes, fixture fields, request policy/results and server cleanup. `evidence/fictional-fixtures.json` records all displayed fictional rows. No recording was created; clean stills were prioritized. Re-run with `python3 /home/ubuntu/yfit-article-demo-2026-11-27/capture_actual_ui.py`.
