# Progress screenshot

**Final:** `/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_07_progress.png` — 1080 × 1920 PNG, captured directly from real Chromium at 540 × 960 CSS pixels and device scale 2. Visually inspected once with the image read tool; readable and free of guest/auth banners, NaN, visible errors, and invented AI results.

## Actual source and route

Declared PRODUCTION MAIN revision: `20cae3de9b8d9160618299a1f81fa2b79021258a`. Read archived source under `/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source`; helper reused the prior 203-module byte-identical source provenance audit. `src/App.jsx` imports `./components/Progress` at line 48 and maps authenticated `/progress` to `<Progress user={user} />` at line 379. The screenshot is `src/components/Progress.jsx`, including its actual `OverviewCard`, not `GuestProgressPage`, `AppTourMockups`, or the unused nested `Progress/Progress.jsx`.

## Fictional fixtures and claims

Progress `loadGoals` (lines 227–291) reads `user_goals.starting_weight_kg`, `weight_kg`, `height_cm`, `target_weight_kg`, `starting_body_fat_percentage`, and `target_body_fat_percentage`; latest measurements come from `daily_logs.weight_kg` and `body_fat_percent`. Fictional starting and current values are identical: 80 kg and 20% body fat, height 175 cm; fictional targets are 76 kg and 18%. There is no claimed historical improvement: all journey bars remain at zero. The real component calculates pounds and BMI from those raw values (kg × 2.20462 and kg / metres²) and rounds the display; no computed-result fixture was supplied. `calculated_metrics` is empty.

`weight_logs`, `body_composition_logs`, `body_measurements_logs`, `meal_logs`, `meals`, `workout_sessions`, `form_analysis_sessions`, and `progress_photos` are empty. Thus there are no fabricated trends, forecasts, workout achievements, model responses, form scores, photo results, taps or saves. Inherited single-day fictional daily-tracker health values are below the captured viewport; full body text records them. Inherited synthetic profile, preferences and subscription are only offline GET fixtures; no live account or credentials were used.

## Boundaries and audit

`capture_progress.py` imports the supplied helper via `sys.path`, starts its own Chromium process/context and ephemeral loopback server, and only navigates to `/progress`. No shared/MCP/cloud browser, build, npm/prebuild, source edit, DOM/CSS alteration, commit, push, upload, backend/model call or production write occurred. All external transmission, non-GET requests, WebSockets and service workers were blocked. The app attempted one automatic POST to `feature_analytics`, which the helper aborted; **external_sent = 0**, **non_get_sent = 0**, **page_errors = []**, **server_stopped = true**. This is a synthetic offline authenticated session, not a live sign-in.

Helper outputs: `safe-audit.json`, `fictional-fixtures.json`, `screen_07_progress-body.txt`; reproducible script: `capture_progress.py`. The work PNG is byte-identically copied to the final page path; no pre-existing shared asset was overwritten.

## Fidelity and limitations

No filters, compositing, phone frame, new labels, recoloring or cropping were applied. The actual app retains white mobile navigation, blue-to-green active Progress control, pale blue/green background, and original blue weight, green body-fat and purple BMI cards. The actual floating feedback button remains visible.

The viewport shows the navigation, Progress heading, default This Month selector, complete weight/body-fat cards and most of BMI. BMI's lower remaining-value row and all later charts/history/photo sections are below the viewport. This is an overview, not evidence of AI output, weight-loss results or medical recommendations. The source's existing time-selector translation defect renders the 90/365-day buttons as “3 days” and “1 days”; its “Daily goal” wording and directional icons were also retained unchanged rather than silently repaired. Progress displays pounds even with inherited metric preferences because this component hardcodes `lbs`.
