# YFIT unpublished video test — platform-specific endings

Prepared November 27, 2026 for Don Campbell. **Daily posts remain paused.** The supplied current n8n export has now been inspected and sanitized. This package prepares a separate local test draft; it does not restart posting, install a workflow, generate paid media, change links or modify Go, pricing, reporting or phone Build 109.

## Yes — the final instruction should match the platform

Use one article-led actual-app demonstration, followed by the action viewers can really take on that platform. Keep **“Saving your own data needs an account.”** spoken and visible immediately before the final platform instruction. The account explanation is not the clickable-route instruction. Do not use “link in bio” everywhere.

| Platform | Spoken final instruction | Route condition |
|---|---|---|
| Pinterest | “Tap Visit site on this Pin to explore YFIT.” | Use the Pin destination. Owner verified Go opening; preserve existing `pinterest_link` and attribution placement.[1] |
| Instagram | “Tap the link in our profile to explore YFIT.” | **Held candidate:** current profile root opened the app, not a verified Go destination. Correct-Go profile approval/verification remains separate.[2] |
| Facebook | “Tap the YFIT link in the first comment to explore.” | Owner verified that comment route. Preserve placement; comment ordering/visibility can vary.[3] |
| LinkedIn | “Tap the YFIT link in this post to explore.” | On screen: “Open the post text → tap the YFIT link.” Expand text, not the three-dot sharing menu. No second article-reading CTA.[4] |
| YouTube Shorts | “Tap our channel name, then the Go link in our profile.” | Owner verified the channel-profile route. Do not promise clickable Shorts description/comment URLs.[5] |
| TikTok | “Open this address in your browser to explore YFIT.” | Clearly display **app.yfitai.com/go**. No clickable Website/bio field was verified, so this is a manual-address fallback, with more friction and potentially lost attribution.[6] |

These are review-only candidates. November 26 owner checks are dated evidence, not a new viewer test or certification of future publishing fields. No profile/account link was changed.

## What the current workflow actually does

The owner supplied **YFIT Social Media Automation v2**, ID `h7bRds9UOUfmP36F`, version `d749db3b-3b3e-4a16-968a-dcdd603b92ea`, at 18:16 EST. Its export has **25 nodes and `active:false`**. The sanitized backup preserves identities and exact connections; the receipt records original/redacted hashes and exclusions. It corroborates the pause but is not an independent live API read or certification of the last published revision. No `activeVersionId` field is present. n8n warns that exports may contain hard-coded headers and credential references; those values were excluded.[9]

The parser video-routes all six platforms, including LinkedIn and Pinterest, and leaves text items empty. It picks one Instagram-preferred narration script and a randomized male/female **ElevenLabs** voice. A gender-only override does not pin a male voice. Five platforms share the main assembled video; YouTube uses a second `burn_captions:false` assembly. Current CTA and first-comment strings are added **after rendering** and therefore cannot change its spoken/on-screen ending. Extracted YouTube SRT is not actually mapped into an upload subtitle field.

The saved publishing URLs use **yfitai.com/go**, approved per-platform UTMs and `#quick-setup`; Pinterest has a literal `pinterest_link`. The local prototype proposes **app.yfitai.com/go**. These strings are not assumed equivalent and no publishing field was replaced. Preserve verified placement and attribution until the discrepancy is explicitly reconciled.

The schedule remains `0 11 * * *` with `Etc/UTC`: **06:00 at the owner's chosen permanent UTC−5 offset**. No timezone correction is needed for that intended fixed offset, and none was performed. Separate weekly reporting remains unchanged.

## Why the new test is separate

The current workflow is **not a cost-free isolated test**: its manual sample sets `dry_run:false`, the webhook kill-switch's actual constant is true, and manual/schedule paths bypass it. Dry-run IF gates sit after ElevenLabs, audio upload and both assemblies; the platform splitter omits the dry-run flag. Do not Execute the current workflow to review this draft.

The prepared n8n JSON has **two nodes only: Manual Trigger → pure JavaScript Code**. It has no active schedule/webhook, HTTP request, credential, model/speech/render call, upload or database writer. Every output remains blocked for production/publication. n8n documents Manual Trigger as nonautomatic and supports JavaScript Code nodes.[7] [8] No remote import, creation or execution was performed.

## What passed offline

The fixed reviewed Women's Health article produces six plans using the genuine Nutrition/Daily Tracker assets and fictional records. Every plan has the common body, account explanation, distinct spoken/on-screen instruction and distinct media-variant key. **114 local tests passed; zero failed.** The embedded draft Code output exactly matches the module's six outputs. A regression test includes the actual publisher URL's legitimate numeric article ID.

This does **not** mean six new videos exist or that the full automated renderer is implemented. The corrected existing review remains 27.4 seconds. No new voiceover or MP4 was generated. Final pacing, reading holds and caption visibility require actual future rendered review. Original app colors, licensed topic footage and sample labels must remain; static screenshots are not evidence of successful taps, saving or health outcomes.

## Remaining implementation work, not production edits

The factual prompt draft avoids invented first-person testimonials and unsupported medical outcomes, connects each suitable article to a verified feature, and holds unsuitable topics. Final account/route wording stays outside the model. An explicit scene-template key replaces the old free-text title as renderer selection.

A separate adapter must pin a coherent provider/approved stable male voice. The review sample's **Achird** candidate is not already wired into ElevenLabs; do not silently swap provider or pass its name into an ElevenLabs voice URL. Per-variant audio needs matching timings and unique storage identities. The current renderer does not accept custom `scene_plan`, visible CTA tails or a six-output media map; passing unsupported fields is not an implementation. Missing approved screens must hold the new format, not silently render a screenshot-free fallback. See `ADAPTER_HANDOFF.md` and the two inspection notes for exact handoff boundaries.

Review actual generated variants without production invocation/upload, verify supported current-app `/go` measurements and the weekly report's separate data-feed limitations, then obtain the agreed restart decision. Dashboard access alone does not prove a supported weekly PDF feed. When approved, compare old/new formats at existing posting volume, not two daily workflows publishing together. Keep destinations, offers and Go content stable for the first creative comparison. No Publish, Execute, Retry, backfill, catch-up posts or automatic restart is part of this preparation.

## References

[1]: https://help.pinterest.com/en/article/fix-a-broken-link "Pinterest: Fix a broken link"
[2]: https://help.instagram.com/362497417173378/ "Instagram: Add a website to your profile"
[3]: https://www.facebook.com/help/192946630752330 "Facebook: Share a link"
[4]: https://www.linkedin.com/help/linkedin/answer/a525301 "LinkedIn: Share articles or links"
[5]: https://support.google.com/youtube/answer/13748639?hl=en "YouTube: Sharing links with your audiences"
[6]: https://support.tiktok.com/en/getting-started/setting-up-your-profile/linking-another-social-media-account "TikTok: Link a website or social media account"
[7]: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger/ "n8n: Manual Trigger"
[8]: https://docs.n8n.io/code/code-node/ "n8n: Code node"
[9]: https://docs.n8n.io/workflows/export-import/ "n8n: Export and import workflows"
