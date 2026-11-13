# YFIT authentication entry repairs — November 13, 2026

The user approved the first repair batch: web email-callback asset loading, signup tab selection and the separate admin accounting-page OAuth crash. They also requested investigation of web versus installed-phone authentication. Payment fulfillment, subscription policies, financial calculations/report sending, social retries and a new phone bundle are outside this batch.

## Main app repair

The canonical `yfitai/yfit-app` source serves both `app.yfitai.com` and `www.yfitai.com`. Its Vite configuration now uses root-relative `/assets/` paths for web builds, so a direct nested `/auth/callback` or `/reset-password` entry loads JavaScript rather than requesting a nonexistent `/auth/assets/` module. Explicit `--mode capacitor` builds retain the previous `./` asset base for packaged native content.

`/signup` now passes `initialTab="signup"` to the active Auth component; `/login` passes `initialTab="login"`. Distinct component keys also reset the initial tab on navigation between these routes. Google remains the recommended first option in both forms and email/password remains available. No provider configuration, credentials, account records or authentication handlers were changed.

Vercel now runs the explicit `build:web` command, which bypasses the old `prebuild` version increment and deployment timestamp rewrite. A website-only deployment must not advertise a newer phone archive that was not produced. Existing mobile archive and manually triggered Android build commands now explicitly select the Capacitor asset target and retain their existing version-bump lifecycle. These commands were not executed to create or release a phone bundle. No `outputDirectory` was added to Vercel, and serverless functions/rewrite settings remain otherwise unchanged.

## Checks completed before push

`node scripts/test-auth-entry.mjs` passed eight checks: web nested-route asset resolution, native relative base, distinct route initial states, actual server-rendered signup selection, actual server-rendered login selection, safe fallback tab selection, web deployment not bumping native metadata and explicit Capacitor target in existing native build entrypoints. React component evaluation uses stubbed authentication and translation services; no provider, database, email or account calls occur.

Both `npx vite build --mode production` and `npx vite build --mode capacitor` compiled successfully into diagnostic directories outside the repository. Their entry assets exist; web HTML points to `/assets/`, and Capacitor HTML points to `./assets/`. These checks compile the native asset target only, not an APK/AAB or live-update archive. Tracked phone metadata and archives are unchanged at Build 108. `git diff --check` passed.

## Pending deployment and admin evidence

The main web changes will be pushed to the existing GitHub/Vercel pipeline, then direct callback asset MIME and signup rendering will be checked on production. A rendered callback without credentials is a bootstrap check, not proof of a completed real email or Google login.

The production accounting host `admin.yfitai.com` identifies Railway as its serving platform. Its GitHub-backed source is `yfitai/yfit-admin`, checked out at the misleading local path `/home/ubuntu/yfit-marketing`; a Manus-managed backup checkpoint does not by itself update the Railway serving artifact. The admin code repair and regression tests are being prepared separately. Actual build-time OAuth input presence and serving revision require verification against the existing Railway service; no duplicate project or authentication migration is authorized.

The web/phone source investigation and final deployment results will be appended after verification. No payment, database-permission, report-send or social-post repair is claimed by this note.

## Live web checks and completed admin code repair

Main-app functional commit `4787b67` was pushed to the existing `yfitai/yfit-app` main branch. Its automatic Vercel deployment changed both app and www entry assets to `index-6OQdqWdw.js`. GET-only checks at approximately 15:05 EST verified both `/auth/callback` entries resolve root assets served as JavaScript. Served phone metadata remains Build 108. A live browser visit to app `/signup` at approximately 15:11 EST displayed Create Account with Continue with Google first, followed by name/email/password fields. No form was submitted and no account was selected.

The admin repair removes eager URL construction during render, validates build-time OAuth inputs with a controlled non-sensitive error, and handles login clicks/unauthorized redirects without throwing. Its original `/app-auth` query/state/origin contract and backend remain unchanged. Thirty-three mocked regressions, TypeScript checking and production compilation passed; mocked Accounting report queries were confirmed disabled for unauthenticated users. No financial/report/backend behavior changed. Missing Railway frontend build inputs must still be corrected in the actual serving environment before working admin login can be claimed; rendering a controlled configuration message is not completed authentication.

Further discovered Windows mobile build entrypoints (`deploy-android.ps1`, `deploy.bat`, the Android branch of `deploy.ps1`) were adapted to explicit Capacitor mode. `rebuild-android.ps1` now builds native-target assets before sync without incrementing version metadata or creating an OTA archive. The eight-check regression gate was rerun successfully with these entrypoints included. No Windows command, native sync/build/install or archive update was executed.

A user screenshot at approximately 15:09 EST identified a published n8n workflow named YFIT Social Media Automation v2 and a visible Daily Schedule Trigger labelled 6 AM CDT. This supersedes the earlier lack of a named workflow/schedule-node screenshot, but does not verify its actual cron/timezone, publication version or execution success. Ask for the existing Executions view; do not press Execute workflow or retry any post. It is the n8n application hosted on Railway, not Railway's deployment dashboard. n8n API authentication remains rejected; the screenshot does not grant API access.

Website and phone source use the same Supabase account project but independent sessions; see `docs/WEB_PHONE_AUTH_2026-11-13.md`. Native Google callback delivery and the installed-phone version remain unresolved, not repaired by the website change.

## New social execution evidence from the user

The user's November 13 approximately 15:12 EST screenshot shows retained daily n8n executions for November 8–13, each marked Error after roughly 8–9 seconds at displayed 12:00:00. The selected November 13 execution is ID1191, duration8.805s, failing at Call Supabase — Scrape Articles with the generic message that the service could not process the request. Display timezone and exact HTTP status/response body are not shown. This proves the scheduler fired and these six visible daily runs failed at scraping, before downstream generation/posting. It does not prove every November run failed or identify the scraper's exact cause. It supersedes the earlier statement that all live execution outcomes were unavailable; programmatic API access remains rejected. Request the failed node's sanitized Output/error body/status, not headers or credentials; do not execute/retry or alter the published workflow.

## Exact scraper error and schedule observation

The subsequent failed-node screenshot shows: `Failed to insert articles: duplicate key value violates unique constraint "scraped_articles_url_key"`. This establishes the immediate cause of the selected November 13 failure: inserting a URL already present is treated as fatal by the scraper, stopping that run before generation/posting. It does not establish the first failure date or prove the same cause for every run. Do not remove the unique constraint or delete existing articles. A separate deferred approval request asks whether to add a tested duplicate-safe scraper repair to this scope, preserving records and without retries, schedule changes or public backfill.

The trigger input timestamp is `2026-11-13T11:00:00.007-06:00`, with readable 11:00 AM and America/Chicago UTC−06:00. This is a selected execution's observed input time, not an inspected live cron expression; it differs from the 6 AM CDT node label. The execution-list 12:00 display can have another viewer timezone. No schedule was changed.

GET-only comparison of the configured native legacy host and primary app at approximately 15:14 EST found both serving HTTP200 and the same repaired entry asset `index-6OQdqWdw.js`. The legacy hostname is therefore not evidence of a stale deployment at this moment, although separate origins still have independent sessions and redirect allow-lists remain unverified. Production/native-prefixed Vite configuration names match in the current workspace. No phone origin was changed and no installed phone was tested.

## Admin deployment verified

The existing Railway service automatically deployed the GitHub-backed admin repair at `7bfbdea`; the served asset changed from `index-BaKbmOtf.js` to `index-bek1PTqG.js` and contains the tested controlled configuration handler. A live browser visit at approximately 15:16 EST shows Authentication Required and a Sign In button instead of Invalid URL. No Sign In click, actual admin authentication or report-generating request was performed. Rendering is repaired; build-input validity and completed login remain separate gates, and authenticated accounting calculations/report correctness are not cleared by this UI check. No separate Railway project, configuration change or manual redeployment was needed.

The user separately approved repairing/testing/deploying the duplicate-safe scraper to its existing Supabase function at approximately 15:16 EST, preserving unique URL constraint and existing rows and without schedule changes, manual retries or public backfill. That implementation/deployment is a new approved work item, not yet completed in this note.

## Scraper active-code comparison resolved

The owner-pasted full Edge Code at approximately15:26 EST is the v2 scraper with plain article `.insert(...)`. Full-file comparison against pre-repair GitHub differs only in the article insert/upsert guard and its comment/options. This confirms deployed Supabase Code did not include the previously committed URL conflict-ignore repair. Permanent URL uniqueness versus seven-day title prefilter explains how already-present URLs can trigger the selected duplicate failure. No database schema change is needed for the scoped fix. Before-code and hash metadata are preserved privately. The tested canonical replacement is ready for the existing function's Deploy Updates action; management access remains owner-controlled and deployment completion is still pending. Do not imply the entire six-platform pipeline has been exercised or automatically retry posts.
