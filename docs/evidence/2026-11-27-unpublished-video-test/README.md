# YFIT current-workflow backup and unpublished video test

Prepared November 27, 2026 for Don Campbell. **Daily posts stay paused.** This package contains a credential-free snapshot of the supplied current workflow and a separately named, local review-only test draft. It does not install or replace the live workflow.

## Current workflow inspection and backup

The owner supplied the current Download/export at 18:16 EST. `current-workflow-redacted.json` preserves the 25 nodes, node identities, settings and exact connection topology of **YFIT Social Media Automation v2**, ID `h7bRds9UOUfmP36F`, version `d749db3b-3b3e-4a16-968a-dcdd603b92ea`. Its exported `active` flag is false. This corroborates the owner-confirmed pause, not an independent authenticated live-instance check. The file has no `activeVersionId` field, so it does not certify the last published revision.

Hard-coded credential values, live webhook identifiers/path and optional execution data were excluded. `current-export-receipt.json` records the original attachment hash, redacted snapshot hash, 12 redaction events and topology checks without secret values. The raw owner attachment was not copied into Git or this package. Keep the original privately; a redacted restoration requires authorized credential/header rebinding and webhook review. Do not import this backup over the existing workflow as a test.

Read [the media mapping inspection](CURRENT_MEDIA_MAPPING_INSPECTION.md) and [the trigger/isolation inspection](CURRENT_TRIGGER_AND_ISOLATION_INSPECTION.md). The fixed `0 11 * * *` / `Etc/UTC` schedule is 06:00 at the owner's chosen permanent UTC−5 offset and was preserved. The weekly report is separate and unchanged.

## Important current-config findings

All six allowed platforms are video-routed. Five share one main video URL; YouTube receives a second no-burn-captions assembly URL. Narration selects one Instagram-preferred script and a randomized male/female ElevenLabs voice. Platform CTA text is added after rendering, so it does not create platform-specific spoken/visible endings.

The existing manual sample has `dry_run:false` and bypasses the webhook kill-switch. That switch's executable constant is true. Dry-run IF gates come after TTS, audio storage and rendering; the splitter also omits the dry-run flag. **Do not Execute the current workflow to test this package.** These are saved-config findings, not newly observed live failures; no production repair was applied.

## Unpublished test artifacts

- `prototype/n8n-unpublished-review-planner.json`: separately named, inactive two-node draft: Manual Trigger → pure JavaScript Code. No HTTP Request, webhook, schedule, credential, model/speech/render invocation, uploader or database writer.
- `prototype/six-platform-review-plans.json`: six distinct article-led review plans, each with shared body, account explanation, platform-specific spoken/on-screen CTA and a distinct media-variant key. These are **plans, not MP4s**.
- `prototype/cta-routes.json`: fixed reviewed audience wording, dated owner evidence and official sources. Instagram's Go-profile route remains held; TikTok uses an honest manual-address fallback.
- `prototype/fixture.json`: the already-reviewed Women's Health article and exact genuine Nutrition/Daily Tracker screenshot hashes, with fictional records. Achird is candidate-only, not an executable ElevenLabs voice binding.
- `prototype/planner.mjs`, `planner.test.mjs` and `build-review-draft.mjs`: reusable local-only planner, tests and packager. `test-results.txt` records **114 passed, 0 failed**. `embedded-code-qa.json` records six outputs and exact local module/embedded-Code agreement.
- `prototype/inspect-current-export.py` and `validate-package.py`: local redaction and package validation utilities; neither calls n8n or a paid service.

From this directory, run `node --test prototype/planner.test.mjs` then `node prototype/build-review-draft.mjs`. Both use only local data. Local VM evaluation is not proof of an import or execution on the actual n8n version. Every output stays `review_only:true`, `publishing_allowed:false`, `production_ready:false`, with model/render/database permissions false. `production_workflow_adapter_verified:false` describes the unimplemented production adapter, not a missing current export.

Read [the platform-ending test plan](NEW_VIDEO_TEST_PLAN.md), [the factual prompt draft](FACTUAL_GENERATOR_PROMPT_DRAFT.md) and [the exact adapter handoff](ADAPTER_HANDOFF.md).

## What remains before an automated video review

The actual renderer does not accept the planner's scene plan, custom visible CTA or six-variant output map. The draft needs a separate renderer/compositor adapter, explicit provider/approved stable male voice binding, measured per-variant timing and unique output identities. The sample Achird voice cannot simply be used as an ElevenLabs voice ID. No new narration or MP4 was generated, and no remote draft was created/imported/executed.

Saved publishing URLs use `yfitai.com/go` with approved UTMs and `#quick-setup`; the prototype's proposed destination is `app.yfitai.com/go`. These are recorded separately, not silently replaced or assumed equivalent. Existing account/profile links and publishing settings remain untouched. Resolve this before any real publish mapping.

The corrected 27.4-second review v2 and all eleven live-verified screenshots remain intact. No production source, Go/analytics, pricing/offer, phone Build 109, posting account, schedule or weekly-report change was made. Review actual future rendered variants and supported current-app Go measurements before the agreed owner-approved restart. Compare formats within existing posting volume, not two daily posting workflows. No automatic restart, Execute/Retry/backfill or catch-up posting was created.

## Save scope

Only the existing canonical `yfitai/yfit-app` feature branch `fix/go-analytics-2026-11-26` is used for this documentation/test backup; no main merge or deployment. Safe docs-hub resume notes remain local under the previously reported historical backup blocker. No hub history rewrite or push, admin/video source change, or all-main end-work claim.
