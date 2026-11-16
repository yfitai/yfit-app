# Generator-only verification — November 16, 2026

**The approved generator-only test passed after the owner restored the API credit balance.** One POST to the existing YFIT Supabase `generate-social-content` function returned HTTP 200, `success:true`, `dry_run:true` and six content items. Each expected platform appeared exactly once: TikTok, Instagram, YouTube, LinkedIn, Pinterest and Facebook. Every item contained a nonempty title, caption and script plus a nonempty string array of hashtags. No retry or second generation request was made.

The request ran from **23:00:28.663 UTC to 23:00:37.923 UTC**, taking **9.259 seconds**. The only payload was:

```json
{
  "dry_run": true,
  "run_date": "2026-11-16"
}
```

This establishes that the selected function can now read an article and complete generation. It is not a full video/publication test, proof of automatic recharge, a production persistence test, or an editorial/medical-claim review. Exact paid token usage/cost was not exposed by the function response and is not asserted. Earlier exhausted-credit and scraper errors remain valid diagnoses of the selected earlier failures, not proof that every November failure had the same cause.

## Isolation established before the request

The owner supplied the full deployed Code after the assistant requested source verification. It identifies itself as `generate-social-content — v2.2.0` and matches the canonical GitHub file after line-ending/outer-whitespace normalization. SHA-256 of the uploaded text: `387cc58fdfce9fb98c6b0e395ff290f771ab7de073ac8ecbdf3d90471293957c`. No credential values were present in that uploaded source. This is owner-provided deployed-code evidence, not an authenticated management API export.

Its boolean test is `body.dry_run === true`. The article fetch is read-only. Generation calls OpenAI once. Both `saveToDatabase(...)` and `triggerN8nWebhook(...)` are inside `if (!dryRun)` guards. There are no other write/webhook calls in the reviewed dry-run path. The response includes draft content only in dry-run mode.

An isolated actual-source test transpiled the uploaded TypeScript with imports removed, supplied fictional article/model data, mocked every fetch and made **zero network calls**. The true dry-run made one mocked article read and one mocked model request with zero database writes/webhooks. A false-mode discriminating control observed six mocked database writes and one mocked webhook, confirming the harness can distinguish those effects. No real non-dry-run request occurred.

The live runner required that source comparison and passing isolation result, validated only the app's public anonymous client credential for the expected project without printing it, and made a read-only Auth settings check. It wrote an exclusive attempt ledger before the single POST. The ledger prevents rerunning that script from sending another model call. The assistant did not use the unrelated Manus/built-in model credential, extract an OpenAI key or invoke `generate-social-posts`.

## No publication observed during the test

A single GET of the current Upload-Post account's history covered **22:58:28.663–23:01:12.263 UTC**, with no profile/status filter. It returned HTTP 200, total/history zero and zero in-progress rows; pagination was exhausted. The documented `start` and `end` filters were used. [1]

The reviewed source guards and live `dry_run:true` response establish the scoped no-save/no-handoff behavior; no direct database-mutation audit or n8n execution export was available. The provider check independently found no upload records in this account/test window. Do not interpret that as an audit of native/manual publication everywhere. No n8n Execute/Retry, voiceover, assembly, public upload, comment, backfill or new schedule was invoked by this test.

## What is `generate-social-posts`?

The owner reports a second deployed Edge Function with that name. It is not in the canonical app's function directories, and bounded searches of permitted current repository source/docs found no caller or documented role. A separately deployed name is a separate endpoint; similar names alone do not establish whether it is older, active, redundant or another processing stage.

The uploaded code and successful test concern **`generate-social-content` only**. The other function remains **untracked/unknown relative to the current canonical repositories**. Leave it deployed and unchanged. Request its full deployed Code and inspect safe caller/last-invocation metadata before recommending cleanup or consolidation. Also verify the exact destination path of the live n8n generator node if resolving caller identity; its display name is not proof of the endpoint URL. No API keys or headers are needed in that evidence.

## Remaining processing gates

The live paid-generation check is complete; do not repeat it. The next existing 6 AM Manitoba scheduled execution must still establish persistence, voiceover, assembly and six terminal public publication URLs/statuses. Funding and a six-item dry-run response do not clear those stages. Any earlier manual pipeline test or public publishing requires new explicit scope/approval, with verified isolation for each proposed non-public test.

Still unresolved: why auto-reload left the balance at zero, exact earliest November failure, error-handler notification delivery, TikTok optional first-comment permission, and the separately deployed function's role. Reports remain the user's next priority after posting processing is verified. Build 109, app/admin code, secrets, provider settings and workflows were not changed.

Sanitized source snapshot, actual-source isolation harness/result, one-shot runner/attempt/result, publication-safety read and separate-function note are preserved privately under `yfit-ai/docs/evidence/2026-11-16-generator-only/`. All credentials and raw generated drafts are excluded.

## References

[1]: https://docs.upload-post.com/api/upload-history "Upload-Post read-only date-filtered history and pagination"
