# n8n daily posting schedule — November 13, 2026

**The owner-supplied settings explain the discrepancy.** The existing YFIT Social Media Automation v2 Schedule Trigger contains five-field cron `0 11 * * *`, and its explicit workflow timezone is `America/Chicago`. That means11AM Chicago daily, not the6AM stated in the node name. On November13,2026 that is noon Manitoba because Chicago isUTC−6 while Manitoba staysUTC−5. In Chicago's summer offset, the same configuration becomes11AM Manitoba, so merely retaining Chicago with a different fixed hour would not maintain6AM Manitoba year-round.

The trigger screenshot shows the generic six-field format hint, but n8n explicitly makes the seconds field optional and documents five-field daily examples such as `0 6 * * *`. The current expression is therefore a valid11AM cron, not a malformed6-field schedule. Workflow timezone takes precedence over the instance default. [1]

The owner is correct that Manitoba switched to year-roundUTC−5, legally Manitoba Standard Time/MBT, effectiveOctober31,2026. [2] [3] That creates a one-hour Chicago–Manitoba difference in winter, not the five-hour node-label gap. The label and actual trigger settings are mismatched; a stale Manitoba timezone database is not needed to explain the observed11AMChicago/noonManitoba run. Whether the original11 was entered intending UTC is unknown.

## Approved correction — saved/published verification pending

For a stable6AMManitoba start independent of the n8n container's Winnipeg timezone database update, set this existing workflow's timezone to UTC (`Etc/UTC` in the selector) and retain the complete current cron field `0 11 * * *`.11UTC equals6AMManitoba at permanentUTC−5. Rename the clock node to `Daily Schedule Trigger (6 AM Manitoba / MBT)` so its label matches intent. No instance/server timezone, other workflow, platform account, credential or VPN change is needed. This workflow-scoped timezone change can also affect timezone-aware expressions in this same workflow; verify the proposed change and preserve unrelated settings before publishing.

At16:19 the owner explicitly approved correcting the existing schedule to6AMManitoba. This authorizes the exact workflow-scoped timezone/label correction and save/publish, not a manual execution, backfill, additional trigger or downstream test. Guide the owner's signed-in tab; the automation browser does not share that login. Do not claim applied until the selected timezone and saved/published state have been confirmed. Earlier pending-approval wording below is historical.

n8n restored missing UTC/GMT workflow choices in release1.85.0; its source discussion confirms the earlier selector issue and released correction. [4] [5] If the installed selector does not offer the UTC choice, stop and inspect the available values rather than guessing an offset or updating the server. An alternative fixedUTC−5 timezone can be evaluated, but was not selected or applied.

The workflow must be saved and published for the corrected schedule to take effect. Do not manually Execute step/Test trigger/Execute workflow or add another schedule; this is a correction to the existing daily trigger, not a backfill. [1] Owner approval is required before changing or publishing anything. No timing, workflow configuration or publication was changed in this investigation.

The same settings screenshot also shows YFIT Error Notification Handler selected and saving enabled for failed production, successful production and manual executions. That establishes configuration intent, not notification delivery or retention proof. Those settings must be preserved.

The independent scraper-only test already passedHTTP200/success:true/10saved in5.376seconds, with no generation/n8n invocation or observed Upload-Post publication during the inspected test window. Downstream generation, assembly and six-platform outcomes remain open. Keep the tested scraper deployed; do not repeat it to investigate timezone settings.

## References

[1]: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/ "n8n Schedule Trigger, optional seconds, timezone precedence and publication requirement"
[2]: https://web2.gov.mb.ca/laws/statutes/ccsm/o030.php "Manitoba Official Time Act, current UTC−5 rule"
[3]: https://web2.gov.mb.ca/laws/statutes/proclamations/2023c4%282026-10-31%29.php "Manitoba commencement proclamation, October31,2026"
[4]: https://community.n8n.io/t/default-timezone-issues/51334 "n8n timezone selector discussion and release1.85.0 fix"
[5]: https://github.com/n8n-io/n8n/pull/13999 "n8n merged correction restoring missing UTC/GMT workflow timezone choices"
