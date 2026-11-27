# Body Recomp screenshot

- Final asset: `/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_09_recomp.png`
- Route: `/body-recomp`; actual component: `src/components/BodyRecomp.jsx`, authenticated route in `src/App.jsx` (line 380).
- Declared production MAIN revision: `20cae3de9b8d9160618299a1f81fa2b79021258a`. Inspected the byte-identical archive at `/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source`. Reused the approved helper and unchanged compiled static build; helper verifies the existing 203-module source provenance. No rebuild, source edits, CSS edits, DOM-content injection, canonical Git operations, or changes to original shared files.

## State and fictional fixtures

The component reads the latest `body_measurements` row (`user_id`, `created_at`, `<measurement>_cm`, `<measurement>_goal_cm`) and `progress_measurements` history (`measurement_type`, `measurement_value`, `unit`, `measured_at`). Both tables are empty for this capture, producing the app's real no-goals/no-history setup and empty state. There are no invented measurement trends, progress percentages, saved taps, or AI replies. Unneeded default `calculated_metrics`, `meals`, and `daily_logs` fixtures were also emptied. The helper supplies a synthetic session and fictional completed-onboarding profile, preferences, generic goals, and subscription fixture; these are not real account records or live authentication.

## Capture and safety

`capture.py` imports `offline_capture_base.py` via `sys.path`, launches its own headless Chromium/context and ephemeral loopback server, navigates only to the actual route, waits for the real lazy-loaded component, and saves one screenshot at 540×960 CSS pixels with scale factor 2 (1080×1920 PNG). Initial loading-only checks failed before a screenshot was taken; explicit readiness waits resolved that timing issue. No controls were tapped, no record was saved, no model was called, and nothing was uploaded. Helper body text: `screen_09_recomp-body.txt`. Safety evidence: `safe-audit.json`; all records: `fictional-fixtures.json`.

The final audit records zero external requests sent, zero non-GET requests sent, no page errors, and a stopped local server. The app automatically attempted one `feature_analytics` POST; the helper aborted it before sending. WebSockets and service workers were blocked. No shared/MCP/cloud browser was used.

## Visual inspection and limitations

Visually inspected the final PNG once with the read tool: correct 1080×1920 dimensions, real YFIT header with Recomp selected, readable page title and controls, amber goal setup panel, native empty state, and green/teal promotional card. No guest banner, NaN, error, mock phone frame, or fabricated page content is visible. Original blue/green app background, active-tab gradient, amber panel, native control spacing, feedback button, and green/teal promotional card are unchanged. The native empty-state text is deliberately low contrast; it has not been retouched.

This screenshot documents setup before measurement tracking, not demonstrated recomposition results. The native “Get AI-Powered Recomp Recommendations” / “Pro unlocks…” card is static product promotional copy from the component, not independently verified capability, a generated recommendation, or medical advice. The capture is offline with fictional session fixtures, not a live signed-in account. The viewport ends before the footer; no cropping or compositing was performed.
