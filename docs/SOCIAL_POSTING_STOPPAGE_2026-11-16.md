# Why YFIT social posts are currently stopped

**November 16, 2026:** the selected scheduled execution fails at content generation because the OpenAI API organization has no prepaid credits remaining. The owner-provided n8n screenshot shows execution **1203**, started at **06:00** in the displayed timezone, with `OpenAI error: 429`, type `insufficient_quota` and code **`credit_balance_exhausted`**. Its scraper node is green; **Call Supabase — Generate Content** is red. This establishes the current blocker without executing or retrying the workflow.

OpenAI explicitly distinguishes this error from temporary request rate limits. The remedy is restoring the correct API organization's credit balance; retrying, changing the posting clock or changing models does not restore an exhausted balance. The billing dashboard has not been inspected, so whether credits were consumed, expired, or an automatic recharge failed remains unknown. [1] [2]

## Why all six platforms stop together

All six platforms depend on the shared content-generation stage. The canonical `supabase/functions/generate-social-content/index.ts` calls OpenAI before saving captions/scripts or triggering the video pipeline. A rejected OpenAI response throws, and the Edge handler returns HTTP 500. The n8n request therefore stops before voiceover, assembly and Upload-Post publication. That shared failure explains six silent platforms without requiring six separate connection failures. The selected execution screenshot supports this stage diagnosis; source inspection explains its mechanism but is not an independent retrieval of deployed Edge code.

The fresh provider check agrees with the owner's platform review: the expected YFIT profile has **no November upload records through 22:30:59 UTC on November 16**, including none from November 14–16. The inspected October 29–31 window contains 18 successful public-URL evidence rows, three per platform. The October 31 filter returns six successful records, one each for TikTok, Instagram, YouTube, Facebook, Pinterest and LinkedIn. Each platform's latest recorded publication is October 31. Profile-filtered and account-wide results agree; pagination is exhausted and no status filter hid failed rows. This is current-provider-account evidence, not an audit of manual/direct publication elsewhere. [4] [5]

All six connected accounts report `reauth_required:false`. TikTok's optional first-comment capability is still missing, with a reconnection warning on its last successful video; that is a separate CTA issue and does not explain all six videos stopping. [6]

## What the November 13 repairs accomplished

The November 13 selected execution previously failed at the scraper with the named duplicate-URL constraint. The owner-pasted live Edge code proved that deployment lacked the committed conflict-ignore guard. The owner deployed the duplicate-safe replacement, and the separately authorized scraper-only test returned HTTP 200 with ten newly saved articles. Those earlier results are recorded in `SCRAPER_REPAIR_2026-11-13.md` and `SCRAPER_ONLY_TEST_2026-11-13.md`.

Today's screenshot shows the scraper completed and the next generation node failed. The repair therefore removed the observed scraper obstruction for this selected run but did not fund OpenAI. This is a second, downstream blocker—not evidence that the scraper repair failed.

The execution list displays November 14, 15 and 16 starts at **06:00**, versus November 13 at **12:00**. That supports the corrected scheduled start taking effect after the owner saved/published `Etc/UTC` with cron `0 11 * * *`. The screenshot shows all three later runs errored, but only November 16's exact node/error is visible. Do not label November 14 or 15 as quota failures without opening their retained results. See `N8N_SCHEDULE_FINDINGS_2026-11-13.md`.

The exact reason the first November run failed remains unverified. The selected November 13 scraper error and selected November 16 quota error must not be retroactively applied to every missing day. Inspect the earliest available failed execution and the billing usage/credit history to establish that timeline; unavailable older retained data is not proof of no run.

## Next safe action

Open the **API billing overview** for the OpenAI organization that owns the key configured for the existing Supabase generator:

https://platform.openai.com/settings/organization/billing/overview

Check organization identity, current balance, credit/usage history and auto-recharge status. Do not copy any key, payment details or account secrets into chat. If the displayed balance is positive, verify the correct organization/project before changing anything; do not blindly replace keys or fund an unrelated account. ChatGPT and API billing are separate, even when an eligible subscription offers credits to a linked API organization. [3]

If the correct organization has no credits, the owner can choose a credit purchase and whether to enable bounded automatic recharge. No amount, payment method, purchase, auto-recharge or spend limit was selected or changed during this investigation. OpenAI notes that a successful purchase may take a few minutes to appear and purchased credits have an expiration policy. [2]

Once billing is resolved, either inspect the next normal scheduled run or obtain separate approval for a specifically isolated generator test. Even generator `dry_run` invokes a paid model before skipping persistence/webhook calls. Do not press Execute/Retry on the whole workflow to test billing: that can produce public posts. No catch-up/backfill is authorized. A successful generator alone still does not establish six terminal publication URLs.

The configured YFIT error-notification workflow also needs a read-only delivery check: saved error-handler configuration is not proof an alert arrived. Any change to alerting or billing monitoring requires its own approval. Reports remain deferred until posting is restored and terminal provider results are verified.

## Evidence and access limits

The n8n API made one GET and returned HTTP 401; no substitute credential or retry was used. The connected browser remained at sign-in, so execution evidence is the owner's screenshot, not an authenticated API export. Do not ask repeatedly for login when a supplied screenshot establishes the current error.

One bounded provider batch made eleven GET requests, all HTTP 200, without retries, redirects, posting, reconnection, generation or assembly. Raw provider responses and credentials were not persisted. No billing action, manual run, workflow/source/deployment change or build increment occurred. Build 109 is unchanged.

Sanitized evidence is preserved in the private yfit-ai hub under `docs/evidence/2026-11-16-social/`: provider findings/JSON, owner execution screenshot/JSON and n8n access result. Code/deployment fixes are not proposed for the confirmed balance error; first restore the correct billing balance and verify processing.

## References

[1]: https://help.openai.com/en/articles/5955604-troubleshooting-api-rate-limits-and-429-errors "OpenAI distinctions between temporary rate limits and exhausted API credits"
[2]: https://help.openai.com/en/articles/8264644-how-can-i-set-up-prepaid-billing "OpenAI prepaid billing, expiration and automatic recharge guidance"
[3]: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform "Separate ChatGPT and API organization billing"
[4]: https://docs.upload-post.com/api/upload-history "Upload-Post history filters, account scope and pagination"
[5]: https://docs.upload-post.com/api/upload-status "Upload-Post terminal outcomes and public URL evidence"
[6]: https://docs.upload-post.com/api/user-profiles "Upload-Post connected-account and optional TikTok comment capabilities"
