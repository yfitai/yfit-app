# Scraper-only test — November 13, 2026

**Status: authorized, not yet invoked.** The owner approved one live scraper-only test at15:45 EST. It may fetch/score RSS articles and write article/run/feed records, but must not invoke generation, n8n or public posting. This later approval supersedes the earlier no-manual-scraper-invocation boundary only for this one isolated test. No live request of any method has been sent and no retry is authorized after ambiguous timeout/partial execution.

The source has no direct publishing call, but writes `public.automation_logs`, `public.rss_sources` and `public.scraped_articles`. Live triggers/webhooks and publication consumers must be reviewed first. Source absence of hooks is not evidence of their absence in production. `docs/testing/SCRAPER_ONLY_TRIGGER_CHECK.sql` is one read-only catalog query returning safe trigger/publication metadata and warning flags, without raw function bodies, stored headers, secret values or table data. It has not been executed in Supabase. Do not substitute a GET smoke test: the scraper handler currently ignores request method and GET also writes.

The owner reports Supabase initially appeared unhealthy, refreshed healthy and supplied a healthy YFIT overview screenshot. The screenshot shows Canada Central, Nano, CPU3%, disk5%, RAM49%,28/60 connections at that moment. This is a status snapshot, not proof of stable uptime or successful scraping. The connected My Browser tab still redirects to sign-in although the owner's Work-profile tab is signed in. Do not repeatedly ask the owner to log in or infer backend failure from this session mismatch; hand off the read-only SQL through the owner's healthy tab and review the result before one direct POST or existing-function dashboard invocation.

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
