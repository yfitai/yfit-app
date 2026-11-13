# Android live-update Build 109

**Date:** November 13, 2026

**Status:** built, tested and ready for the existing GitHub/Vercel release. Publication and actual phone execution are not yet verified.

## Authorization and scope

The owner approved publishing Android live-update Build 109 after the medication weekday/combination feature went live on the web and the owner-created Supabase fields passed a zero-row verification. The release uses `yfitai/yfit-app`, the existing Vercel app project and the existing `https://yfit-deploy.vercel.app/updates/bundle.zip` location. No new project, APK, Android Studio/ADB operation, reinstall, account reset, app-data clearing, medication-record edit, native/provider configuration change, public social post or financial/report send is included.

Build 109 contains the approved medication weekdays, separately entered combination ingredient strengths, conflict comparisons and grouped provider printing/PDF output. Medical checker coverage remains limited and is not clearance to take or change a medication. See `MEDICATION_SCHEDULING_AND_COMBINATIONS_2026-11-13.md` for the feature details.

## Release-blocking bugs found and repaired

The active Build 108 archive used fixed native bundle ID `production` and tried to read `downloadBundle()` result `.bundleId`. Installed Android LiveUpdate 7.4.0 declares/implements a void result and rejects already-existing IDs. The old caller therefore never selected a next bundle in the bounded contract tests. A new ZIP alone cannot repair that older executing JavaScript.

The new core validates read-only release metadata, uses unique `build-109` IDs, checks already-downloaded/current IDs, awaits the void download completion, and explicitly selects the requested next ID. It does not delete an existing/active bundle or change session storage. Concurrent update checks share one in-flight promise. Older/stale manifests cannot downgrade a newer executing HTML build or native bundle ID. Failed downloads or staging cannot be reported as successful application.

The release manifest includes SHA-256 integrity metadata. The inspected Android 7.4.0 implementation compares hexadecimal SHA-256, so the Android caller uses that actual installed-source contract. iOS checksum behavior is not changed under this Android release. Native configuration/signing/provider changes are not part of this task.

The existing banner previously wrote a new manifest timestamp and reloaded the page without staging a native bundle. The new native banner compares the validated release number to a build marker embedded in the executing HTML, awaits staging/application, and preserves retry/error state on failure. It never labels a remote manifest or pending download as installed. A small native-only `Build 109` badge identifies the loaded HTML; it does not by itself prove extraction of the ZIP. Browser timestamp/reload behavior is retained.

The packaging script previously updated a ZIP in place and included Vite's copied older `updates/bundle.zip` inside it. The new script fails on build/metadata errors, requires relative native assets, creates a fresh ZIP, excludes prior releases/maps/unsafe paths, verifies CRC/root files and produces a versioned integrity manifest. Mutable manifest/archive URLs receive no-store cache headers. Existing serverless settings and root web/relative native asset modes remain intact.

## Artifact and rollback

- Build number: **109**, advanced once from 108.
- Archive size: **4,669,200 bytes**.
- SHA-256: `56e835d94229b4d41efc507fd656f935852d54564f02ed29e87b934dd5bce0c9`.
- Metadata: `public/version.json`, `public/updates/bundle.json`, ZIP root `version.json` and HTML build marker all identify 109.
- No embedded older ZIPs; no recognizable private credential candidates in the checked archive text.
- Build 108 is preserved in Git history at pre-release commit `b3946dc` and a private local rollback copy. Its SHA-256 was `b7e61524d68788b45fba764584c3cf1bb2f6ce330fa4d91d2f96a6c2cd73c52f`.
- Do not drop the newly added medication fields for an app-code rollback; preserve user choices.

The normal packaging command remains `bash scripts/create-update-bundle.sh`. For a source-only correction during an already-authorized release, `bash scripts/create-update-bundle.sh --rebuild-current 109` requires an explicit matching current number and does not increment again. Vercel continues `npm run build:web` and must not independently bump the phone metadata. No APK workflow was triggered.

## Verification

38 updater/service/banner/packaging regressions passed with fictional platform/plugin/network fixtures. These cover void downloads, unique/reused IDs, no downgrades, metadata validation, fail-closed download/stage, shared concurrent checks, browser no-op, rollback-ready acknowledgement, banner success/error/retry/listener cleanup, and fresh-archive/failure preservation. The packaging test uses a disposable project and never bumps the real release.

All 75 medication regressions, 11 form/list/provider-print/PDF assertion groups and eight auth-entry regressions also passed. Scoped updater/banner ESLint passed. Final native-target and web compilations passed. Neither compilation nor a mocked plugin test is a completed installed-phone test. Sequential production food search is checked after deployment, separately from these fixtures.

Sanitized evidence lives in the private monopro hub at `docs/evidence/2026-11-13-build109/`.

## Existing-phone bootstrap limitation

The repository's Capacitor `server.url` points to the same legacy Vercel host. If that configuration is actually present in the owner's installed app, reloading the same origin can load the repaired web bootstrap without deleting sessions. That remote web path is different from ZIP extraction. Retained installed APK/configuration/assets are unavailable, so do not claim the actual device uses that configuration.

If a phone continues executing the broken local Build 108 caller, archive-only publication cannot force it to install Build 109. Publishing the repaired web assets on the existing legacy origin provides the identified no-reinstall bootstrap only for remote-hosted builds. Do not instruct clearing app data, uninstalling or deleting an active bundle as a guessed recovery step.

## Owner phone check

1. Connect the phone to Wi-Fi and open the existing YFIT app.
2. Leave it open for about a minute, fully close it from recent apps, then reopen it. If an update banner appears, tap once and allow it to complete.
3. Check the small **Build 109** badge and whether My Medications → Edit offers the required one/two weekday selections. Existing weekly medications need the owner to select their days; no days were guessed or backfilled.
4. If the badge is missing, says unknown/older, or the controls remain old, send a screenshot and identify whether this is the installed Android app or a browser/PWA. Do not reinstall or clear data.

A screenshot/control check provides loaded-code evidence. Full native installation/restart behavior, user-controlled save/reload and due-day/off-day dose behavior still require actual device verification. Native Google callback/session transfer remains a separate unresolved issue; this release does not claim it fixes sign-in, payments, report delivery or six-platform posting.
