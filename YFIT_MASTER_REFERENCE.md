# YFIT Master Project Reference

**Last Updated:** November 13, 2026
**Read this at the start of every session before making any changes.**

---

## End-Session Handoff — November 13, 2026, 17:57 EST

**Owner phone observation:** the owner reported seeing the new-version banner, tapping it, opening the app, and that the medication changes appear in effect. This is positive owner-reported loaded-code/visual verification after the published Build109 release. The owner will review more this evening. No screenshot/build badge, native installed-bundle identity, medication save/reload, selected-day/off-day dose behavior or compound report was independently verified. Do not ask for another upload or SQL run; preserve the distinction between this observation and a full device test.

**Today's actual completed decisions/results:** repaired and deployed web callback/signup entry and the admin eager-login URL crash; full fresh account login remains unverified. Compared owner-supplied live scraper code against GitHub, repaired duplicate-safe inserts, and owner deployed to the same existing Edge Function. One specifically authorized scraper-only test returned HTTP200/10 saved articles; no generation, manual public publishing, retry or backfill was invoked. Owner approved/saved/published the existing social workflow's UTC cron `0 11 * * *`, giving6AM Manitoba/MBT year-round. Owner applied nullable medication weekday/ingredient fields, which passed a zero-row schema read. Medication feature merged/deployed, then explicitly approved Build109 published with repaired update staging, native banner and fresh packaging. Live ZIP/manifest checksum/root metadata and legacy/primary web bootstrap checks passed; sequential foodsearchHTTP200/fiveapple results.38 update regressions,75 medication regressions,11 form/print/PDF groups,8 auth-entry checks and both builds passed. Exact evidence and limits are in the current release/feature/scraper/schedule/root-cause reports and private hub.

**Next session, in order:**
1. Review the owner's evening medication observations; verify chosen weekday persistence, due/off-day controls, preserved taken history, exact combination strengths and grouped provider print/PDF. Do not modify a real medication record on the owner's behalf without a designated authorized test. The checker remains limited and does not grant clinical clearance.
2. Inspect the next normal November14 social execution (11UTC/6AM Manitoba), scraper/generator/assembly stages and six terminal provider publication URLs/statuses. A green workflow or HTTP success is not publication proof. Do not trigger/retry/backfill without separate authorization. TikTok optional first-comment reconnection remains open.
3. Recheck actual web/phone sign-in and authenticated admin report display/delivery. Fresh Google/email login, native return/session transfer, received email evidence and report integrity are not cleared by the owner's existing-session app opening. Annual cache completeness, unavailable-stat-to-zero handling, date-window/PDF issues and delivery access remain open.
4. Continue approved payment investigation/repair planning: missing success route, expired entitlement and webhook/ownership risks remain unresolved; no real test-mode purchase completed and no production charge authorized. After processing/measurement works, identify the user's Google report type and establish actual clicks/pageviews/signup attribution before diagnosing marketing success/failure. No GA4/GTM setup was established in this session.

No broad all-system/beta-ready pass is claimed. Default next work is canonical main app `yfitai/yfit-app`; live marketing and /go stay inside it. Keep separate existing repositories under the private yfit-ai monopro hub, retain managed admin S3 origin and existing deployment targets, and never revive retired marketing. Edge-function automatic release remains a separately proposed/unimplemented improvement. The owner requested docs-only shutdown followed by canonical end-work; no new code, deployment configuration, repository consolidation or data changes are authorized during this shutdown.

## Current Android Release — Build 109, November 13, 2026

The owner explicitly approved publishing Android live-update Build 109 at 17:29 EST. Build 109 is published and independently verified from the actual legacy update host; release commit `c3458d9a235bd8766e1a37ffe6f63a450261d296`. At17:57 the owner reported tapping the new-version banner and seeing the medication changes in the app; exact native-bundle/build identity and deeper device behavior remain unverified. Current metadata and downloaded archive root identify 109, superseding older Build108 statements as current release state. Read `docs/ANDROID_BUILD_109_2026-11-13.md` and the medication feature report. Use only the existing main app/GitHub/Vercel/legacy update URL; no APK, ADB, Android Studio, reinstall, app-data clearing or provider/native configuration change was authorized/performed.

Release preparation found two actual updater defects: the active108 ZIP uses constant `production` and expects an ID from the void Android LiveUpdate7.4 download API, so it never stages; the packager includes the prior ZIP and updates an existing archive with stale files. The corrected service validates read-only release metadata, uses unique build IDs, reuses verified listed downloads, explicitly stages after void success, guards downgrade/concurrent checks and never deletes user/bundle data. The native banner waits for real staging/reload and displays an executing-HTML build badge, not remote/pending metadata. Browser update behavior is preserved. SHA256 uses the inspected Android7.4 hexadecimal comparison; no iOS checksum/native signing change. Mutable update URLs have no-store headers.

38 isolated updater/service/banner/packaging regressions,75 medication regressions,11 doctor-print/form/PDF groups,8 auth-entry checks and scoped lint passed. Final native/web builds passed. Fresh109 ZIP has4,669,200bytes, SHA256 `56e835d94229b4d41efc507fd656f935852d54564f02ed29e87b934dd5bce0c9`, no nested ZIPs and no recognizable private credentials in checked text. Build incremented108→109 exactly once; a guarded rebuild-current109 refreshed the same number. Vercel build:web does not bump it.108 remains in Git at pre-release`b3946dc` and private rollback copy.

Live checks at22:49:04UTC: legacy manifest/ZIP HTTP200 and matchingSHA/root109/CRC/native-relativeassets/no-storeheaders; both legacy and primaryapp hosts serveHTML109/repaired `index-Dhz1AcCw.js` JavaScript. Sequential foodsearchHTTP200/fiveapple results. Safe private evidence `docs/evidence/2026-11-13-build109/live-publication.json` explicitly leaves actual_phone_tested false. Publication is complete; owner phone check is the next gate, not another upload or SQL run.

An archive cannot repair older executing broken JS. The existing legacy-host web deployment provides a possible no-reinstall bootstrap only if the installed binary actually uses the repository's remote server.url. Installed configuration/state is not verified. Do not treat upload/badge/remote manifest as proof of native ZIP installation; owner must open on Wi-Fi, allow download, close/reopen and check109 badge plus weekday controls. If still old, request screenshot/client identity, not uninstall/data clearing. Native Google/session transfer, authenticated medication persistence, report delivery, payment and normal six-platform execution remain separate unverified gates.

## Current Session Workflow — November 12, 2026

The sandbox was reset, but the canonical main-app source and private documentation hub were restored from GitHub. The admin workspace was restored from its managed origin and confirmed against GitHub. The user authorized the Manus Connector for the four active repositories. No repository was recreated, consolidated, deleted, or moved; the retired marketing repository remains untouched.

Both `start-work.sh` and `end-work.sh` now use the authorized GitHub CLI connection without a PAT prompt, plaintext credential files, or credentials embedded in remote URLs. Repository-local Git identity is used instead of changing global Git settings. The startup authentication change was saved as `33748df`; the companion end-work change is saved with this session's documentation.

End-work checks canonical repository identity and the `main` branch before saving, commits/pushes the app, admin and private documentation hub, rejects recognizable credential values in newly staged lines, and confirms all three working trees are clean and match GitHub. Failed checks or pushes must stop the workflow rather than report success. The admin managed S3 `origin` is retained; GitHub backup uses the separate `github` remote. If admin source changes, its managed workspace checkpoint must also be saved through Manus, not by a terminal S3 push. Older absolute prohibitions on checkpoints in historical notes must not override this managed-origin synchronization requirement.

**Current mapping overrides historical marketing references below:** `/home/ubuntu/yfit-app-full` is `yfitai/yfit-app` and includes the live app, current marketing homepage (`src/pages/LandingPage.tsx`), `/go` page (`src/pages/GoPage.tsx`), and translations (`src/lib/i18nResources.js`). `/home/ubuntu/yfit-marketing` is actually `yfitai/yfit-admin`. `/home/ubuntu/yfit-ai` is the private documentation hub. `yfitai/yfitai-yfit-video-service` remains the separate Railway service. `yfitai/yfit-marketing` is retired and must not be used for current website changes.

The six rules remain mandatory: read this reference; verify the repository; check the bundle number; never add `outputDirectory` to `vercel.json`; test food search around API changes; edit translations only in `src/lib/i18nResources.js`. Food API checks must be sequential, not parallel. At the November12 restart, build metadata was **108 (August11,2026)**; the later explicitly approved current release is **109**, detailed above. Local compilation must bypass the version-bumping `prebuild` lifecycle when no new bundle is authorized.

Copyable prompts are in `docs/SESSION_PROMPTS.md`. Restart verification evidence and explicitly untested items are recorded in `docs/RESTART_VERIFICATION_2026-11-12.md`. Passing build/endpoint checks is not equivalent to signed-in mobile, financial, report-delivery, or social-posting verification. Historical documentation inconsistencies and any tracked legacy credentials require a separate approved cleanup; never use, repeat, or copy old credential values into current work.

**Restart checks completed:** the main Vite compilation and focused food-proxy contract tests passed; production app, marketing and `/go` rendered; sequential apple/chicken food requests returned HTTP 200. Admin synthetic/mocked tests (21), type-check, build, sandbox database constant SELECT, committed accounting artifacts and public health checks passed. Video source matched GitHub, syntax passed and Railway `/health` returned HTTP 200. The private hub's accessible Git history was verified. Both session scripts passed syntax checks and eight mocked save-safety scenarios. End-work also verifies the optional video-service checkout when present.

**Do not claim the entire app is cleared:** unresolved findings include raw app-tour translation keys, direct signup opening the Sign In tab, marketing signup-domain and policy/Terms navigation inconsistencies, and source-level admin report-endpoint authorization concerns. Real Google sign-in/callback, authenticated feature persistence, mobile devices, production financial/report delivery and social automation were not exercised. Historical docs contain credential candidates: treat exposed tokens as compromised and arrange rotation/redaction through the appropriate dashboards under separate authorization, without displaying or reusing values. No fixes to app behavior or historical credentials were made in this restart task.

### Processing Tests — November 12, 2026 (Later Follow-up)

The user requested sign-in, payments, report displays/delivery and six-platform posting tests before marketing diagnosis, and reported a possible November 5 signup with most other accounts likely setup tests. User-provided Supabase account-overview screenshots subsequently confirmed Sunil Rehman was created and confirmed November 5, 2026 at 13:16 and last signed in November 6 at 22:18 using Email (timezone not shown). The list shows 15 accounts, not 15 verified customers; genuine/test classification, dashboard/onboarding use, paid entitlement and attribution remain unverified. Google-first initiation reached correctly branded YFIT AI Google login with the expected callback; no real Google browser login was completed. The user prefers read-only Supabase metadata. No users were changed, reset or impersonated; next inspect retained Logs and app-account linkage.

**New confirmed production display failure:** `admin.yfitai.com/accounting` renders `TypeError: Invalid URL`. The compiled login-URL helper has undefined build-time OAuth configuration; local admin `getLoginUrl` depends on `VITE_OAUTH_PORTAL_URL`/`VITE_APP_ID` and is eagerly evaluated by `useAuth`. Do not treat admin health 200 as a working report UI, or change deployment/auth settings without approval.

Read-only Stripe evidence found zero charges/refunds since August 1; catalog/subscription/webhook reads were denied by the available restricted key. Isolated source fixtures reproduced material payment-entitlement/checkout/webhook risks; deployed policy/config parity and a real sandbox checkout remain unverified. Report tests found incomplete annual cache aggregation, misleading zero-visitor fallbacks, ignored social date windows and PDF pagination issues. Existing financial/tax reports remain internal and unchanged; no re-sync/import/regeneration/send was performed.

Read-only Upload-Post history confirmed six current platforms and 18 published URLs dated October 29–31, but no November 1–11 publication records in the inspected range. This is missing daily-publication evidence, not proof of 66 failed jobs. TikTok's latest status warns its first comment was skipped and requires reconnection. Live n8n/Supabase scheduler execution history was not accessible; inspect existing logs before retrying or altering any automation.

**Marketing/measurement caution:** website-stat failures become fresh-looking zeroes, and no GA4/GTM installation was observed in the reviewed app assets/source. The user's Google report type is not identified. Do not conclude zero human visits or marketing failure from these reports. Fix/test processing first, then establish consent-aware pageview/click/signup attribution with isolated test traffic and verified exclusions. See `docs/PROCESSING_TESTS_2026-11-12.md` for sanitized evidence, limitations and safe next steps. No production charges, public posts, database/user changes, application fixes or service configuration changes were made in this follow-up.

### Root-Cause Investigation — November 13, 2026

The user requested investigation, not production repairs. See `docs/ROOT_CAUSE_FINDINGS_2026-11-13.md`. New diagnostics reproduce defects without changing application behavior: app authentication (18 assertions), payments (10 defect scenarios), social helpers (3 scenarios), served-admin asset isolation and bounded read-only report aggregates. Passing reproduction tests mean the bug is demonstrated, not repaired. Full sanitized evidence is backed up in the private hub under `docs/evidence/2026-11-13-rootcause/`.

**Deployment-evidenced bugs:** the email confirmation destination `/auth/callback` is blank because relative Vite entry assets resolve under `/auth/assets/`, where Vercel serves HTML rather than JavaScript. The eventual web fix must retain separate relative asset behavior for Capacitor, not indiscriminately change both targets. `/signup` opens the login tab. Active deployed entitlement logic retains Pro on expired trial/grace; active checkout returns to missing `/payment-success`. The served admin OAuth helper has undefined build-time portal/app inputs and eagerly throws Invalid URL, although local managed environment declares the names; the serving build/checkpoint still needs identification.

**Source-confirmed, production parity unresolved:** profile error/onboarding handling, webhook paid/status/identity/receipt gates and subscription ownership policies, cache-only annual reports without populated-month completeness, analytics outage-to-zero fallbacks, and generation persistence/validation/HTTP-only-success handling. The prior claim about a misleading payment success component is narrowed: that component is dormant; the confirmed active problem is the missing destination route. Do not change live RLS, subscriptions, reports or user records on this evidence alone.

**Operational/access findings:** validated account-wide/date-filtered Upload-Post reads through November 13 found 18 October 29–31 publication records and no November entries. Missing daily evidence is not a count of failed jobs. TikTok's optional first-comment permission issue is separate from successful video publishing. Newly enabled n8n access required in-memory API-root normalization from an editor URL, then returned 401; a documented token-replacement correction and single retest still returned 401. Existing API-key validity/expiry/instance pairing must be verified securely before live workflow/scheduler conclusions. Supabase and Stripe production configuration/policies remain access-limited; no charges since August does not itself prove a payment bug.

No fixes, account changes, production charges, sends, posts, retries or new mobile bundle were authorized/performed. Only diagnostics and docs are saved; admin diagnostics also require a managed checkpoint after GitHub backup. Recommended next approval: tightly scoped web callback/signup repair and admin render/config validation, preserving current repo/deployment mapping; then payment protection and reporting integrity with safe preview/fixture validation before production changes.

### Approved Authentication Entry Repairs — November 13, 2026 (Later)

The user approved the first batch: web callback/signup and admin accounting crash, plus investigation of web/phone differences. Main functional commit `4787b67` uses root web assets and explicit relative Capacitor mode, route-specific Auth initial tabs and a `build:web` deployment command that does not bump phone metadata. Its automatic Vercel deployment is live; both app/www callback modules are JavaScript at root paths, and live app signup displays Create Account with Google first. Eight regression checks and separate web/Capacitor asset compiles passed. Existing Android/OTA executable build entrypoints explicitly select native mode, with rebuild preparing assets before sync. No new phone archive or native build was produced; Build108 remains unchanged. Read `docs/AUTH_ENTRY_REPAIRS_2026-11-13.md`.

Admin source repair lazily starts login, validates missing/invalid configuration safely and preserves its existing OAuth/backend protocol. Thirty-three mocked tests, type-check and build passed. Actual `admin.yfitai.com` serving host is Railway, not Manus hosting or main-app Vercel. Working login requires the serving build to contain its authoritative OAuth inputs; GitHub/managed backup alone is not proof of Railway deployment. No accounting calculations, DB records, report sends or admin OAuth protocol migration were changed. Finish verifying the existing Railway service, not a duplicate project.

Web/phone current source and retained OTA archive use one Supabase account project, but origins/devices/PWA/APK have independent sessions. Current Capacitor remote URL is the legacy Vercel hostname; active source lacks native Google callback/session-transfer plumbing. This is a concrete native integration risk, not proof of the installed device behavior or two customer registries. Read `docs/WEB_PHONE_AUTH_2026-11-13.md`; identify phone install/version/origin and test a designated identity before native/provider/deep-link changes. User screenshot identified published n8n YFIT Social Media Automation v2 with daily schedule label 6 AM CDT; execution outcomes and effective timezone remain unverified. Do not execute/retry from the editor. Full sanitized repair evidence is retained in private hub `docs/evidence/2026-11-13-repairs/`.

**Later verified results:** the existing Railway service automatically picked up admin repair `7bfbdea`; current asset is `index-bek1PTqG.js`. Live `/accounting` now renders Authentication Required / Sign In, not Invalid URL. Completed admin sign-in and authenticated report behavior remain untested. Main callback without tokens now boots and follows normal logged-out routing rather than remaining blank. GET-only legacy/native-host comparison found the same repaired main asset as the primary app, so the older hostname is not currently proof of a stale website; independent origins/session and native Google-return risks remain.

**New user execution evidence and scraper approval:** n8n November8–13 visible scheduled runs show errors at Call Supabase — Scrape Articles; selected November13 execution1191 reports duplicate key `scraped_articles_url_key`. Its trigger input is11AM America/ChicagoUTC−6, differing from the6AMCDT label. Scheduler firing is established; exact duplicate cause is established for selected run, not every date. User approved duplicate-safe scraper repair/deployment preserving uniqueness/rows with no retries, schedule edits or public backfill. Local exact-URL dedup/actual-insert-count patch and10 mocked tests pass, but pre-patch GitHub code already used URL conflict-ignore upsert. Active Edge Code comparison is required before deployment; do not claim the new patch alone resolves the live DB error. Cloud Supabase management access remains unavailable; user is looking at their own signed-in dashboard. Guide Edge Functions → existing `scrape-fitness-articles` → Code, not Database Functions or Test. Read `docs/SCRAPER_REPAIR_2026-11-13.md`. No live scraper deployment/invocation or constraint/database changes performed.

**Active scraper Code supplied15:26 EST:** owner uploaded full current deployed Code. Full comparison shows plain `.insert` there, with only the conflict-ignore upsert guard/comment/options differing from pre-repair GitHub. Supabase deployment therefore lacks the previously committed URL fix; this is owner-pasted source evidence, not an API retrieval. Canonical replacement is tested and a private rollback before-file/hash record is saved. Remaining step: replace Code and Deploy Updates on the same `scrape-fitness-articles` function through owner-authenticated dashboard; do not create a function, alter secrets/JWT settings/constraint or invoke/retry. Deployment success still pending. All scraper tests and sequential food checks pass; existing article rows and Build108 archive remain untouched.

**Deployment completion15:37 EST, superseding pending status above:** owner reported Deploy Updates completed successfully for the existing scraper. Canonical replacement is saved at `6cc8a2a`; final11 offline regressions pass. This is owner dashboard confirmation, not an API-read or live scrape/publication test. Do not invoke/retry/backfill. Next gate is the next normal scheduled n8n run: scraper response, downstream generator/assembly status and six terminal provider outcomes. Zero saved articles can be legitimate duplicate skipping. Full payment, authenticated report, real Google/phone login and analytics verification remain open; no broad all-system pass is claimed.

**Release-process decision:** GitHub→Vercel web auto-deploy is verified and retained. Supabase Edge Functions require their own release step; storing a fix in GitHub did not deploy the old URL guard. The user prefers automated deployment. Record this gap for a separately approved, safely scoped automatic Edge release workflow to the existing project/functions with tests/rollback and secure credentials; do not assume Vercel or an unrelated admin checkpoint deploys Edge code. No new release automation, credential change or mobile bundle was created here.

### Scraper-Only Test Authorization and Manitoba Time — November 13, 2026 (15:45 onward)

The owner approved one live scraper-only test, explicitly no generation/n8n/public posts. This later approval permits one isolated invocation, superseding the prior no-manual-scraper boundary only for that test. Source has no direct publisher call, but its three write tables must have live hooks/publication consumers checked before invocation. No request or retry has occurred. The connected My Browser tab redirects to Supabase sign-in while the owner's Work-profile screenshot is healthy; do not repeatedly ask for login or infer backend outage. Provide the read-only `docs/testing/SCRAPER_ONLY_TRIGGER_CHECK.sql` through the healthy owner tab, review results, then invoke once only if isolation is established. GET is not a safe probe because scraper ignores method. Read `docs/SCRAPER_ONLY_TEST_2026-11-13.md`.

Official Manitoba sources confirm permanent UTC−5 effective October31,2026, now Manitoba Standard Time/MBT; the owner is correct and Manitoba did not fall back November1. Chicago is UTC−6. Observed11AMChicago equals noonManitoba; old DST data may cause one-hour error, not the five-hour Chicago label gap. VPN exit does not set servercron. Actual trigger/cron and workflow/instance timezone need read-only inspection before timing edits; label6AMCDT is not configuration. No schedule changes authorized/performed. Full sourced notes are in private hub `docs/evidence/2026-11-13-scraper-only/`; Build108 unchanged.

**Live scraper-only test completed16:05 Manitoba time, superseding pending status above:** owner SQL results showed0 noninternal triggers and no publications on all3 write tables. Current app publicanon client credential passed read-only auth-settings check without key disclosure. Exactly1directPOST to the existing scraper returnedHTTP200, success:true, articles_saved:10 in5.376s; no duplicate exception. No generator/n8n/publisher invocation or retry occurred. Read-only Upload-Post snapshot through21:06:44UTC showed0history/0in-progress during test window in currentaccount. Save sanitized evidence/privatehub and main `docs/SCRAPER_ONLY_TEST_2026-11-13.md`. Do NOTrepeat this one-shot test or demand anotherlogin; accessblocker was resolved. Source/service/scoring quality and downstream full publication remain distinct; six-platform pipeline is not cleared. Next: actual ScheduleTrigger Parameters and workflowtimezone screenshots/read-only evidence, then separately approved no-publish generator/assembly verification. Existingnormalpipeline may use10newarticles later. Build108 unchanged.

**Schedule configuration confirmed16:14, correction NOT applied:** owner Parameters screenshot shows valid5-field cron `0 11 * * *`; workflow Settings explicitly `America/Chicago`. This runs11AMChicago/noonManitoba in winter, not6AM; node name is mislabeled. Not a malformedcron, VPN effect or need for clocks to adjust. Proposal awaiting specific approval: existingworkflow timezone `Etc/UTC`, retain fullcron `0 11 * * *`, renameclocknode `Daily Schedule Trigger (6 AM Manitoba / MBT)`, save/publish only, no manualexecution/backfill/newtrigger/globalTZchange.11UTC equals6Manitoba year-round. Preserve error-handler/success/failure/manual-save settings and check sameworkflow's timezone-dependent expressions. Read `docs/N8N_SCHEDULE_FINDINGS_2026-11-13.md`. Settings mismatch explains observed late time, not missing six-platform publications by itself.

**Schedule correction owner-confirmed Published16:29, superseding pending approval/status above:** exact change approved16:19; owner Saved16:25 with screenshots of `Etc/UTC` and unchanged `0 11 * * *`. Owner then reports Published and editor screenshot shows Published plus renamed `Daily Schedule Trigger (6 AM Manitoba / MBT)`. Existingworkflow only; no manualrun/retry/backfill/globalTZchange. Next expected start November14,2026 11UTC /6AMManitoba. This is owner-controlled configuration/publication evidence, not a scheduled execution or six delivered posts. Save `docs/N8N_SCHEDULE_FINDINGS_2026-11-13.md` and private `docs/evidence/2026-11-13-schedule/`. Next normal-run verification must inspect firstfailure/scraper/generation/assembly and six terminal provider outcomes; generic green/success:true is insufficient. No monitoring/reminder configured; do not promise automatic follow-up. Scraper one-shot pass remains valid; payments/reports/web-phone realauth/analytics stillopen. Build108unchanged.

---

## 🗂️ Repository Structure (Confirmed May 16, 2026)

| Repo | URL | Deployed At | Purpose |
|---|---|---|---|
| **yfitai/yfit-app** | github.com/yfitai/yfit-app | app.yfitai.com | Main app — React + Capacitor + Vercel serverless functions |
| **yfitai/yfit-marketing** | github.com/yfitai/yfit-marketing | www.yfitai.com | Marketing landing page — React + tRPC + Manus hosting |
| **yfitai/yfitai-yfit-video-service** | github.com/yfitai/yfitai-yfit-video-service | Railway | AI video generation — Node/Express + ffmpeg + ElevenLabs |
| **yfitai/yfit-admin** | github.com/yfitai/yfit-admin | Separate | Backend-only — accounting, Stripe sync, analytics, email reports |

**Decision (May 16, 2026):** Keep all 4 repos separate. Do NOT consolidate. Each serves a distinct purpose and deployment target.

---

## 🌐 Live URLs

| Service | URL | Notes |
|---|---|---|
| Main App (web) | https://app.yfitai.com | Primary user-facing app |
| Marketing Site | https://www.yfitai.com | Landing page, pricing, language switcher |
| Old Deploy URL | https://yfit-deploy.vercel.app | Still active — live update bundles served from here |
| GitHub | https://github.com/yfitai | Org account |
| Vercel Dashboard | https://vercel.com/yfit-ai | Both yfit-app and yfit-marketing projects |

---

## 🏗️ Architecture: How the App Actually Updates

This is critical to understand before making any changes.

### Two Deployment Layers

**Layer 1 — Vercel Static Build** (the shell)
- Built from `yfit-app` repo on every push to `main`
- Deployed to `app.yfitai.com`
- Contains the Capacitor WebView wrapper, CSP headers, and base HTML
- The `vercel.json` must NOT have `"outputDirectory": "dist"` — this was the bug fixed May 16, 2026

**Layer 2 — Capawesome Live Update Bundle** (the app content)
- Built manually by running `pnpm build` then creating `bundle.zip` from `dist/`
- Stored at `public/updates/bundle.zip` in the repo
- Served from `https://yfit-deploy.vercel.app/updates/bundle.zip`
- The Capacitor app downloads this bundle on launch and runs it instead of the Vercel build
- **This is what users actually see on their phones**
- Current live bundle: **Build 96** (May 16, 2026)

### Build Number Tracking
The bundle version is tracked in `public/updates/bundle.json`:
```json
{ "version": 96, "url": "https://yfit-deploy.vercel.app/updates/bundle.zip" }
```
Increment this number every time a new bundle is created.

### How to Deploy a Change to the App
1. Make code changes in `/tmp/yfit-app-full/src/` or relevant files
2. Run `cd /tmp/yfit-app-full && pnpm build`
3. Create bundle: `cd dist && zip -r ../public/updates/bundle.zip . && cd ..`
4. Update version in `public/updates/bundle.json` (increment number)
5. Commit and push: `git add -A && git commit -m "Build XX: description" && git push`
6. Wait ~3 minutes for Vercel to deploy
7. Force-close and reopen the app on device to trigger update

---

## 🔑 Environment Variables & API Keys

### Vercel — yfit-app project
| Variable | Purpose | Status |
|---|---|---|
| `USDA_API_KEY` | Food search (USDA FoodData Central) | Managed only in Vercel `yfit-app` Environment Variables |

**Credential rule:** Never store or record USDA API key values in source code, documentation, or chat. Create replacement keys at https://fdc.nal.usda.gov/api-key-signup.html and add them only in Vercel Environment Variables.

**Architecture rule:** The browser and mobile client must call the `app.yfitai.com` proxy only. Do not create a `VITE_USDA_API_KEY` frontend fallback or configure a duplicate food-search proxy in a different Vercel project.

---

## 🍎 Food Search Architecture (Fixed May 16, 2026)

### How Food Search Works
1. User types in search box → `foodDatabase.js` is called
2. `foodDatabase.js` calls `https://app.yfitai.com/api/food/search` (USDA) or `https://app.yfitai.com/api/food/search-openfoodfacts`
3. Vercel serverless function at `api/food/search.js` calls USDA FoodData Central API
4. Results returned to app

### Bugs Fixed May 16, 2026
1. **`vercel.json` had `"outputDirectory": "dist"`** — this prevented ALL serverless functions from deploying. Removed.
2. **`foodDatabase.js` pointed to `yfit-deploy.vercel.app`** — updated to `app.yfitai.com`
3. **`api/food/search.js` sent `Accept: application/json` header** — USDA API rejects this intermittently. Removed.
4. **No retry logic** — added 3-attempt retry with 300ms/600ms backoff to both `search.js` files
5. **CSP blocked `app.yfitai.com`** — `index.html` CSP `connect-src` did not include `*.yfitai.com`. Added.
6. **USDA API key rate-limited from Vercel IPs** — added dedicated `USDA_API_KEY` env var to both Vercel projects

### Food Search Translation Decision (May 16, 2026)
- **Food names stay in English** — USDA only provides English names. This is standard practice (same as MyFitnessPal).
- **UI labels (buttons, macros, serving sizes) are translated** — already working.
- **No AI translation of food names for now** — can be added later as a separate feature.

---

## 🌍 Multilingual Support

### App (yfit-app)
- **Languages supported:** English, French, Spanish, Portuguese, Chinese (Simplified), Hindi, German, Japanese, Arabic, Korean, Italian, Russian, Japanese
- **Translation file:** `src/lib/i18nResources.js`
- **Structure:** One large object with language codes as top-level keys (`en`, `fr`, `es`, `pt`, `zh`, `hi`, `de`, `ja`, etc.)
- **CRITICAL:** All strings in the `"en"` section must be in English. Previous bugs had French and Chinese strings accidentally placed in the English section.

### Translation Bugs Fixed May 16, 2026
All were in the `"en"` section of `i18nResources.js`:

| Key | Was (wrong) | Now (correct) |
|---|---|---|
| `selectExercise` | 选择要追踪的练习 (Chinese) | Select exercises to track |
| `workoutDetails` | Détails de l'entraînement (French) | Workout Details |
| `workoutName` | Nom de l'entraînement (French) | Workout Name |
| `addExercise` | Ajouter un exercice (French) | Add Exercise |
| `saveWorkout` | Enregistrer l'entraînement (French) | Save Workout |
| `noExercisesAdded` | Aucun exercice ajouté pour l'instant (French) | No exercises added yet |
| `minReps` | Rép. min (French) | Min Reps |
| `maxReps` | Rép. max (French) | Max Reps |
| `restSec` | Repos (sec) (French) | Rest (sec) |
| `exerciseName` | Nom de l'exercice (French) | Exercise Name |
| `reset` | Réinitialiser (French) | Reset |
| `notesPlaceholder` | Des notes sur aujourd'hui... (French) | Notes about today... |
| `rollingAverage` | Moyenne glissante — aujourd'hui moins 7 jours (French) | Rolling average — today minus 7 days |
| `lastMeasured` | Dernière mesure : (French) | Last measured: |

### Plate Scan Button Fix (May 16, 2026)
- **Problem:** `NutritionEnhanced.jsx` had `"Plate Scan"` hardcoded in JSX instead of using `t('nutrition.plateScan.plateScan')`
- **Fix:** Changed to use the translation key. Chinese translation `餐盘扫描` was already in the file.

### `label_serving` Display Fix (May 16, 2026)
- **Problem:** When food logged via barcode, serving size showed raw key `label_serving` instead of friendly text
- **Fix:** Now displays `"label serving"` (en) / `"标签份量"` (zh)

### Marketing Site (yfit-marketing)
- **Languages:** English, French, Spanish, Portuguese, Chinese, Hindi, German, Japanese (8 total)
- **i18n library:** react-i18next with LanguageDetector
- **Language switcher:** Globe icon in top nav — `client/src/components/LanguageSwitcher.tsx`
- **Translation file:** `client/src/lib/i18n.ts` (all 8 languages inline)
- **Language detection order:** localStorage → browser navigator

---

## 📱 Social Media Automation

### Current Setup
- **Platform:** n8n workflow (self-hosted or cloud) — `YFIT Social Media Automation v2` (workflow ID: `h7bRds9UOUfmP36F`)
- **Video generation:** Railway service (`yfitai-yfit-video-service`) — Node/Express + ffmpeg + Pexels + ElevenLabs
- **Platforms posting to:** TikTok, Instagram, YouTube Shorts, Facebook, Pinterest, LinkedIn (6 total)
- **Current language:** English only
- **Content angle:** Personal story — GPT-4 writes from first-person "I used to struggle..." perspective
- **Workflow version:** v3.7.0 (deployed May 18, 2026)

### Platform-Specific Caption CTAs (v3.7.0)

| Platform | Caption CTA | First Comment (via Upload-Post) |
|---|---|---|
| TikTok | `👉 Link in bio → yfitai.com` | `👉 Try YFIT AI free → https://yfitai.com` |
| Instagram | `🔗 Link in bio → yfitai.com` | `🔗 Get your free AI fitness plan → https://yfitai.com` |
| YouTube | `⬇️ Try YFIT AI free → https://yfitai.com` | `⬇️ Try YFIT AI free → https://yfitai.com` |
| LinkedIn | `🚀 Try YFIT AI free → https://yfitai.com` | `🚀 Try YFIT AI free → https://yfitai.com` |
| Pinterest | `📌 Get your personalised AI fitness plan → https://yfitai.com` | `📌 Get your personalised plan → https://yfitai.com` |
| Facebook | `💪 Try YFIT AI free — comment below or search "YFIT AI"` (NO URL in caption — FB reach penalty) | `💪 Try YFIT AI free → https://yfitai.com` |

**Key design decisions:**
- TikTok and Instagram: URL is NOT in the caption (platform algorithms deprioritise posts with links). The link is delivered via first comment only.
- Facebook: Same — URL in first comment only, caption uses soft CTA without URL.
- YouTube, LinkedIn, Pinterest: Full URL in both caption and first comment (these platforms do not penalise links).
- `first_comment` is delivered via Upload-Post's native `first_comment` parameter (posts immediately after video goes live).

### GPT-4 Content Prompt — Personal Story Angle (v2.1.0)

The `generate-social-content` Supabase Edge Function was updated to write from a **first-person personal story** perspective:

- Story arc: **struggle → discovery → transformation → YFIT as the tool**
- Opener style: "I used to think crunches were the answer. Then I found out they were making things worse..."
- NOT: "Did you know..." or "Here are 5 tips..." (generic informational — avoid)
- Each platform gets a distinct tone, length, and hook style (see CTA table above)
- Voiceover script: 60-90 seconds, first-person, ends with soft spoken CTA

**Function file:** `/home/ubuntu/yfit-updates/generate-social-content/index.ts`
**Deploy:** Paste into Supabase Dashboard → Edge Functions → `generate-social-content` → Edit

### Multilingual Social Media — Decision Pending (May 16, 2026)
User is considering adding multilingual captions to social posts. Plan discussed:

**Phase 1 (Captions only — ~2 hours):**
- Update GPT-4 content generation prompt to output captions in all 8 languages simultaneously
- Stack captions in posts with flag emoji separators (🇺🇸 🇫🇷 🇪🇸 🇧🇷 🇨🇳 🇮🇳 🇩🇪 🇯🇵)
- Platform-specific rules: LinkedIn = English only; Pinterest = EN/ES/PT only; all others = all 8
- Platform language targeting is handled by platform algorithms — no manual routing needed

**Phase 2 (Translated audio — ~3-4 hours, after Phase 1 stable):**
- Generate separate voiceovers via ElevenLabs for ES, PT, ZH, HI
- Separate video per language for those 4 languages
- English + 4 language videos = 5 videos per cycle

**Status:** User requested time to think. Do NOT start implementation until confirmed.

### Resend Email (yfit-marketing)
- **Purpose:** Internal reports only — weekly analytics PDF, monthly accounting PDF
- **Recipient:** support@yfitai.com
- **Key type:** Sending-only (restricted) — returns 401 on `/domains` endpoint, which is expected and correct
- **NOT connected to social media pipeline yet** — can be added as post-confirmation notification

---

## 🔧 vercel.json — Critical Configuration

### yfit-app (app.yfitai.com)
```json
{
  "buildCommand": "CI=false npm run build",
  "framework": "vite",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [...]
}
```
**DO NOT add `"outputDirectory": "dist"`** — this breaks all serverless functions.

### yfit-marketing (www.yfitai.com)
- Managed by Manus hosting — do not manually edit vercel.json

---

## 📋 Session Start Checklist (RULES — READ EVERY SESSION)

When starting a new session, always:

1. **Read this file first** before making any changes — do NOT skip this step
2. **Check which repo you are working in** — there are 4 repos and they are COMPLETELY SEPARATE. Never mix them up:
   - `/home/ubuntu/yfit-app-full` → `yfitai/yfit-app` → deploys to `app.yfitai.com` (main app)
   - `/home/ubuntu/yfit-marketing` → **THIS IS ACTUALLY `yfitai/yfit-admin`** (accounting, analytics, weekly reports) — the local folder name is WRONG/MISLEADING
   - `yfitai/yfit-marketing` → `www.yfitai.com` marketing site — NOT cloned locally, managed via Manus UI
   - `yfitai/yfitai-yfit-video-service` → Railway video service — NOT cloned locally
   - **NEVER save Manus webdev checkpoints for `yfit-admin` work** — it is a separate GitHub repo, not a Manus project
3. **Check the current bundle build number** before creating a new bundle: `cat public/updates/bundle.json`
4. **Do not add `outputDirectory` to vercel.json** — this was the root cause of the food search outage
5. **Test food search** at `https://app.yfitai.com/api/food/search?query=apple` before and after any API changes
6. **For translation fixes** — always check which language section the string is in before editing `i18nResources.js`

> **MONOPRO STRUCTURE:** All main app work happens in `/home/ubuntu/yfit-app-full` (the `yfitai/yfit-app` monorepo). This is the single source of truth for the app. Admin/analytics work happens in `/home/ubuntu/yfit-marketing` (confusingly named — it is actually `yfitai/yfit-admin`). When in doubt, check `git remote -v` to confirm which GitHub repo you are in.

---

## 📝 Session Change Log

### August 11, 2026

**Google Sign-In — Google First, Email Fallback (Build 108):**
- Re-ran `start-work.sh`, confirmed Build 106 was live before changes, and read this reference before editing.
- Confirmed prior provider setup remains documented as active: Supabase Google provider is enabled for project `mxggxpoxgqubojvumjlt`, with callback URL `https://mxggxpoxgqubojvumjlt.supabase.co/auth/v1/callback`.
- Found that Google OAuth was already implemented and used in `src/components/GuestSignUpModal.jsx`, but the primary `/login` and `/signup` screen (`src/components/Auth.jsx`) offered only email/password.
- Added a reusable Google button and hardened `handleGoogleSignIn()` to the primary Auth component. Both Sign In and Sign Up now show **Continue with Google** first, above a clear divider. Unexpected browser or network failures restore the form and show a safe error.
- Kept email/password below the divider as a fallback. **Decision:** do not remove email authentication yet, because existing users and account recovery need a working fallback until the Google flow is fully verified in production.
- Redirect after Google OAuth: `${window.location.origin}/dashboard`; this is recognized by `App.jsx` through the existing `supabase.auth.onAuthStateChange` handler.
- Local production preview confirmed the button, divider, and email fallback render correctly. `npm run build` passed. `npm run lint` remains blocked by 334 pre-existing repository-wide lint errors, none reported in `Auth.jsx`.
- Live OAuth handoff is pending user-authorized browser testing after Vercel deployment. Do not mark it complete until a real Google account reaches the dashboard successfully.
- Supporting audit: `docs/GOOGLE_AUTH_AUDIT_2026-08-11.md`.

**Next action:** after Vercel deployment completes, open `https://app.yfitai.com/login`, select **Continue with Google**, and complete the Google account selection. Confirm the browser returns to the YFIT dashboard.

**Google Branding Verification — Approved:**
- The unauthenticated OAuth redirect test reached Google successfully using the expected YFIT OAuth client and Supabase callback. It exposed stale published branding: **ROGA Drone Website** and `rogadrone.com` policy links.
- In the existing Google Cloud project (internally still named **ROGA Drone application**, project number prefix `668225302369`), the active OAuth branding was updated to YFIT AI. App homepage, Privacy Policy, Terms, authorized domains, logo, and developer contact now use YFIT assets and `yfitai.com`.
- Verified `yfitai.com` ownership in Google Search Console with a new GoDaddy DNS TXT record. **Do not remove this TXT record.** No existing DNS or Google Workspace SPF settings were altered.
- Submitted a manual Google branding appeal after the automatic check referenced the pre-verification state. Google subsequently **approved** YFIT AI OAuth brand verification for project `southern-flash-298120`; no sensitive/restricted scope review is required.
- Final verification questionnaire answers: **No** for personal-only, internal-only, development/testing-only, and WordPress Gmail SMTP plugin-only usage. The app is a public production YFIT AI service using standard Google identity scopes only.
- `support@yfitai.com` was added to the Google Cloud project as a least-privilege **Viewer** and remains the developer contact. Viewer access did not make it selectable as the consent-screen User support email, so the approved public support-email field remains `don@rogadrone.com`. Do not escalate the shared account merely to change this field.
- The user confirmed the former callback error was resolved after the Site URL and redirect allow-list correction. A routine end-to-end dashboard landing check remains advisable after a normal Google account sign-in.

**Google OAuth Callback Fix — August 12, 2026:**
- Google’s branding review was approved for Google Cloud project `southern-flash-298120` (project number `668225302369`).
- A real sign-in then returned `{"error":"requested path is invalid"}`. Root cause: Supabase Auth → URL Configuration was still set to the retired Vercel address and did not allow the active custom domain.
- Corrected Supabase Auth URL Configuration manually in the dashboard:
  - **Site URL:** `https://app.yfitai.com`
  - **Redirect URLs:** added `https://app.yfitai.com/**`
  - Retained the existing old Vercel and localhost redirect entries for backwards compatibility.
- User retested after saving and confirmed the error was resolved. Google-first sign-in is now functional through the current app domain.

**Supabase Usage Status — August 12, 2026:**
- The post-grace-period banner is informational: it means free-plan quotas are now enforced, not that YFIT is currently over quota.
- Current billing cycle usage was healthy: **Storage 0.145 / 1 GB (14%)**, **Database 0.061 / 0.5 GB (12%)**, **Egress 0.009 / 5 GB (<1%)**, and **Edge Function invocations 4,294 / 500,000 (<1%)**.
- The prior emergency storage deletion and daily `storage-cleanup` Edge Function are working. Do not delete further data or upgrade solely because of the generic grace-period banner.

### August 13, 2026 — Five-Quarter Accounting Draft

- Created a draft internal report at `yfit-admin/reports/YFIT_QUARTERLY_ACCOUNTING_Q2_2025_TO_Q2_2026.md` for calendar quarters **Q2 2025 through Q2 2026**.
- CIBC expense data is sufficient from the stated June 2, 2025 start of business activity. The uploaded June 2026 CIBC file was checked but **not imported** because its two expense rows were already present and its June 30 entry was a card payment, preventing duplicate expenses.
- Historical Stripe sync (April 2025–June 2026) found two March 2026 charges: one fully refunded $13.64 USD charge and one retained $104.99 USD charge. The report reflects $165.25 CAD gross, $19.00 CAD refunds, $5.63 CAD estimated Stripe fees, and $140.62 CAD net Stripe revenue in Q1 2026.
- Five-quarter imported CIBC expenses total **$11,743.21 CAD**. Provisional GST ITCs total **$559.33 CAD**; these remain subject to professional tax validation because the importer assumes embedded 5% GST for records marked eligible.
- Before tax filing or CPA reliance: retain supporting statements and invoices, confirm ineligible/non-Canadian GST claims are excluded, confirm Stripe’s transaction-date FX and actual fees, and confirm any GST collected outside the current Stripe Tax import.
- Produced and visually verified the internal PDF record at `yfit-admin/reports/YFIT_QUARTERLY_ACCOUNTING_Q2_2025_TO_Q2_2026.pdf`. The PDF is a draft accounting record and retains the provisional GST/ITC and review disclosures.
- Subsequent review update: the user confirmed all imported CIBC transactions had been reviewed and accepted. Database review-status flags were aligned without changing financial values: **101 of 101** expenses are now marked reviewed. Q4 2025 was independently reconciled to **$5,565.96 CAD** in expenses and **$265.08 CAD** in provisional ITCs across 30 transactions. The accounting PDF and Markdown report were refreshed to remove the obsolete unreviewed-transaction warning while retaining professional tax-validation cautions.
- **End-work status:** `yfit-app` and `yfit-admin` were pushed to GitHub after the accounting refresh. The current accounting-report commit is `82d5ca9`; the main-reference update should be committed before closing this session.

---

### July 27–28, 2026

**Supabase Storage Cleanup — Fully Automated (Replaces n8n):**

**Emergency Manual Cleanup:**
- Deleted 158 files (~271 MB) from `yfit-videos` and `yfit-voiceovers` buckets via Python script
- Script: `/tmp/cleanup_both_buckets.py` (for reference only — not needed going forward)
- Actual live storage after cleanup: ~88 MB. Billing meter may show elevated for 24-48h while Supabase garbage-collects soft-deleted objects.

**New Supabase Edge Function `storage-cleanup` (replaces n8n):**
- Deployed to Supabase project `mxggxpoxgqubojvumjlt` via Supabase CLI v2.110.0
- Source: `/home/ubuntu/yfit-supabase/supabase/functions/storage-cleanup/index.ts`
- Also saved to this repo at `supabase/functions/storage-cleanup/index.ts`
- Function URL: `https://mxggxpoxgqubojvumjlt.supabase.co/functions/v1/storage-cleanup`
- Cleans both `yfit-videos` and `yfit-voiceovers` buckets of files older than **7 days**
- Handles subdirectory prefixes: `videos/`, `captions/`, `thumbnails/`, and root
- Paginated (100 files per batch) — handles large buckets safely
- Live test result: deleted 3 files (2 from yfit-videos, 1 from yfit-voiceovers), no errors

**pg_cron Schedule:**
- Job name: `yfit-storage-cleanup`
- Schedule: `0 3 * * *` (3:00 AM UTC daily)
- Job ID: 41, Status: active
- Created via Supabase Management API using PAT (see Supabase Dashboard → Account → Access Tokens)
- Script used: `/tmp/create_cron_job.py`
- The cron job calls the Edge Function via `net.http_post()` with the service role key in the Authorization header

**n8n Workflow — Deprecated:**
- The `YFIT Daily Video Storage Cleanup` n8n workflow is now superseded by the Edge Function
- Root causes identified (documented July 19): missing Supabase credential + GET instead of POST on List node
- These were fixed but n8n is no longer the cleanup mechanism — do NOT attempt to re-fix or re-enable it
- n8n URL: https://n8n-railway-production-fbfd.up.railway.app (can be disabled/deleted)

**Supabase CLI — Installed:**
- Version: v2.110.0 at `/usr/local/bin/supabase`
- Project linked at `/home/ubuntu/yfit-supabase/` (project ref: `mxggxpoxgqubojvumjlt`)
- PAT for CLI: stored in Supabase Dashboard → Account → Access Tokens (token name: "yfit-cli")
- To redeploy the Edge Function: `cd /home/ubuntu/yfit-supabase && supabase functions deploy storage-cleanup`

**Google OAuth Consent Screen — Completed (July 27):**
- App name: **YFIT AI** (changed from "ROGA Drone application")
- Logo: YFIT blue logo uploaded (119 KB PNG, compressed from original)
- Authorized domains: `yfitai.com` (replaced `rogadrone.com`)
- Application home page: `https://yfitai.com`
- Application privacy policy: `https://yfitai.com/privacy`
- Application terms of service: `https://yfitai.com/terms`
- Google OAuth Client ID: `668225302369-sui51m1bkbo706pku73sfjv1ais9srul.apps.googleusercontent.com`
- Verification status: branding changes pending re-verification by Google. OAuth login continues to work during review.

---

### August 6–7, 2026
**Steps Chart — Bar to Line (Build 104, earlier session):**
- Changed steps chart in Progress page from BarChart to LineChart (already logged in July 31 entry)

**Weekly Analytics — Investigated and Confirmed Working:**
- Social media numbers (reach, impressions, engagement) are real and changing week to week
- Website visitors section has always shown 0 — Umami API blocks server-side calls by IP
- Decision: Remove website section from reports (done July 31). Add GA4 when traffic campaigns begin.
- Reports confirmed arriving at support@yfitai.com every Monday 6 AM CDT as PDF

**CRITICAL DISCOVERY: Marketing Site Is Inside yfit-app (NOT a separate repo):**
- `www.yfitai.com` is served by the same Vercel `yfit-app` project as `app.yfitai.com`
- Source: `yfitai/yfit-app` → `src/pages/LandingPage.tsx`
- Go page: `src/pages/GoPage.tsx`
- i18n translations (ALL 8 languages): `src/lib/i18nResources.js` — edit THIS, not JSON files
- App tour component: `src/components/AppTourSection.tsx`
- `yfitai/yfit-marketing` GitHub repo is stale (May 2026) — do NOT edit it
- This discovery is now documented in `yfit-ai/README.md`, `yfit-ai/app/README.md`, `yfit-ai/marketing/README.md`

**Fixed Broken Translation Keys on www.yfitai.com (Build 106):**
- `landing.appTour.ctaBtn` and `landing.appTour.ctaNote` were missing from English translations
- Fixed in `src/lib/i18nResources.js` — added after the `screens` object in the `appTour` section
- Values: ctaBtn = "Try YFIT Free — No Credit Card", ctaNote = "Free plan available · Cancel anytime · Available in 8 languages"
- Committed: `9ab54ce`

**Completed 3-Step Social Funnel:**
- Social post → `app.yfitai.com/go` → `www.yfitai.com` → `app.yfitai.com/signup`
- Go page already had "Full Site ↗" button pointing to `yfitai.com` (no change needed)
- Added "Explore the app first — no account needed →" link below hero CTAs on `LandingPage.tsx`
- Committed: `9ab54ce`

**yfit-admin → GitHub Sync Established:**
- Added GitHub as a second remote on `/home/ubuntu/yfit-marketing` (yfit-admin)
- `end-work.sh` now automatically pushes yfit-admin to `yfitai/yfit-admin` on GitHub every session end
- 2 commits synced: marketing redesign + analytics report fix

**Monopro Hub (yfit-ai) Restored and Updated:**
- `yfit-ai/README.md` — complete rewrite with current repo map, 6 rules, funnel diagram, infrastructure table
- `yfit-ai/app/README.md` — updated with marketing-inside-app discovery
- `yfit-ai/marketing/README.md` — updated with warning that source is in yfit-app
- Committed to yfit-ai: `44665fe`

**start-work.sh Updated (now 7 steps):**
- Step 6 now clones/pulls `yfit-ai` monopro hub at session start
- Repo map in terminal output now shows `www.yfitai.com` is inside `yfit-app`
- Rule 6 updated: edit `src/lib/i18nResources.js`, not JSON files
- Committed: `1d56f5d`

**Next Session TODO:**
- Set up Google sign-in (Supabase OAuth + Auth.jsx button — need Google Cloud Console credentials)
- Compare Google Analytics vs current admin analytics approach
- Review social media strategy for improving page visits (currently 0 despite 7K+ weekly reach)

---
### July 31, 2026

**Steps Chart — Fixed (Build 104):**
- Changed steps chart in Progress page from `BarChart` to `LineChart` matching all other progress charts
- Same style: `type="monotone"`, `strokeWidth={2}`, `dot={{ r: 4 }}`, `activeDot={{ r: 6 }}`, purple `#9333ea`
- File: `src/components/Progress.jsx`
- Committed: `b87e087`

**Go Page — Improvements (Build 105):**
- "Explore the app first — no sign-up needed" promoted to large primary teal button at top of CTA section
- Added interactive "See it in action" feature preview tabs (Dashboard, Nutrition, Workout, Meds, Progress)
- Each tab shows a live mock of the screen with a "Try this feature live" link
- File: `src/pages/GoPage.tsx`
- Committed: `cd51cc9`

**Weekly Analytics Reports — Fixed (yfit-admin):**
- Removed broken "Website Analytics — yfitai.com" section (always showed 0 — Umami IP restriction blocks server-side API calls)
- Executive Summary now shows: Total Engagement, Total Followers, Profile Views instead of website metrics
- AI analysis prompt updated to focus purely on social media performance
- Files: `server/reportGenerator.ts`, `server/analyticsRouter.ts`
- Committed to yfit-admin: `118aff4`
- Decision: Will add GA4 when traffic campaigns begin. No point tracking zero visits.

**CRITICAL: Repo Confusion — Permanent Fix Applied:**
- Root cause: `/home/ubuntu/yfit-marketing` local folder is actually `yfitai/yfit-admin` repo — misleading name
- Session Start Checklist (Rules) updated with explicit repo-to-folder mapping and MONOPRO note
- Committed: `5061d20`
- See Rules section above for the full clarification

**Permanent Fix Proposal — Sandbox Loss Problem:**
- The sandbox resets between Manus sessions, losing all local files not in GitHub
- Current mitigation: everything important is in GitHub repos (`yfit-app`, `yfit-admin`)
- Remaining risk: any files created locally but not committed are lost on sandbox reset
- **Action required:** At end of every session, confirm `git status` is clean in both repos before closing
- **Future improvement to consider:** Create a `setup-sandbox.sh` script in `yfit-app` that clones all 4 repos, installs deps, and restores the full working environment in one command — so any new sandbox can be restored in under 5 minutes

---

### July 19, 2026

**Supabase Storage Overage — Root Cause Fixed:**
- Problem: Supabase storage at 164% (1.639 GB vs 1 GB free tier limit). Grace period until Aug 7, 2026.
- Root cause: n8n `YFIT Daily Video Storage Cleanup` workflow (ID: `iS3cHV7jGazlktNy`) had been failing every day at 3:30 AM UTC because the Supabase credential was missing from n8n entirely.
- Secondary bug: The `List Videos in Bucket` node was using GET — Supabase Storage requires POST to list objects. This caused a "Bad request" error even after the credential was added.
- Fixes applied:
  1. Created new `Supabase API` Header Auth credential in n8n with the project service role key (header name: `apikey`).
  2. Updated `List Videos in Bucket` node from GET → POST with correct JSON body `{"prefix": "", "limit": 1000}`.
  3. Manually deleted 47 files older than 7 days (~308 MB) via Python script to bring active storage down immediately.
  4. Tested workflow manually — ran successfully, returned "No files older than 14 days found" (correct, since old files were just deleted).
- Active file count after cleanup: ~34 files (~198 MB). Storage meter may show elevated for up to 24h while Supabase garbage-collects.
- **Verify tomorrow:** Check Supabase usage at https://supabase.com/dashboard/org/meolkwuopgeironzqodt/usage to confirm storage dropped below 1 GB.

**Supabase Service Role Key (stored in n8n):**
- Key starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ...`
- If n8n credential is lost again, retrieve from: Supabase Dashboard → Project Settings → API Keys → service_role

**Google OAuth — Verified Working:**
- Tested `Continue with Google` button on https://yfit-deploy.vercel.app — redirects correctly to Google OAuth, callback goes to `mxggxpoxgqubojvumjlt.supabase.co/auth/v1/callback`. Flow is functional.
- **Verify tomorrow:** Complete a full sign-in with a real Google account to confirm the callback completes and user lands in the app.

**Google Cloud Console OAuth Branding — Updated:**
- App name changed from "ROGA Drone application" → **"YFIT AI"**
- Logo uploaded (YFIT blue logo, 119 KB PNG, 512×341px)
- Application home page: `https://yfitai.com`
- Application privacy policy: `https://yfitai.com/privacy`
- Application terms of service: `https://yfitai.com/terms`
- Authorized domain 2 changed from `rogadrone.com` → `yfitai.com`
- User support email: `don@rogadrone.com` (only Google-account-linked emails available in dropdown — `support@yfitai.com` requires Google Workspace setup to appear)
- Developer contact email: updated from `rogadroneemployee@gmail.com`
- Verification status: branding changes pending re-verification by Google. OAuth login continues to work during review.
- Google Cloud project name still shows "ROGA Drone application" in the top bar — this is the project name, not the OAuth app name, and does NOT affect users.

**Supabase Google OAuth Provider — Configured:**
- Google provider enabled in Supabase Auth → Providers → Google
- Client ID: `668225302369-sui51m1bkbo706pku73sfjv1ais9srul.apps.googleusercontent.com`
- Callback URL confirmed: `https://mxggxpoxgqubojvumjlt.supabase.co/auth/v1/callback`
- Skip nonce check: OFF (correct for web apps)
- Allow users without email: OFF (correct)

### May 18, 2026

**Social Media Pipeline — v3.7.0 (6 Platform CTAs + First Comment + Personal Story):**
- Updated  n8n node (v3.7.0):
  - TikTok: caption CTA = "👉 Link in bio → yfitai.com" (no URL in caption)
  - Instagram: caption CTA = "🔗 Link in bio → yfitai.com" (no URL in caption)
  - YouTube: full URL in caption + first comment
  - LinkedIn: full URL in caption + first comment
  - Pinterest: full URL in caption + first comment
  - Facebook: NO URL in caption (avoids reach penalty) — URL in first comment only
  - Added  — all 6 platforms now post link as first comment
- Added  body parameter to  n8n node
  - Uses Upload-Post native feature — posts comment immediately after video goes live
- Updated  Supabase Edge Function (v2.1.0):
  - GPT-4 prompt now writes from first-person personal story perspective
  - Story arc: struggle → discovery → transformation → YFIT as the tool
  - Each platform gets distinct tone, length, hook style
- Checked TikTok bio link (visible on profile page)
- Instagram bio link requires manual check (login required)
- All changes committed to yfit-app GitHub repo

### May 16, 2026

**Food Search — Complete Fix (6 bugs resolved):**
- Removed `outputDirectory` from `vercel.json` → serverless functions now deploy
- Updated `foodDatabase.js` URLs from `yfit-deploy.vercel.app` to `app.yfitai.com`
- Removed `Accept: application/json` header from `api/food/search.js` (caused intermittent 400s)
- Added 3-attempt retry logic to both `search.js` files
- Added `https://*.yfitai.com` to CSP `connect-src` in `index.html`
- Added `USDA_API_KEY` env var to the active Vercel project
- Built and deployed live update bundles 93, 94, 95, 96

**Translation Fixes:**
- Fixed 14 French strings accidentally in English section of `i18nResources.js`
- Fixed 1 Chinese string (`selectExercise`) in English section
- Fixed `Plate Scan` button hardcoded text in `NutritionEnhanced.jsx`
- Fixed `label_serving` raw key display in logged meals list

**Architecture Decisions:**
- Confirmed: Keep all 4 repos separate (yfit-app, yfit-marketing, video-service, yfit-admin)
- Confirmed: Food names stay in English (USDA limitation — same as all major fitness apps)
- Pending: Multilingual social media captions (user thinking)

### January 13, 2026
- Removed demo mode (26 files, ~200 references)
- Fixed date picker truncation on Android
- Created AUTOMATION_REFERENCE.md

### August 23, 2026

**Nutrition Food Search — Restored:**
- Reproduced the live failure at `/api/food/search?query=apple`: the endpoint returned USDA HTTP 400 responses with no food results.
- Root cause: the proxy used repeated GET `dataType` query parameters for a multi-dataset USDA search. USDA’s documented request shape uses POST with a JSON `dataType` array.
- Updated `api/food/search.js` to use POST, removed the insecure hardcoded key fallback, and added focused mock plus live USDA proxy tests.
- The corrected production proxy initially returned a safe HTTP 503 because `USDA_API_KEY` was missing from the active Vercel `yfit-app` project. The key was added to Production and Preview, then redeployed.
- Final live verification passed: `https://app.yfitai.com/api/food/search?query=apple&pageSize=5` returned HTTP 200 with USDA food results.
- All historical USDA key values were removed from this reference. Use only Vercel Environment Variables for future changes.
- Final source and documentation cleanup was committed to `yfit-app` as `1ed18fd` after the functional proxy fix `62bcb0b`; no mobile live-update bundle was required because the operational repair was server-side.

### November 13, 2026 — Medication Weekdays and Combination Ingredients

The user approved one chosen weekday for once-weekly medication and two distinct weekdays for twice weekly, with no off-day scheduled checkbox and no guessed weekday for existing medications. The user also approved separately entered ingredient names and exact strengths under one compound/combination parent, ingredient-level conflict comparisons, and grouped physician print/PDF output. No prescribed strength is inferred, summed or changed; a combination remains one parent schedule.

The complete code was first backed up in canonical `yfitai/yfit-app` branch `fix/medication-schedules-combinations-2026-11-13`, commit `87bd824a5fa0d979de111faaa243f79c53775ce8`, then merged to production `main` only after the additive database fields passed verification. The branch is retained as a backup; `main` now contains the feature, handoff report and combined SQL. The installed-phone archive release remains separate and pending.

`docs/MEDICATION_SCHEDULING_AND_COMBINATIONS_2026-11-13.md` records behavior and limits. The owner completed `database/add_medication_scheduling_and_ingredients.sql` in the existing YFIT Supabase SQL Editor. It adds nullable `scheduled_weekdays smallint[]` and `combination_ingredients jsonb`, type guards, structural constraints and schema-cache notification, without backfill, patient/dose updates, log deletion, RLS changes or function invocation. Both fields were absent before the migration and verified available afterward with a zero-row read. No rerun is required; the existing app GitHub/Vercel pipeline deployed the web feature.

75 automated regressions and 11 additional fictional form/list/doctor-print/PDF assertion groups passed. Both final web and Capacitor-target builds passed, with root/relative assets preserved. Build 108 and the existing phone archive remain unchanged; no installed-phone or real-patient end-to-end test is claimed. No production medical data was read or changed. Catalog projections passed zero-row checks; a zero-row type probe confirmed catalog UUID identifiers.

The former daily log mismatch path deleted today's records before rebuilding them. The new feature instead inserts only missing records and preserves taken/off-day/inactive/excess history. Current weekday choices are not applied retroactively to adherence; earlier wrongly generated logs can still bias historical summaries/Predictions. Cross-device insert concurrency is not solved by this feature. The current conflict table and unsaved comparison form warn about unresolved ingredients, duplicates, query failure, and limited non-dose-specific catalog coverage; they never establish medication safety. New scheduling labels cover all eight existing locales; new combination wording uses canonical English fallbacks. Other planned morning checks remain: normal six-platform execution outcomes, actual sign-in and report delivery.

**Owner SQL completion and web rollout, superseding the pending field/merge status above:** owner reported Success/no rows returned and saved at 17:21 EST. A combined zero-row projection returned HTTP 200 with both new fields available. The saved feature merged cleanly into `main` as `f0ae36b1c298369f15ba554c64b5b5b0b9b537c3`; all 75 medication regressions, 11 doctor-print/form assertion groups and food-proxy tests passed again before push. Live Vercel served the new `Medications-CGFic8Ve.js` module with both fields present and JavaScript MIME; sequential food search returned HTTP 200/five apple results. No real medication save/reload or completed user sign-in is claimed. No second SQL run is needed.

The current native updater is called from `src/App.jsx` and downloads the existing live-update archive. That archive is unchanged Build 108 and lacks the new medication feature. Web deployment alone is NOT an installed-phone release. Ask before publishing a new phone archive, then verify an actual device restart/update and its version. Native Google return/session plumbing remains a separate unresolved issue; do not promise it was repaired by the medication web change. Existing weekly records require owner weekday selection in My Medications → Edit, not historical inference.

---

## 🚨 Known Issues / Watch List

| Issue | Status | Notes |
|---|---|---|
| Social media monitoring — verify all 6 platforms posting | ✅ Done | v3.7.0 deployed May 18, 2026 — 6 platform CTAs + first_comment |
| Multilingual social media captions | Pending decision | Plan documented above |
| `yfit-deploy.vercel.app` still active | Intentional | Live update bundles served from here |
| USDA food search | ✅ Restored Aug 23 | POST request shape + Vercel `USDA_API_KEY` configured; live `apple` endpoint test returned HTTP 200 |
| **Supabase storage overage** | ✅ Resolved | Emergency cleanup (158 files / 271 MB deleted July 27). Edge Function + pg_cron now auto-cleans daily at 3 AM UTC. Actual live files ~88 MB. Billing meter may show elevated for 24-48h. Grace period until Aug 7, 2026. |
| **Google OAuth branding re-verification** | ✅ Approved | Google approved YFIT AI brand verification for project `southern-flash-298120`. |
| **Full Google sign-in flow end-to-end test** | ✅ Redirect fixed | Supabase Site URL and allow list now use `https://app.yfitai.com`; prior invalid-path error resolved. |
| **n8n storage cleanup workflow** | ✅ Deprecated | Replaced by Supabase Edge Function `storage-cleanup` (July 27, 2026). n8n workflow at https://n8n-railway-production-fbfd.up.railway.app can be disabled. |

---

*This file is the single source of truth for YFIT project state. Update it at the end of every session.*
