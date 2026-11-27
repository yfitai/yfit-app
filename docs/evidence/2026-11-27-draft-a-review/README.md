# Draft A — finished review video

Don requested one finished sample of Draft A on November 27, 2026 at 15:43 EST, using a friendly male voice. This authorizes this offline sample, not public posting, workflow changes or deployment.

The finished file is `YFIT_Draft_A_Friendly_Male_Review.mp4`. It combines genuine current YFIT sample-app controls with fictional built-in sample data, a real workout-heading click, readable explanatory crops and holds, and generated male narration. This is an edited demonstration, not an uninterrupted authenticated private-account recording. The static phone mockup panels and unverified medical claims in surrounding guest-page content were excluded. No background music was added to this first review take so the voice can be judged clearly.

## Narration

Voice: **Achird**, male, `en-US`, delivery `casual, friendly`. This is a candidate voice for owner review, not yet the approved permanent voice. Spoken brand is written “Why Fit” for pronunciation; captions retain **YFIT**. Narration duration is 18.72 seconds; the edit adds an ending hold. The final probe and production manifest contain exact output duration and technical properties.

> Still hunting through notes for your last workout? Here’s a sample workout in YFIT. Open Fitness, choose History, and tap the workout to see its exercises, weights and reps. Want to look around first? Use the profile link and choose Explore the app first. These are examples; your own saved workouts need an account.

The generated take and transcription express “Want to” conversationally as “Wanna”; captions preserve the original meaning. All narration content is present in the measured transcription. Brand spelling in automated transcription was normalized only for captions.

## Visual production

App source: production-main Git object `20cae3de9b8d9160618299a1f81fa2b79021258a`, archived into a temporary workspace. Offline browser requests were restricted to an exact loopback origin, every external and non-GET/API request was blocked, websocket attempts were closed and service workers disabled. No live app or Go visit, signup, OAuth, model-powered app action, real record read/write, analytics journey or live generator/video-assembler call occurred. The only authorized media service calls were speech generation and transcription.

The actual guest entry was local `/go?mode=guest`, followed by real Fitness navigation, History tab and workout heading controls. Direct local `/fitness?mode=guest` showed a logged-out navigation race during capture; it was not repaired or represented as a confirmed live production bug. Preserve this bounded observation for later review, not an unapproved repair.

Clean visual inputs are the actual navigation/History crop, collapsed heading, expanded mapped exercise rows and current Go Explore button crop. The one real click strip changes the native chevron; the explanatory cut immediately afterward shows genuine rows. Source crop regions and timeline are recorded in `production-manifest.json` and `safe-manifest.json`. Evidence-only uncropped material contains mockup panels and was not used in the finished edit.

## Preserved scope

Production app, Go source, analytics tracker/property, pricing/offers, authentication/accounts/records, phone Build 109, n8n workflow/schedule and platform/report connections are unchanged. No public posting, retry, backfill, Supabase upload or production deployment occurred. The owner must review the actual video before any separate publishing decision. The closing wording targets profile-link platforms; platform-specific closing instructions would need adaptation before a later approved public test.

## Reproduction

`make_captions.py` uses actual word timestamps from the generated narration. `render_review.py` performs a deterministic FFmpeg edit and writes the final video/probe/manifest. Capture and crop scripts are included for provenance and preparation. They use workspace-specific paths, so restore the documented workspace or adjust paths when reproducing. Capture scripts may compile source into an isolated local web build but must not invoke release/prebuild scripts, change source/version files or allow external traffic. Fresh capture recordings need a new inspection of click frame timings before using old trim constants.

The private canonical backup contains final media, selected clean visual inputs, narration, measured transcription, captions, scripts and safe capture/production records. Temporary archived source, node_modules links, Vite build/cache, evidence-only full viewport images and raw unclean recording are not part of the published-facing result or necessary Git backup. No website or application project was created or published.
