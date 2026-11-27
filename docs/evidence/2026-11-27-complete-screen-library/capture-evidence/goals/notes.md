# Goals screenshot

**Final asset:** `/home/ubuntu/yfit-screen-library-2026-11-27/pages/screen_02_goals.png` — one unretouched 1080 × 1920 PNG, captured at 540 × 960 CSS pixels with device scale factor 2.

## Actual source and view

Declared production MAIN revision: `20cae3de9b8d9160618299a1f81fa2b79021258a`. Inspected the byte-identical archived source under `/home/ubuntu/yfit-draft-a-review-2026-11-27/assets-capture/source`: `src/App.jsx`, `src/components/Goals.jsx`, `GoalsEnhancement.jsx`, `Navigation.jsx`, and `src/contexts/UnitPreferenceContext.jsx`. The authenticated `/goals` route mounts `Goals`; it is not the marketing `GoalsMockup` or a guest preview. Existing compiled static assets and the helper's previously verified 203-module provenance were reused unchanged, with no rebuild.

This capture scrolls the actual page to the first **Starting Point** manual-entry card, keeping its complete form and the actual sticky navigation with Goals highlighted visible. The next measurements section begins at the bottom. The page title and body-type education section are above this viewport; no UI was hidden, rewritten, or rearranged.

## Fictional fixtures

`user_goals` uses source-read fields: `age: 35`, `gender: male`, `height_cm: 175`, `weight_kg: 80`, `activity_level: light`, `goal_type: maintain`. The app itself displays height as 5 feet / 9 inches and weight as 176.4 lbs. Source-recognized starting/daily-goal fields are recorded in `fictional-fixtures.json`; target weight, target body fat, and target date remain unset. Body measurements, calculated metrics, logs, meals, and subscriptions are empty. The inherited synthetic identity is `Demo User` with an example.invalid email, not an existing account.

The final preference is **imperial**, matching the application's initial state. A metric fixture in an earlier discarded, unsaved attempt exposed an actual asynchronous preference/loading race (blank metric height and an imperial weight value under the metric label). No source, CSS, React state, or rendered content was patched to correct that behavior; the coherent native default-unit state was chosen instead. No unit-toggle save was triggered.

## Safety and fidelity

`capture_goals.py` imports the existing helper via `sys.path`, starts its own headless Chromium/context and ephemeral loopback server, and uses only synthetic session/GET fixtures, navigation, and scrolling. No saves, calculation actions, reset actions, model calls, private records, live authentication, uploads, production writes, rebuilds, or repository edits were performed. The helper blocks external traffic, non-GET requests, WebSockets, and service workers. Audit: external requests sent **0**, non-GET sent **0**, page errors **0**, server stopped. One automatic `feature_analytics` POST was intercepted and aborted; no analytics reached the network.

Original pale teal panels, blue/green navigation gradient, borders, shadows, icons, text, and controls are untouched. The PNG was inspected once with the image reader: readable complete Starting Point card; no NaN, guest banner, error, or result claim. No crop, compositing, recoloring, phone frame, or generative modification was applied.

## Display and claims limitations

This is an offline fictional manual-entry profile, not proof of a live account, saved goals, calculated metrics, health advice, AI capability, or progress. No `GoalsResults` output is mounted. Height inputs retain the app's actual value-only display after their Feet/Inches placeholders disappear, and the actual gender option reads “Gender M”; neither was relabeled. The full page and the lower measurements form are not covered by this single viewport. The floating app feedback button remains native and unopened.

Companion evidence: `safe-audit.json`, `screen_02_goals-body.txt`, `fictional-fixtures.json`, and reproducible `capture_goals.py`, all in this work directory.
