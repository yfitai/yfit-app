# One scraped article → one focused YFIT video

**Review-only example requested by Don Campbell, November 27, 2026. No live n8n, generator, renderer, screenshot-storage or posting changes.**

## The specific article

The example starts with an existing row in YFIT’s `scraped_articles` table—not a hypothetical article and not a fresh scraper execution:

**“Trying to Build Muscle and Lose Fat? Don’t Overlook This Part of Body Recomp”**, Women’s Health, by Cori Ritchey, published November 24, 2026. The existing row was created November 25 at 11:00:14 UTC. Its stored summary is “Crushing your workouts is only half the equation.” The publisher’s public article was read to confirm that it discusses nutrition alongside workouts and calorie/macronutrient tracking.[1]

We use that supported theme to introduce YFIT’s Nutrition displays. The article does not endorse YFIT or prove an app outcome. The script is an original explanation; we do not reuse the publisher’s photographs, video or long passages. Daily Tracker is an additional app demonstration of everyday entries, not a nutrition claim attributed to the article.

## Spoken script

> Training hard? Your meals matter too. A Women’s Health article highlights nutrition alongside workouts. In YFIT, check your calorie and macro progress, then review the meals you’ve logged. Daily Tracker lets you review your daily entries, including steps and water. Want to look around? Use the profile link and choose Explore the app first. These are sample records; saving your own needs an account.

Friendly male candidate voice: **Achird**, English, `casual, friendly`, reused from the earlier review. The spoken brand is written “Why Fit” for pronunciation; on-screen spelling remains **YFIT**. Final editing uses measured narration timestamps, not a guessed speaking duration.

## What the viewer sees

The finished portrait MP4 is **26.28 seconds**, 1080×1920, with the male narration and captions. Its sequence is:

1. **0–5.84 seconds:** the licensed food-topic clip and “Training hard? Your meals matter too.”

1. **5.84–9.88 seconds:** the actual Nutrition page, including calorie totals and protein/carbohydrate/fat progress.

1. **9.88–12.72 seconds:** actual expanded Breakfast and Lunch records.

1. **12.72–17.80 seconds:** actual Daily Tracker’s sleep, water and step displays; the clinical cards below are excluded from this crop.

1. **17.80–26.28 seconds:** the existing Go Explore control and destination, with the sample-record/account clarification.

Two one-second pauses were inserted in measured gaps to give the Nutrition and meal displays reading time. The voice itself was not sped up. Captions occupy a separate white/teal strip rather than obscuring the demonstrated totals or meal rows. Full media decoding passed and six representative final frames were inspected. Whole-passage transcription confirms the script; subjective normal-speed voice/pacing audition remains part of owner review.

Start with one short licensed meal/vegetable topic clip—not footage copied from the article. Then move into **actual authenticated-page YFIT components with fictional records**, maintaining their real colors and layout. Show Nutrition’s calorie/macronutrient progress, followed by its logged meals. Show Daily Tracker’s real daily-entry display, including water and steps. Close with an invitation to the existing Go page and Explore the app first.

The screenshots are display examples, not proof that a new meal or log was saved during the film. All account data is fictional. No guest-page mockup, recolored interface, fake interaction or medical/result promise belongs in this revision. Nutrition is the current `NutritionUnified → NutritionEnhanced` route; Daily Tracker is the current `DailyTracker` component. Those are different from the guest previews.

The opening footage is Ron Lach’s Pexels video “Fruits and Vegetables on the Top of the Table” / ID8455765. Its license permits free use and modification for promotional/social video, while prohibiting implied endorsement and standalone stock redistribution.[2] [3]

## The 11 saved pages

The current renderer is configured for **11 screenshots**: Dashboard, Goals, Nutrition, Daily Tracker, Fitness, Medications, Progress, Predictions, Recomp, AI Coach and Language.

A read-only check on November 27 found four valid images at its exact configured current paths: Dashboard, Fitness, Medications and AI Coach—the four restored earlier today. The other seven did not return an image. That is not proof of when or why older images disappeared, and a configured URL is not proof of an existing file. Original older PNGs were not found in the bounded local canonical inventory.

Actual app components are still in the canonical app source. Nutrition and Daily Tracker can therefore be freshly captured with fictional data for this local sample. **Preparing these review captures does not upload them, approve a seven-image restoration or alter tomorrow’s normal posting run.** A full catalog restoration would need a separate image review and storage decision.

## How much needs to change in n8n?

There is no live change needed to create this offline review example. For regular automated videos, the work spans three existing stages rather than replacing the whole process:

**Content generator:** Keep reading scraped articles and preserving their title, URL and summary. Select a genuinely matching app feature. Produce one short factual hook, one app demonstration and a close. Replace invented first-person customer stories and unsupported medication/injury outcomes. Choose a normalized topic/template key, such as `nutrition_daily`, rather than using a free-text article title as a visual selector. Hold or select another article when no verified feature matches.

**Narration and n8n handoff:** Reuse the existing text-to-speech stage and fix a supported male voice. Pass the script, topic/template selection and any scene/media inputs needed by the renderer. Inspect the actual published parsing and assembly nodes before deciding which fields need changing. The historical July workflow export is not proof of the current live contract, and existing API access remains blocked; no old eYes—this can become an automated series with different topics, much like your current posts. The drafts I gave you were written from features checked in YFIT’s code, rather than simply rewriting scraped articles. To make a finished video, we would turn the script into an AI-generated spoken recording, combine it with relevant app footage, and add captions and the closing invitation. You would not need to record the narration yourself. Your video service already accepts a narration audio file; the moving app demonstrations are the additional material we would need to prepare.
For the first series, I recommend one consistent, friendly male voice, if that is your preference—more like someone explaining the app than an announcer selling it. A female voice could work equally well; we have no evidence that one gender would perform better for YFIT. The reason to keep one voice initially is consistency and a cleaner comparison, not a guaranteed marketing advantage. We would select a specific voice and reuse its settings across the series. Later, we could compare another voice separately. Your current mixture of male and female voices is not, by itself, evidence of a problem.
If the format shows promise, the proposed daily process would be: choose an approved topic → write a short script → generate narration in the selected voice → select matching app footage → assemble and check the video → publish through the existing process. We would first build a small library of real app demonstrations using fictional data—for example, opening workout history, choosing a weekly medication day, or exploring before signup. Those recordings could support several different questions and openings; they would need updating when the app changes. Scraped articles could still suggest topics, but scripts should stay within verified app capabilities and avoid invented features or medical claims. Initially, I would review each finished draft with you. Once reliable, we could automate routine checks and hold unsuitable videos instead of posting them. That would require targeted generator/video-stage changes and possibly n8n inputs—not necessarily a new workflow. Nothing has been changed yet; the next sensible step is one complete sample video for your review, not immediate daily automation.xport is being deployed.

**Video service:** Select a short relevant topic clip, then show the matching genuine app displays for useful reading time with visible captions. The current renderer supports timed static screenshot inserts, not automatic app screen recording. A sequential moving app demonstration would need recorded footage and explicit scene/media support; new generator words alone cannot create it. Keep the current route/request compatible wherever possible and test new input mapping separately.

This sample uses a **profile-link CTA**, not a final all-six-platform version. A future generator should select the actual available clickable route for each platform: an in-post link or Visit Site control where supported, and a verified profile/channel link elsewhere. Do not tell TikTok viewers to use a profile website button until that account’s link availability is confirmed. The Go destination itself need not change.

The daily schedule, platform accounts/upload connections, Go destination, prices/offers, phone Build109 and reporting workflow should stay unchanged for a later first creative comparison. Public posting is a separate approval step. Missing screen assets should cause a hold/warning rather than silently substitute guest mockups or publish a screenshot-free result in the proposed format.

## References

[1]: https://www.womenshealthmag.com/fitness/a74478646/body-recomp-nutrition/ "Women’s Health: nutrition and body recomposition"

[2]: https://www.pexels.com/video/fruits-and-vegetables-on-the-top-of-the-table-8455765/ "Pexels stock video by Ron Lach"

[3]: https://www.pexels.com/license/ "Pexels license and permitted uses"

