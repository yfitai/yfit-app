# YFIT Social Media Automation — Session Summary (Apr 4, 2026)

## What Was Accomplished Today

### 1. Railway Video Assembly Service — FULLY WORKING
- **URL**: `https://yfitai-yfit-video-service-production.up.railway.app`
- **Endpoint**: `POST /assemble`
- Accepts: `voiceover_url`, `video_items`, `text_items`, `caption_text`, `content_angle`, `run_date`
- Assembles branded YFIT MP4 (9:16 portrait) with voiceover audio
- Uploads finished video to Supabase Storage (`yfit-videos` bucket)
- Returns public video URL
- **Fix applied**: Parses `video_items`/`text_items` from JSON strings (n8n sends via `JSON.stringify`)
- **GitHub**: `https://github.com/yfitai/yfit-video-service`

### 2. n8n Workflow — MOSTLY WORKING (v2)
- **URL**: `https://n8n-railway-production-fbfd.up.railway.app/workflow/h7bRds9UOUfmP36F`
- **Backup**: `docs/n8n_workflow_backup_2026-04-04.json`
- Pipeline flow:
  ```
  Manual Trigger / Supabase Webhook
    → ElevenLabs Generate Voiceover
    → Upload Audio to Supabase Storage
    → Dry Run? (IF node)
    → Prepare Assembly Request (Code node)
    → Assemble Video (Railway ffmpeg) ✅ WORKING
    → Split by Video Platform ✅ WORKING
    → Upload-Post — Post Video ⚠️ NEEDS SOCIAL ACCOUNTS
    → Log Post Results
    → Webhook Response
  ```
- **Fixes applied today**:
  - Fixed broken node connection (Prepare Assembly Request → Assemble Video)
  - Fixed HTTP method (GET → POST) on Upload-Post node
  - Fixed URL (`v1.upload-post.com` → `api.upload-post.com/api/upload`)
  - Fixed `voiceover_url` construction in Prepare Assembly Request code node

### 3. Upload-Post Integration — PENDING SOCIAL ACCOUNT CONNECTIONS
- API key: stored in n8n credentials
- Profile name: `YFIT` (confirmed working)
- **Error**: "Profile YFIT has no TikTok account configured"
- **Action needed**: Log into upload-post.com and connect social accounts to YFIT profile

---

## What Needs to Be Done Tomorrow

### Priority 1: Connect Social Media Accounts in Upload-Post
1. Log into [upload-post.com](https://upload-post.com) with `support@yfitai.com`
2. Go to **Profiles → YFIT**
3. Connect the following accounts:
   - TikTok (`@yfitai` or your TikTok handle)
   - Instagram (`@yfitai`)
   - LinkedIn (YFIT company page)
   - Pinterest (YFIT board)
4. Once connected, run the n8n manual test again — it should post successfully

### Priority 2: Real Video Content (Background Visuals)
- Currently the video is a **static branded background** (dark navy + YFIT logo + caption text)
- For real social media posts, you need actual fitness video footage as the background
- Options:
  - **Option A**: Use Pexels video API (already in workflow as `pexels_query`) — fetch a relevant stock fitness clip
  - **Option B**: Upload your own fitness video clips to Supabase Storage
  - **Option C**: Keep static branded background (works fine for audio-first content like tips/advice)
- The Railway video service already supports `video_items` with platform-specific clips

### Priority 3: Test Full End-to-End with Real Post
1. Ensure Upload-Post social accounts are connected
2. Set `dry_run: false` in the Test Data node
3. Run the workflow — it should:
   - Generate ElevenLabs voiceover
   - Upload to Supabase
   - Assemble MP4 video
   - Post to TikTok + Instagram via Upload-Post
4. Verify the post appears on the social accounts

### Priority 4: Supabase Cron Trigger
- The workflow is triggered by a Supabase webhook (`/api/trigger-content`)
- Set up a daily cron job in Supabase Edge Functions to fire at 8 AM daily
- This will make the entire pipeline fully automated

---

## Key URLs & Credentials

| Service | URL / Info |
|---|---|
| Railway Video Service | `https://yfitai-yfit-video-service-production.up.railway.app` |
| n8n Workflow | `https://n8n-railway-production-fbfd.up.railway.app` |
| Supabase Project | `https://mxggxpoxgqubojvumjlt.supabase.co` |
| Upload-Post | `https://upload-post.com` (login: `support@yfitai.com`) |
| GitHub Video Service | `https://github.com/yfitai/yfit-video-service` |
| Supabase Videos Bucket | `yfit-videos` (public) |
| Supabase Voiceovers Bucket | `yfit-voiceovers` (public) |

---

## Example Working Video
A test video with real ElevenLabs voiceover was successfully generated:
`https://mxggxpoxgqubojvumjlt.supabase.co/storage/v1/object/public/yfit-videos/videos/2026-04-04_Test_3_quick_tips_to_boost_your_morning_workout_energy.mp4`

---

## Notes on Video Quality
- Current video is a **static image + voiceover audio** format
- This is actually common for "talking head" / tips content on TikTok/Instagram
- To add animated text overlays or real video backgrounds, update the Railway `server.js` ffmpeg command
- The video is 9:16 portrait format (1080x1920) — correct for TikTok/Instagram Reels
