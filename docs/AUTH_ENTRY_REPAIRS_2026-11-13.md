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
