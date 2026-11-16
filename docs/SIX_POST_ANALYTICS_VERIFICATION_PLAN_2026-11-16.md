# Six-post analytics verification plan

The owner will check the next existing scheduled social run on **November 17, 2026 at 6 AM Manitoba / 11:00 UTC**. The workflow remains published with UTC cron `0 11 * * *`. November 14–16 execution screenshots show the corrected 6 AM start. The funded generator-only test passed on November 16; full scheduled publication is still unverified. No new timer, reminder, background monitor or manual posting run is created by this plan.

If that normal run publishes all six posts, the owner's next request is to compare **each individual post** against native-platform analytics and YFIT reporting before changing marketing strategy. Platforms: TikTok, Instagram, YouTube, Facebook, Pinterest and LinkedIn. The inspected n8n generator URL matches the successful `generate-social-content` test; leave the separately named `generate-social-posts` unchanged.

## First establish six actual publications

Capture the scheduled execution time and status, any first failing node, and each platform's terminal provider result and public post URL/ID. A green workflow, generated draft, assembled video or accepted upload is not sufficient alone. If any platform is missing or fails, troubleshoot that stage rather than retrying, backfilling or calling the run fully restored.

The owner can bring an execution screenshot and six post links. Any screenshot should omit credentials and authentication headers. Native account access or owner screenshots may be needed for analytics that are not public; access limitations must be reported, not filled with invented numbers.

## Compare the same post, period and measurement

For every platform, identify the exact post URL/ID and published timestamp, then record a dated native analytics snapshot. Retrieve the matching YFIT/Upload-Post data and identify its time window, retrieval timestamp and source. Preserve available native exports/screenshots and sanitized API evidence so later corrections do not replace the original baseline.

Compare only like-for-like measurements exposed by both sources. Candidate fields are post views/impressions/reach, reactions/likes, comments, shares, saves, watch-time/completion measures and link clicks where available. Retain each platform's displayed metric labels and definitions; do not require unsupported metrics or treat platform terms as interchangeable. A public reaction count is not a substitute for owner-only analytics.

Keep **individual-post metrics**, **account totals** and **weekly changes** separate. Followers and profile views must not be presented as that post's views. A lifetime total must not be compared with a weekly increment. Check timezone/date boundaries, filters, delayed/stale snapshots and whether a report reuses old totals before calling a difference a calculation bug. An unavailable API response must appear as unavailable, not a genuine zero.

Create an initial baseline once posts exist, and a follow-up snapshot when the owner returns, optionally 24–48 hours later. This is a comparison method, not a promised automatic check. Do not manufacture engagement, post comments, edit posts, reconnect accounts or generate new content to test analytics.

## Verify weekly reporting separately

Locate the actual Monday weekly PDF/email and its reporting period. A report ending before these new posts were published cannot be expected to include them. Check that the same eligible posts and data window flow into the PDF, that missing metrics remain clearly unavailable, and that the report uses changing period-specific values rather than stale account totals.

The owner has raised missed Monday delivery, difficulty locating emailed reports and apparently unchanged figures. Verify report generation, actual received-email evidence and retained report history without silently regenerating/sending reports or altering financial records. The existing sending-only email key may not establish delivery status; owner inbox evidence or additional authorized read access can be necessary. Report-delivery and report-calculation correctness are distinct checks.

After publication and social metrics are validated, investigate clicks/pageviews/signup attribution using the existing funnel: social post/bio/first-comment link → `app.yfitai.com/go` → `www.yfitai.com` → `app.yfitai.com/signup`. Social impressions are not website visits; failed website-stat requests are not proof of zero visitors. Identify the owner's Google report type before choosing a measurement fix. Link/tracking/configuration changes need approval.

## Boundaries and saved state

This plan authorizes no action beyond the user's conditional follow-up request. It does not schedule Manus work, automatically inspect tomorrow's run, publish/backfill posts, alter the workflow or modify reporting/accounting code. Current Android bundle remains Build 109. Read the Master Reference, hub resume notes, `GENERATOR_ONLY_TEST_2026-11-16.md` and `SOCIAL_POSTING_STOPPAGE_2026-11-16.md` at the next session. If six independent native-platform investigations are needed, orchestrate one bounded read-only investigation per platform with consistent evidence fields and preserve any access failures.
