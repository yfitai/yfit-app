# Scraper-only test — November 13, 2026

**Current status: live scraper-only test passed at16:05 Manitoba time.** Exactly one POST returned HTTP200, `success:true`, `articles_saved:10` in5.376seconds. No generation, n8n or publishing call was invoked, and no retry was made. A subsequent read-only Upload-Post check returned zero uploads/history and zero in-progress items in the inspected account during the test window. This clears the one scraper test, not downstream generation or six-platform publication.

The owner approved one live scraper-only test at15:45 EST. It may fetch/score RSS articles and write article/run/feed records, but must not invoke generation, n8n or public posting. This later approval supersedes the earlier no-manual-scraper-invocation boundary only for this one isolated test. Historical pending status below is superseded by the actual test evidence in the next section; no additional invocation/retry is authorized.

The source has no direct publishing call, but writes `public.automation_logs`, `public.rss_sources` and `public.scraped_articles`. Source absence of hooks is not evidence of their absence in production, so the owner ran `docs/testing/SCRAPER_ONLY_TRIGGER_CHECK.sql` before the test. It is one read-only catalog query returning safe trigger/publication metadata and warning flags, without raw function bodies, stored headers, secret values or table data. Its results were reviewed as described below. Do not substitute a GET smoke test: the scraper handler currently ignores request method and GET also writes.

The owner reports Supabase initially appeared unhealthy, refreshed healthy and supplied a healthy YFIT overview screenshot. The screenshot shows Canada Central, Nano, CPU3%, disk5%, RAM49%,28/60 connections at that moment. This is a status snapshot, not proof of stable uptime. The connected My Browser tab redirected to sign-in although the owner's Work-profile tab was signed in; no further login was requested. The owner supplied safe SQL results and the app's legitimate public client credential provided a verified invocation channel without dashboard credentials. This resolved the completed test's access blocker without altering accounts or services.

## Live safety check and the one authorized request

At16:01 the owner supplied the SQL query result: all three public tables exist, each has null publication membership, and noninternal trigger count is0. The screenshot was inspected in two overlapping crops. This establishes no direct table trigger and no publication path for these tables at that snapshot; unrelated external schedules or polling are not excluded.

The current app source contains its public anonymous Supabase client credential, whose role/project/expiry were checked without displaying its value. A separate GET to the auth settings endpoint returned200; it is not a scraper invocation. No secret/dashboard credential was extracted or stored. One direct authenticated POST with body `{}` was sent to the existing `scrape-fitness-articles` endpoint using that legitimate client credential. An exclusive pre-request attempt record prevents accidental reruns; redirects/retries were disabled.

The test ran2026-11-13T21:05:15.212307Z–21:05:20.620729Z and returned HTTP200 with `{ "success": true, "articles_saved": 10 }`. Elapsed5.376seconds. Platform request ID is `01a1d6ba-982e-7adc-ac72-5346b822469a`. Returned `articles_saved` is the repaired actual inserted-row count; no duplicate-key exception occurred in this run. This does not independently prove every RSS source or OpenAI scoring branch succeeded, nor is it a live repeated-input test. The11 synthetic regressions cover duplicate/replay preservation and honest counting without an additional paid invocation.

A GET-only Upload-Post history query at21:06:44Z for21:04:15Z–21:06:44Z returned HTTP200, history0,total0,in-progress0, pagination exhausted. This supports no uploads/publications observed in the current authorized account during the isolated test. It does not exclude other provider accounts or future already-scheduled jobs. No generation/webhook/video/publisher request, workflow run, manual retry, timestamp change or new mobile bundle was performed. The newly saved articles remain available to the existing normal pipeline.

Sanitized live-result, request metadata and provider aggregates are saved in private hub `docs/evidence/2026-11-13-scraper-only/`. The missing browser session is no longer a blocker for this completed test, so do not request another login or repeat it. For timing, inspect the actual Schedule Trigger Parameters and workflow timezone read-only. For downstream testing, obtain separate approval for a generation-only/no-publish route before executing anything beyond the scraper.

## Manitoba and the observed trigger time

Manitoba implemented year-round UTC−5 on October31,2026; its current law calls it Manitoba Standard Time, abbreviated MBT. It did not fall back November1. Chicago did fall back to UTC−6. The owner's statement about Manitoba's change is correct. The official proclamation and current statute establish the effective date. [1] [2]

The supplied `2026-11-13T11:00:00.007-06:00` America/Chicago trigger instant is17:00UTC and12:00Manitoba. The execution list's12:00 display is therefore consistent with Manitoba conversion. An obsolete Winnipeg timezone database can be one hour wrong, not the five-hour Chicago gap from a6AM node label. The sandbox tzdb2026e already returns WinnipegUTC−5; this does not establish n8n's runtime version. VPN Chicago exit location does not automatically change server cron. Schedule Trigger uses an explicitly set workflow timezone before the instance default. [3] [4]

The6AMCDT node label is not a cron setting. One possible misconfiguration is entering11 expecting UTC for6AMManitoba while the workflow interprets11 in Chicago; this matches observed noonManitoba but remains a hypothesis. Inspect the actual trigger rule, workflow timezone and instance setting read-only before changing any timing. No timezone, workflow or schedule change has been authorized/performed in this step.

Full sourced notes and isolation review are preserved in the private hub `docs/evidence/2026-11-13-scraper-only/`. Existing scraper replacement remains saved/deployed by owner confirmation; rollback source is preserved. Build108 remains unchanged. Payment, authenticated report, real Google/mobile and six-publication end-to-end tests remain separate.

## References

[1]: https://web2.gov.mb.ca/laws/statutes/proclamations/2023c4%282026-10-31%29.php "Manitoba proclamation bringing the Official Time Amendment Act into force October31,2026"
[2]: https://web2.gov.mb.ca/laws/statutes/ccsm/o030.php "Manitoba Official Time Act, current consolidation"
[3]: https://www.gov.mb.ca/timechange/index.html "Manitoba new year-round time zone, official FAQ"
[4]: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/ "n8n Schedule Trigger timezone precedence"
