# Scraper duplicate handling — November 13, 2026

**Current status:** At15:37 EST on November13, the owner reported using Deploy Updates on the existing function and receiving “Successfully completed.” Deployment acceptance is owner-confirmed. The next normal scheduled execution and downstream publication outcomes remain unverified; no manual invocation/retry was performed.

The user approved a narrow duplicate-safe repair and deployment to the existing Supabase `scrape-fitness-articles` Edge Function, with the unique URL constraint and existing articles preserved. No schedule changes, database cleanup, retries or public backfill are authorized.

## What runs where

The scraper is hosted in Supabase, reads configured internet RSS/Atom feeds, filters unsuitable content, scores relevant articles and stores selected records in `scraped_articles`. n8n schedules the scraper and downstream content generation/video/publication. Supabase Database Functions are SQL calculations/triggers; they are not the Edge Functions screen containing this scraper.

The selected November 13 n8n execution1191 failed with a duplicate-key error naming `scraped_articles_url_key`, at Call Supabase — Scrape Articles. Visible November8–13 runs show failures at that stage, but only the selected run's exact body is established. The selected trigger input is11AM America/ChicagoUTC−6; the6AMCDT node label is not authoritative cron evidence. No schedule was changed.

## Approved local implementation and tests

The local patch deduplicates exact URL strings after relevance sorting and before the top-ten cap, retaining the highest-ranked candidate. It preserves `upsert` with `onConflict: 'url', ignoreDuplicates: true`, which must not overwrite existing content or processed state. It requests returned inserted URLs and counts only newly inserted rows in `articles_saved` and `automation_logs.articles_processed`. All-existing input returns success with zero saved; genuine non-URL database errors still fail. It does not canonicalize URLs, drop constraints, delete rows or introduce retries.

`node --test scripts/tests/scrape-fitness-articles.test.cjs` passed10/10 isolated synthetic tests using the actual syntax-stripped handler, mocked Supabase and in-memory feed/scoring fixtures. Coverage includes existing URL preservation, duplicate input, all duplicates, fresh rows, mixed/replayed input, genuine DB failure, exact URL variants, title prefilter, empty input and deduplication before cap. No actual scraping, scoring-provider call, live database write or workflow invocation occurred. These are not Deno typechecking or real PostgreSQL/PostgREST integration tests.

## Deployment is pending active-source comparison

**The GitHub scraper already had URL conflict-ignore upsert before this patch.** The new patch improves exact-input deduplication and honest inserted-row counts; it is not the first addition of conflict-ignore behavior. The error text 'Failed to insert articles' also appears in the existing upsert path and does not prove that the live function uses plain insert.

Before deploying, compare the active Edge Function Code with this local version and confirm n8n targets that same existing function/project. If the active code is older/plain insert or conflicts on a different column, a narrow deployment may address the demonstrated mismatch. If active code already has the same URL conflict-ignore behavior, obtain read-only relevant constraint/trigger/request metadata rather than deploy blindly or weaken uniqueness.

The authorized cloud browser remains at Supabase dashboard login, and a direct connector was not enabled. User screenshots are from their own signed-in browser and do not authenticate the cloud browser. No live function deployment has been performed or claimed. The user should open the existing project's Edge Functions list, then `scrape-fitness-articles` → Code—not Database → Functions, New Function, Secrets or Test—and provide only the article insert/upsert block or authorized dashboard access. Keep secret values out of screenshots and chat.

Source and tests are saved in the canonical app repository. A future deployment must preserve the existing function name, route, gateway settings and configured secrets. Do not invoke this function as a smoke test: its handler currently ignores request method/body, so even a GET may scrape/score/write. Verify deployment metadata/source without execution, then inspect the next already-scheduled run.

## Active-source comparison completed from owner-pasted Code

At approximately15:26 EST the owner supplied the full current Edge Code as `pasted_content.txt`. It uses plain `.insert(...)` for `scraped_articles`, while the pre-repair canonical GitHub file uses `.upsert(..., { onConflict: 'url', ignoreDuplicates: true })`. A full-file diff found only this article-write guard/comment difference between the uploaded live version and the pre-repair GitHub version. Thus a deployment mismatch is established from owner-provided code evidence, not an authenticated API retrieval. The live seven-day title check cannot guard older or changed-title URLs against the permanent URL uniqueness rule. This supports deploying the scoped URL-safe replacement rather than weakening the database constraint.

The unchanged live version is preserved privately as `docs/evidence/2026-11-13-repairs/scrape-fitness-articles-before.ts`, with before/replacement hashes in `scraper-source-comparison.json`. The canonical replacement is `supabase/functions/scrape-fitness-articles/index.ts`. Its10 synthetic tests pass and the sequential food proxy regression/live check passes. No database/provider call or workflow retry was used to test the scraper.

Because management access is not authenticated in the agent browser, the remaining deployment step is owner-controlled: replace the existing `scrape-fitness-articles` Code with the complete tested canonical file, then use Deploy Updates for that same function. Keep function name, secrets, gateway authentication and URL constraint unchanged. Do not choose New Function, Test, Invoke or n8n Retry/Execute. Capture deployment success/version metadata; this note does not yet claim that deployment happened. The next normal scheduled execution can show whether scraping progresses to subsequent nodes, but the entire publication pipeline is not cleared by deployment alone.

## Final offline regression result

The final gate passes11/11 synthetic checks. The additional check reverts only the article-write semantics to the owner-supplied plain-insert pattern and reproduces the exact named duplicate-key failure with HTTP500; the same existing-URL fixture passes with conflict-ignore handling and preserves its row. This is a mocked contract reproduction, not a live insertion or PostgreSQL test. The complete tested canonical `.ts` file is the deployment replacement; its before-code snapshot is preserved for rollback.

## Owner-confirmed deployment and remaining gates

The owner reported deployment success at15:37 EST after the replacement instructions. The saved replacement is the canonical source in commit `6cc8a2a`; the before-code snapshot remains available privately. No function name, gateway setting, secret or URL constraint change was requested, and no such change was reported. This is user-reported dashboard confirmation, not an authenticated deployment API read or a live function execution test.

Inspect the next existing scheduled n8n execution without pressing Execute/Retry: confirm Call Supabase — Scrape Articles completes, inspect `success` and `articles_saved` (zero can legitimately mean all selected URLs already exist), then check the next generation/assembly/provider nodes and six terminal publication outcomes. If another node fails, record its sanitized error/status rather than assuming the entire pipeline is restored or retrying posts. Do not infer that a successful deployment or scraper node means all six posts were published.

The source/deployment mismatch also exposes a release-process gap: ordinary GitHub/Vercel web deployment does not publish Supabase Edge Function code. The previously committed guard remained absent in the active scraper. A future approved automated Edge release step should be scoped to the canonical repo, existing project and changed functions, with validation and rollback; no new automation or credential setup was created in this repair.
