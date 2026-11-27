# YFIT actual-app screen library — November 27, 2026

All **11 configured screen assets** are saved here at their exact renderer filenames, each 1080 × 1920 PNG. These are actual authenticated-app components with fictional demonstration data, not guest mockups, generated interfaces or customer records. Original app colors and controls are unchanged. The four previously restored images are preserved byte-for-byte; seven missing views have been prepared locally.

## Online restoration is not complete

At the November 27, 17:12 EST check, Dashboard, Fitness, Medications and AI Coach were still valid online and matched the saved images. Goals, Nutrition, Daily Tracker, Progress, Predictions, Recomp and Language still returned “Object not found.” One create-only SDK upload attempt for Goals was rejected by Supabase; the script stopped without retrying, overwriting, deleting or changing access rules. No new files were uploaded. The available saved access references the correct YFIT project but uses an anonymous/public role; the precise rejection status was not retained, so this is an upload-access blocker, not a proven diagnosis of the bucket policy.

The complete local collection can be reused and recovered from the main app repository's dated evidence folder. It must not be called an 11-file live restoration until public GET, dimensions and hashes pass for every exact path.

## Finish the seven-file upload without touching the four restored images

1. Download `YFIT_Seven_Missing_Screens_For_Upload.zip` and extract it on your computer. Upload the extracted PNGs, not the ZIP.
2. Open your already signed-in [YFIT Supabase project](https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt). Use **Storage → yfit-videos → assets → app-screens**. This is the same folder used for the four restored images, not the obsolete July `app-screens` folder at the bucket root.
3. Choose **Upload files** and select just the seven extracted PNGs. Keep their exact filenames, including the capital T in `dailyTracker`. If Supabase reports a filename already exists, stop rather than replace it.
4. After the upload, the exact public URLs need to be checked again. No manual n8n execution, extra public post, service restart or bucket-policy change is required simply to add these missing files.

The seven-file ZIP contains only `screen_02_goals.png`, `screen_03_nutrition.png`, `screen_04_dailyTracker.png`, `screen_07_progress.png`, `screen_08_predictions.png`, `screen_09_recomp.png` and `screen_11_language.png`. The full-library ZIP is for backup and browsing, not for replacing the four files already online.

## What the collection shows

Use [the screen index](screen-index.md) to browse the images. `manifest.json` records exact filenames, hashes, dimensions, source revision, view limitations and observed online status. `notes/storage-restoration-receipt.json` preserves the bounded upload attempt and before/after public checks without credentials.

Nutrition shows actual calorie/macronutrient progress; Daily Tracker shows actual daily-entry cards. Goals shows the genuine Starting Point form. Progress shows an overview with fictional starting/current values, not fabricated improvement or chart history. Predictions and Recomp show genuine insufficient-data/setup states, not invented forecasts or AI recommendations. Language is the actual eight-option header menu over Daily Tracker; it is not an eleventh standalone page, and translation completeness was not tested.

These are static visual references, not proof that a tap saved data, a live user has a particular plan, or a clinical/AI feature produces validated outcomes. Native prediction, injury-risk and promotional wording is app-authored copy, not an independently verified capability. Avoid turning these appearance assets into medical, weight-loss or injury-prevention promises. Some native label/layout quirks remain unchanged; individual capture notes document them. Future close-up feature demonstrations may need new captures showing the specific task rather than reusing every overview indiscriminately.

Capture scripts, synthetic fixtures and safety audits are retained under `capture-evidence/` in the canonical repository backup. They depend on the earlier verified source/build workspace; that temporary compiled cache is intentionally not in this distribution. Recovering the PNGs for future posts does not require recreating the capture environment.

## Posting and source remain unchanged

Saving this library does not implement the proposed article-led video format. The existing renderer selects timed static screenshots; it is not an automatic recording of app actions. Future automation changes need a separate factual-script, feature-match and scene-template review. No n8n, app/Go source, pricing, analytics, deployment, phone Build 109, public post, Execute, Retry or backfill was changed here.

The corrected review video is delivered separately. Its final spoken line, static CTA text and caption now read: **“Saving your own data needs an account.”** The existing food opening remains unchanged; the exercise-opening question is a recommendation discussion, not authorization to replace it.
