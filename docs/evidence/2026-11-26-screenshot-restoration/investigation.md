# YFIT social-video screenshots — November 26, 2026

**The screenshot feature remains in the canonical video-service code, but four key image files at the exact URLs it uses now return “Object not found.”** This is a concrete defect that can leave videos without app screenshots while publication continues. The checked files are Dashboard, Fitness, AI Coach and Medications. All three images in the service’s default narration sequence, including its Dashboard closing screen, are among those missing files. The other seven catalog images were not checked. [1]

## The screenshot work was real and is still in the code

The July 16 decision records actual app screenshots composited into the master video, with screens chosen by content angle and a Dashboard closing screen. The implementation was added in video-service commit `a5774fd`, followed that evening by overlay and startup-cache fixes. [2] [3]

The canonical video repository is `yfitai/yfitai-yfit-video-service`, locally `/home/ubuntu/yfit-video-service`. Fresh GitHub main and local HEAD both identify `dc56fac4f734bc100c8b94fba3d1e505aeca4cf7`; its working tree was clean. The runtime `server.js` was last changed on July 18, not removed during November’s documentation/diagnostic work. The live service’s read-only health endpoint returned HTTP 200 and version `4.1.0` on November 26. That version is consistent with source, but the health response does not identify its deployed commit or screenshot-cache state. [1] [4]

The current source enables screenshots when `app_screens` is omitted or true. The app’s content generator never needed to send screenshot URLs: selection and downloads belong to the video service. Available generator history shows no removal of screenshot fields. The November 16 generator-only test verified text generation and isolation, not screenshot assembly. [5]

## Exact current image paths are missing

The older July notes name `yfit-videos/app-screens/`. Current `server.js:54–65` instead uses **`yfit-videos/assets/app-screens/`**, with some different filenames. Initial checks of the old documented paths were therefore not sufficient. The investigation then checked these four exact current-source URLs with GET, without viewing pixels or generating any video:

- `assets/app-screens/screen_01_dashboard.png`
- `assets/app-screens/screen_05_fitness.png`
- `assets/app-screens/screen_10_aiCoach.png`
- `assets/app-screens/screen_06_medications.png`

Every request returned HTTP 400 with the Supabase Storage error `statusCode: "404"`, `error: "not_found"`, `message: "Object not found"`. These are not accessible PNG images at their configured public URLs. The fresh response evidence is preserved in `/home/ubuntu/.manus/yfit-content-nov26/current-source-asset-check.json`. [1]

## Why videos can keep posting without screenshots

The downloader rejects non-200 image responses. The per-image handler then logs the failure and continues. Missing images are omitted from the overlay schedule; the request is not automatically failed because screenshots are missing (`server.js:202–204, 734–767, 968–976`). A successful render can consequently return `app_screens_used: 0` and an empty screenshot schedule. There is also a separate final-encode fallback that retries without any screenshots after an encode exception (`1070–1078`). [1]

Startup-cached images could allow a warm instance to keep showing screenshots after the source files become inaccessible. A cold restart downloads them again. This is a source-supported explanation for a delayed disappearance, not proof of the actual restart or deletion dates. [1]

I could not read a current n8n execution: the correctly normalized API origin returned HTTP 401, and the existing cloud browser session redirected to sign-in. No credentials were requested or changed. The latest assembly input, `app_screens_used`, returned schedule and Railway render logs therefore remain unverified. Missing current image files are confirmed; attribution to a particular recent run or deletion event is not.

## What should be restored—and what should not be changed

The smallest proposed repair is to restore approved app screenshots at the exact current permanent asset paths, verify them, and inspect an existing scheduled run’s assembly result. No extra public test post, schedule change or generator rewrite is needed merely to restore the missing files.

Before restoration, check how those files disappeared. The documented July emergency cleanup deleted files from the same bucket, but no object-specific deletion evidence was retrieved. The reviewed ongoing cleanup source traverses root, `videos/`, `captions/` and `thumbnails/`, not `assets/app-screens/`; it does **not** establish that the regular cleanup deleted these screenshots. Do not blame, disable or re-enable a cleanup job based on this investigation alone. Permanent screenshot assets should be explicitly protected in any restoration plan. [6]

No application source, workflow, storage object, deployment or posting configuration was changed. No scraper/generator/assembly request, paid generation, Execute/Retry, backfill or public post was run. Phone Build 109 and the blocked Go-analytics deployment remain untouched. Restoring or replacing the screenshot assets requires separate owner approval.

## References

[1]: https://github.com/yfitai/yfitai-yfit-video-service/blob/dc56fac4f734bc100c8b94fba3d1e505aeca4cf7/server.js "Current canonical video-service source and exact screenshot URLs"
[2]: https://github.com/yfitai/yfit-ai/blob/370efae793605450aa2216675f43626bdec90398/docs/DECISIONS_LOG.md#L1031-L1082 "July 16 screenshot-overlay decision and historical asset records"
[3]: https://github.com/yfitai/yfitai-yfit-video-service/commit/a5774fd60aeaeabfdf2dece059047cf1f6eb0d33 "July 16 addition of app-screen video overlays"
[4]: https://yfitai-yfit-video-service-production.up.railway.app/health "Existing Railway video-service health endpoint"
[5]: https://github.com/yfitai/yfit-app/blob/0724d1962147075bd9211a8351c50b3758b2ac1a/docs/GENERATOR_ONLY_TEST_2026-11-16.md "November 16 generator-only verification and its limits"
[6]: https://github.com/yfitai/yfit-app/blob/0724d1962147075bd9211a8351c50b3758b2ac1a/supabase/functions/storage-cleanup/index.ts "Current storage-cleanup source and enumerated prefixes"
