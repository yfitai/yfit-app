# Medication weekdays and combination ingredients

**Date:** November 13, 2026

**Canonical app:** `yfitai/yfit-app` — `/home/ubuntu/yfit-app-full`

**Current release status:** owner-applied schema verified; feature merged to production `main` and the web code is live. Functional merge commit: `f0ae36b1c298369f15ba554c64b5b5b0b9b537c3`; feature backup retained. The owner subsequently approved Android Build 109, published in `c3458d9` with downloaded-archive/checksum and legacy web-bootstrap verification. Actual phone installation/save/reload remains unverified. See `ANDROID_BUILD_109_2026-11-13.md` for the current release and phone steps.

## Authorized behavior

Once weekly requires one chosen weekday. Twice weekly requires two distinct weekdays. The add-from-catalog, custom-medication/supplement and edit forms all use the same picker and validation. The medication remains visible on off-days, but has no scheduled taken checkbox. Existing weekly medications without chosen days show an explicit setup message; no weekday is inferred from a start date or historical dose logs. Daily dose counts and times retain their existing behavior. Every-other-day and as-needed scheduling were not redesigned in this change.

The old log-count mismatch path deleted all today's dose rows before rebuilding them, including taken statuses and actual timestamps. It is replaced with non-destructive missing-dose reconciliation. Existing taken, off-day, inactive and excess records are preserved; off-schedule taken records remain visible as read-only recorded activity. Toggling is gated by the local scheduled day, row ID and user ID. Local date boundaries are used, including midnight refresh. Concurrent inserts from multiple devices remain an unaddressed database-uniqueness limitation; this change does not claim transactional cross-device exactly-once logging.

Today's adherence follows the selected schedule. Historical percentages use existing recorded dose rows rather than applying today's selected weekdays to the past. Earlier incorrectly generated daily-like weekly records are not deleted and can still bias historical percentages or Predictions. An explanatory note is shown. No historical schedule version or effective date is invented.

## Combination medication and physician report

The user authorized explicit ingredient-and-strength entries under one parent medication name. The parent dosage field remains free text for the product's prescribed dosage/directions; every ingredient row separately records its name and exact label strength. The four ingredients are not summed, inferred from old text, or logged as four independent medications/doses. Notes remain for additional instructions.

Optional ingredient rows can be added, edited or removed, up to twenty. A catalog lookup returns options and requires the user to select the matching record; changing a name invalidates its previous match. Unmatched literal names may be recorded, but are explicitly warned as unchecked. Do not imply that simply typing four strengths makes them four verified catalog ingredients.

The Safety Check tab now has current medication/supplement tables with ingredient-level warning status, fresh checks of known catalog IDs, and a proposed-medication comparison form that does not save a medication or change a schedule. Both orientations of catalog interaction pairs and pairs within a compound are checked; repeated/shared ingredients generate potential-duplicate warnings. Existing saved safety alerts and acknowledgement remain separate. Query failures do not become successful empty results.

**Coverage is limited:** this is the existing catalog's interaction dataset, not a comprehensive clinical interaction, allergy, condition or dose-specific safety engine. It never grants permission to take or change a medication. Unresolved ingredients, unsupported records and failed checks require pharmacist/prescriber review. No clinical facts or strengths were guessed.

The current provider report retains medication name, dosage, frequency, start date, patient/provider/allergy fields and Print/Download PDF controls. Ingredient names and strengths appear as indented entries beneath the parent, and selected weekdays are shown separately from frequency. PDF text wraps, checks page bounds and keeps ordinary four-ingredient groups with their parent; oversized groups can paginate rather than overflow.

## Database prerequisite

A bounded pre-migration, zero-row REST check showed that `user_medications.scheduled_weekdays` and `user_medications.combination_ingredients` were absent. The owner subsequently reported SQL success/no rows returned and saved. A fresh combined projection of both fields returned HTTP 200 with zero rows, confirming the fields are now available in the active YFIT Supabase project. No medication/patient records were retrieved. Catalog and interaction column projections returned HTTP 200 with zero rows; a zero-row validation probe confirmed catalog UUID IDs. OpenAPI metadata was unavailable (401); no repeated authorization retry was made.

The owner ran `database/add_medication_scheduling_and_ingredients.sql` in the existing YFIT Supabase SQL Editor. No further SQL run is required. This single transaction adds nullable `scheduled_weekdays smallint[]` and `combination_ingredients jsonb` fields, type guards, structural constraints and schema-cache notification. It does not backfill, change medication dosage/frequency, delete logs, change RLS or invoke functions. Existing rows remain unspecified/NULL. The standalone and combined migrations remain as release documentation.

The field gate passed before merging/pushing the saved feature into the existing app `main`. The existing GitHub/Vercel pipeline served the new medication module at `https://app.yfitai.com/assets/Medications-CGFic8Ve.js`, with weekday and ingredient code present and a JavaScript MIME type. The public signup page returned HTTP 200. The logged-out medication route returned the landing page; an authenticated save/reload was not attempted. Sequential live food search returned HTTP 200 with five apple results. No duplicate project or Edge function was created. Schema rollback must retain user choices; reverting app code while retaining nullable fields preserves them.

## Verification evidence

- 75 automated regression tests passed: pure schedules; weekly/day validation; Sunday zero; local-date/timezone boundaries; non-destructive logging; current versus historical adherence; real DOM weekday and logging behavior; current conflict table; ingredient resolution, duplicate/pair checks and failure handling; both standalone and combined migrations in disposable PostgreSQL.
- 11 additional fictional form/list/provider-print/PDF assertion groups passed. Four separate strengths remained grouped under the parent on the tested PDF pages. No real patient PDF was generated or delivered.
- Web and Capacitor-target production compilations passed; final integration compiles are recorded in private evidence. Web assets remain root-based; native package assets remain relative.
- All scheduling labels were added in the existing eight-language `src/lib/i18nResources.js`. New combination/comparison wording has canonical English resources/fallbacks; it is not represented as fully localized into every language. Existing translations were not overwritten.
- No actual medication/dose records, reminders, public posts, payments, financial reports, production database changes, or account changes were made by the assistant. The initial medication web release left the phone archive at 108; the later separately approved Build 109 was built/published, not installed or validated on a real device.

**Web versus installed phone:** `src/App.jsx` actively initializes the native-only update service. The later Build 109 release repairs void-download/fixed-ID staging defects and packages this feature at the same legacy ZIP URL with validated versioned metadata. Downloaded archive/checksum and new legacy-origin web code are verified. A web deployment or published archive must not be represented as a completed installed-Android test; older executing local updater code cannot be repaired by a ZIP alone. Owner restart/build-marker/control checks remain needed; browser/PWA caching and native Google/session behavior remain separate.

Test commands from the canonical app root:

```bash
TZ=America/Winnipeg node --test \
  scripts/tests/medication-schedule.test.mjs \
  scripts/tests/medication-log-service.test.mjs \
  scripts/tests/medication-ui.test.mjs \
  scripts/tests/medication-ingredients.test.mjs \
  scripts/tests/medication-migrations.test.mjs
node scripts/tests/medication-form-print-assertions.mjs
```

DOM/migration tests use transient `jsdom` and PGlite dependencies outside the app repository at `/home/ubuntu/.manus/yfit-medication/test-deps`, or the directory specified by `YFIT_TEST_DEPS`. They do not modify the app package manifest/lockfile and run with fictional data. No clinical correctness validation or installed-phone end-to-end test is claimed.

## Next session

After the migration and deployment, verify the owner-selected weekdays survive a normal user-controlled save/reload and that due-day/off-day checkboxes behave as intended. A combination should remain one parent schedule, with each exact ingredient/strength printed below it and each unresolved ingredient clearly warned. Do not edit a real medical record on the owner's behalf without a designated, explicitly approved test.

The user will check the next normal social execution in the morning. Then recheck actual sign-in pages and report delivery. Those broader processing tests remain open; neither this medication feature nor the corrected published 6 AM Manitoba schedule proves the six-platform publication, payment, login or report-delivery flows have all passed.
