# YFIT Social Media Setup — Current Status & Action Plan
Last updated: Apr 9, 2026

## Platform Status (Upload-Post YFIT Profile)

| Platform | Account | Upload-Post | Video Support | Notes |
|----------|---------|-------------|---------------|-------|
| TikTok | ✅ "Smokey" account | ✅ Connected | ✅ Yes | Needs editing permissions — available Apr 15 |
| Instagram | ✅ yfit.ai | ✅ Connected | ✅ Yes (Reels) | Ready |
| LinkedIn | ✅ Don Camp... | ✅ Connected | ✅ Yes | Ready |
| YouTube | ✅ YFIT AI | ✅ Connected | ✅ Yes | Ready |
| Pinterest | ✅ yfitai | ✅ Connected | ✅ Yes (Video Pins) | Ready |
| Facebook | ❌ Locked out | ❌ Not connected (greyed out) | ✅ Yes | Locked out — skip for now |
| X (Twitter) | ❌ | ❌ Not connected (greyed out) | ⚠️ Limited | Not a priority |
| Threads | ❌ | ❌ Not connected | ⚠️ Text-focused | Not a priority |
| Bluesky | ❌ | ❌ Not connected | ⚠️ Text-focused | Not a priority |
| Reddit | ❌ | ❌ Not connected | ⚠️ Niche | Not a priority |
| Google Business | ❌ | ❌ Not connected | ⚠️ Limited | Not a priority |

## Active Platforms for Video Posting (n8n workflow)

These 4 are ready to receive video posts right now:
1. **Instagram** (Reels)
2. **LinkedIn** (video posts)
3. **YouTube** (Shorts)
4. **Pinterest** (Video Pins)

TikTok will be added **April 15** once editing permissions are resolved.
Facebook is locked out — defer until access is recovered.

## Video Service (Railway v2.3.0 — live)
- [x] YFIT logo watermark (top-left, 88% opacity)
- [x] Caption cycling — all tips parsed correctly (numbered, bullets, prose)
- [x] Proportional word-count timing for captions
- [x] Font size 46px (reduced from 58px)
- [x] Pexels portrait fitness backgrounds (6 clips per video)
- [x] Uploads to Supabase yfit-videos bucket

## n8n Workflow Status
- [ ] Set dry_run: false to go live
- [ ] Confirm video_items platforms match connected accounts (instagram, linkedin, youtube, pinterest)
- [ ] Add TikTok to video_items on April 15
- [ ] Enable daily 6 AM CDT cron job

## API Keys (all confirmed valid)
- [x] Pexels: `gqY0X3U13VfUjejR1rvec2X6I1yuJpGWXrO4vQ4esOl4XDE8UXsoji0N`
- [x] ElevenLabs: `sk_c73588c45da807e6ba8119f20e1fe445fb496d336c837d11`
- [x] Upload-Post JWT: embedded in n8n workflow
- [x] Supabase service key: in Railway env vars
