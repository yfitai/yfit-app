# Screenshot-only restoration — prepared for review

Four replacement candidates are prepared for the confirmed inaccessible video assets. **Nothing has been uploaded or changed in production.** These are fresh captures of the actual YFIT Dashboard, Fitness, AI Coach and Medications components—not AI-generated pictures or the guest pages’ embedded mockups. Recoverable copies of the original PNGs were not found in the bounded canonical/local inventory.

The screenshots use fictional sample data in an isolated local preview. They do not show Don’s account or another user’s health records. Dashboard says “Demo”; AI Coach explicitly describes the preview; the medication is a fictional example. The Fitness screen uses three sample exercises and the app’s normal image placeholder, not a complete live catalog. Review these as replacement candidates, not exact copies of the lost originals.

## Four exact destinations

The existing bucket is `yfit-videos` in Supabase project `mxggxpoxgqubojvumjlt`. The existing renderer expects:

- Dashboard: `assets/app-screens/screen_01_dashboard.png`
- Fitness: `assets/app-screens/screen_05_fitness.png`
- AI Coach: `assets/app-screens/screen_10_aiCoach.png`
- Medications: `assets/app-screens/screen_06_medications.png`

Do not use the outdated `app-screens/` folder from the July notes. The manifest contains the exact current paths, byte sizes and SHA-256 hashes. These four replacements cover the default three-screen narration sequence and its Dashboard closing screen. Seven other catalog assets remain unchecked/unprepared; this is not a complete repair of every content-angle sequence.

## Preparation checks

All four files are complete PNGs at **1080 × 1920**, comfortably above the renderer’s 5,000-byte minimum. The offline validator passed ten checks, including rejection of wrong project/bucket, old/wrong paths, path traversal, altered hashes, missing/extra files and falsely asserted upload/owner approval.

Capture used the existing nonrelease web build of the real app source. All external GETs were intercepted and answered with fictional fixtures; external writes and WebSockets were blocked. Five attempted internal `feature_analytics` POSTs were blocked before transmission. No live account was signed in, no signup/payment was made, no model was invoked, and no live analytics or medical data was read or written. Capture completed without app page errors.

No app, video-service or cleanup runtime source, storage object, workflow, schedule or deployment was changed. Phone Build 109 fingerprints were preserved. Go analytics remains conditionally approved but blocked by existing access; that work was not deployed.

## Before live restoration

First obtain owner approval of these exact four image files and permission to upload them. Then use existing authorized storage access to confirm each destination is genuinely absent—not merely inaccessible because of a policy change. If an object already exists, stop; do not replace or delete it without new approval.

Upload only approved missing files to these exact keys using create-only `upload`, PNG content type and `upsert: false`. Supabase documents that `upload` targets an existing bucket; `update` always replaces a file and is not the appropriate create-only operation. [1]

Preserve the current bucket, policies and permanent `assets/app-screens/` namespace. The reviewed regular cleanup traverses generated-output prefixes rather than these nested permanent assets, but its deployed version, other cleanup jobs and the original deletion cause are unverified. Do not disable jobs or change storage policy based on suspicion. The proposed GitHub backup preserves approved source PNGs so they can be recovered if storage copies are lost again.

After an approved upload, verify each public URL returns the expected PNG and inspect an **existing normal scheduled run** for `app_screens_used`, schedule and any fallback warning. Do not manually Execute/Retry, call the generator/assembler or create a public test. The renderer can fetch restored missing images per request; do not restart Railway merely for this preparation. A cache/encode issue found in the normal run needs its own scoped repair.

## Package contents

`candidates/` contains the four owner-review PNGs. `restoration_manifest.json` records exact destinations and provenance with upload/visual approval unset. `validate_restoration.py` is offline-only and has no upload mode. `capture_candidates.py` can reproduce local captures when a compatible nonrelease build is present; the old sandbox build path is not itself a durable dependency. `evidence/` preserves the safe capture and validation results.

Run the offline checks with:

```sh
python3 validate_restoration.py
```

The earlier investigation is preserved separately as `YFIT_Screenshot_Video_Investigation_2026-11-26.md`.

## References

[1]: https://supabase.com/docs/reference/javascript/file-buckets-upload "Supabase Storage upload options and existing-bucket permissions"
