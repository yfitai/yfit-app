# Predictions screenshot

**Final asset:** `/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_08_predictions.png` — 1080 × 1920 PNG, actual browser viewport 540 × 960 at device scale factor 2. Exactly one page screenshot was captured.

## Source and route

Declared production MAIN: `20cae3de9b8d9160618299a1f81fa2b79021258a`. Inspected byte-identical archived source under `/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source`. `src/App.jsx` line 391 maps authenticated `/predictions` to `src/components/PredictionsUnified.jsx`. This is not `GuestPredictionsPage`, an app-tour mockup or a fabricated page. Existing 203-module provenance verification is reused through the required helper; the already-compiled `/home/ubuntu/yfit-article-demo-2026-11-27/offline-web` build is unchanged.

`PredictionsUnified` queries `daily_logs` (`weight_kg`, `logged_at`), `workout_sessions` (including joined workout name), `meals`, `medication_logs`, `calculated_metrics.tdee`, and `user_goals.target_weight_kg`. Its built-in empty-state cards are rendered when insufficient historical data is present. No forecast output was supplied.

## Fictional fixture choices

The required helper creates a synthetic authenticated user, English language and fictional profile/preferences plus `subscriptions` (`plan_type: pro_monthly`, `status: active`, `trial_end: null`). This lets the actual component display without a guest banner or free-tier blur. All `daily_logs`, `meals`, `workout_sessions`, `medication_logs`, `calculated_metrics`, and `progress_measurements` are explicitly empty for this capture. The helper's fictional goals row is retained, but it does not supply `target_weight_kg` and no historical weights exist, so no forecast can be computed. Profile/goals values are not shown in this viewport. The inherited calculated-metrics fixture is explicitly removed.

## Capture boundaries and audit

Saved script: `capture_predictions.py`. Imported `/home/ubuntu/yfit-screen-library-2026-11-27/work/offline_capture_base.py` via `sys.path`. Used a dedicated headless Chromium process/context and ephemeral loopback server. Only real navigation and scrolling were used; final scroll position is 0. No DOM/CSS/content edits, rebuilds, canonical edits, live auth, model calls, AI replies, save/tap records, uploads, Git changes or account/private-data reads. External requests and non-GET traffic are intercepted; WebSockets are closed and service workers blocked. The app automatically attempted one POST to `/rest/v1/feature_analytics`; it was blocked, not sent. Audit reports external sent 0, non-GET sent 0, page errors none and server stopped.

Body text: `screen_08_predictions-body.txt`. Safety evidence: `safe-audit.json`; complete fictional table payloads: `fictional-fixtures.json`.

## Visual inspection and limitations

Read the PNG once. It is clean and legible with the native logo/navigation, selected Predictions tab, heading and Refresh button, followed by complete Weight Loss Prediction, Calorie Needs (TDEE), and Injury Risk Assessment empty-state cards. The next card begins at the bottom, and the native feedback launcher remains visible. This is a viewport overview, not a full-page capture of all eleven prediction categories. No NaN, visible error or guest/demo banner is present.

Original color fidelity is preserved: native white navigation, blue-to-green selected tab, page gradient `#f0fdf4 → #dbeafe → #cffafe`, and actual teal/cyan empty-state fills, borders, icons and text. No recoloring, compositing or postprocessing was applied.

The screenshot demonstrates the real insufficient-data interface, not verified predictions, efficacy or medical advice. The app's native “AI Predictions” branding remains, but no model result was generated. Source footer copy about machine learning and some empty-state thresholds are app-authored claims, not independently validated capabilities or requirements; the visible TDEE prompt says 7+ days although the underlying source permits calculation with fewer entries. Those native texts were not altered. This is fictional offline state, not a live user's Pro entitlement.
