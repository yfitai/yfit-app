# YFIT Project — Settled Decisions Reference

> **READ THIS FIRST** at the start of every session before making any changes.
> These decisions are final unless the user explicitly says to change them.

---

## Brand & Visual Identity

| Decision | Value | Notes |
|----------|-------|-------|
| Logo file | `yfit-logo-transparent.png` in Supabase `yfit-videos/assets/` | Cropped tight (1144x388px), RGBA with transparent background |
| Logo in videos | Transparent background — NO background box or pill behind it | `colorchannelmixer=aa=0.88` in ffmpeg (88% opacity) |
| Logo position | Top-left, 30px padding | `overlay=x=30:y=30` |
| Logo scale | 260px wide | `scale=260:-1` |
| Brand color | Blue gradient (#00AAFF → #0066CC) with dark grey (#3D3D3D) | Wing = dark grey, Y = blue gradient, FIT = dark grey |
| CTA text | `yfitai.com - Try free` | Green (#00ff88), bottom center of video |

---

## Video Assembly (Railway ffmpeg Service)

| Decision | Value | Notes |
|----------|-------|-------|
| Video format | 1080x1920 vertical (9:16) | For Reels/Shorts/TikTok |
| Frame rate | 30fps | |
| Duration | Matches voiceover audio length (~21s) | |
| Video source | Pexels API (fitness search query) | `PEXELS_API_KEY` env var on Railway |
| Audio | ElevenLabs voiceover, stored in Supabase, passed as URL | |
| Caption style | **Cycling** — sentence-based segments timed to word-level timestamps | Uses `buildCyclingCaptionFilters()` in server.js |
| Caption source | Full voiceover `script` field (NOT the Instagram caption text) | Fixed Apr 10, 2026 |
| Caption timing | **FIXED Apr 11, 2026** — uses ElevenLabs `/with-timestamps` word-level data | Railway service v2.4.0 deployed |
| Caption area | Black bar at bottom (80% opacity, 340px tall) | `drawbox=x=0:y=ih-340:w=iw:h=340:color=black@0.80` |
| Caption font | DejaVuSans-Bold | |
| Video codec | H.264 (libx264), preset fast, CRF 22 | |
| Audio codec | AAC | |
| Railway service URL | https://yfitai-yfit-video-service-production.up.railway.app | Version 2.4.0 |

---

## Social Media Platforms

| Platform | Account | Notes |
|----------|---------|-------|
| Instagram | @yfitai | Posts as Reel |
| LinkedIn | YFIT AI company page | Posts as video |
| YouTube | YFIT AI channel | Posts as Short |
| Pinterest | YFIT AI board | Posts as video Pin |

All 4 platforms post in a single workflow run via Upload-Post API.

---

## n8n Workflow (h7bRds9UOUfmP36F)

| Decision | Value | Notes |
|----------|-------|-------|
| Trigger | Supabase webhook (production) | Also has manual test trigger |
| Schedule | Daily (check n8n schedule node for exact time) | |
| `dry_run` source | `parseData.dry_run ?? false` | Fixed Apr 10 — was referencing non-existent "Test Data" node |
| Script field | Passed as `$json.script` to Railway `/assemble` endpoint | Fixed Apr 10 — enables caption cycling |
| Platforms split | One item per platform from `Split by Video Platform` node | 4 items → 4 Upload-Post API calls |
| ElevenLabs endpoint | `/v1/text-to-speech/{voice_id}/with-timestamps` | Returns JSON with audio_base64 + alignment data |
| ElevenLabs Accept header | `application/json` | NOT `audio/mpeg` — required for with-timestamps |
| Voice selection | Random from 5 male + 5 female pool | See voice pool below |
| word_timing | Passed from `Process ElevenLabs Response` node to Railway `/assemble` | Array of `{word, start, end}` objects |

### ElevenLabs Voice Pool (as of Apr 11, 2026)

**Male voices (5):**
- `TX3LPaxmHKxFdv7VOQHJ` — Liam (Energetic Social Media Creator)
- `nPczCjzI2devNBz1zQrb` — Brian (Deep, Resonant, Social Media)
- `IKne3meq5aSn9XLyUdCD` — Charlie (Deep, Confident, Energetic — Australian)
- `CwhRBWXzGAHq8TQ4Fs17` — Roger (Laid-Back, Casual)
- `cjVigY5qzO86Huf0OWal` — Eric (Smooth, Trustworthy)

**Female voices (5):**
- `FGY2WhTYpPnrIDTdsKH5` — Laura (Enthusiast, Social Media)
- `cgSgspJ2msm6clMCkdW9` — Jessica (Playful, Bright, Warm)
- `XrExE9yKIg1WjnnlVkGX` — Matilda (Knowledgeable, Professional)
- `Xb7hH8MSUJpSbSDYk0k2` — Alice (Clear, Engaging Educator — British)
- `hpp4J3VqNfWAUOO0d1Us` — Bella (Professional, Bright)

---

## Infrastructure

| Service | URL / Location | Notes |
|---------|---------------|-------|
| n8n | https://n8n-railway-production-fbfd.up.railway.app | Railway hosted |
| Railway ffmpeg service | https://yfitai-yfit-video-service-production.up.railway.app | Node.js + ffmpeg v5.1.8, v2.4.0 |
| Supabase project | mxggxpoxgqubojvumjlt | Videos in `yfit-videos` bucket |
| Supabase legacy service_role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEyMjk2NiwiZXhwIjoyMDcyNjk4OTY2fQ.2wMo_cE2q9xpVAj5fMrOwrASN8Dps010sTPVxw9Cmp0` | Legacy JWT key (Settings → API Keys → Legacy tab) |
| Marketing website | https://3000-iq4a5h66bo4d4u899y75b-ee396473.us2.manus.computer | Manus webdev project `yfit-marketing` |
| n8n API key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMGFkMDBiYy1mY2VjLTQ5NzgtODllYy01YjI0MDM0MWZmNmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTc3ZmI3OTctMjQ2Zi00YzQ0LTllNTEtMDQ2Y2Y5NzI0ZDVkIiwiaWF0IjoxNzc1MjY4NDIzLCJleHAiOjE3ODI5NjQ4MDB9.ka40DvpbJ7LnxxxY1FqHo31GI5Hi71ApYCFTqnl2MhQ` | For n8n REST API calls |
| ElevenLabs API key | `sk_c73588c45da807e6ba8119f20e1fe445fb496d336c837d11` | Used in n8n ElevenLabs node |

---

## Content Strategy

| Decision | Value |
|----------|-------|
| Content sources | Healthline, WebMD, Mayo Clinic, ACE Fitness, Verywell Fit (RSS/scrape) |
| Post format | 5-tip listicle format ("5 [topic] tips") |
| Voiceover voice | Random from 5 male + 5 female ElevenLabs pool (changes each post) |
| Pexels search query | Derived from content topic (e.g., "fitness workout morning") |

---

## Things NOT to change without asking the user

1. Logo transparency — it is intentionally transparent (no background box)
2. Caption cycling — captions should change through the video, not be static
3. All 4 platforms must post in every run
4. The `script` field (not `caption`) drives the video captions
5. Video is vertical 9:16 format only
6. Voice randomisation — always pick randomly from the 5+5 voice pool

---

## YouTube Auto-Captions

YouTube removed the channel-level disable toggle for auto-captions (as of 2026). Auto-captions only show when a viewer manually enables CC — they are NOT on by default. This means viewers see only the burned-in captions unless they click CC. No further action needed unless viewers report double-caption complaints.

---

## Performance Tracking

| Date | Views | Notes |
|------|-------|-------|
| Apr 10, 2026 | 177 overnight | First real post — captions not yet synced |
| Apr 11, 2026 | — | Caption timing fixed, voice pool expanded to 5+5 |

---

*Last updated: Apr 11, 2026 (caption timing fixed, voice pool expanded)*

---
## Session: Apr 11, 2026 — v2.6.0 Fixes (5 Issues from Instagram Review)

### Issues Found After Watching Instagram Video
1. **BGM not audible** — `loudnorm` on the mixed output was crushing the BGM to inaudible
2. **Captions running ahead** — Word-position matching drifted because punctuation/contractions didn't align
3. **Lowercase captions** — `sanitizeForDrawtext()` never capitalized
4. **Dark first clip** — `eq=brightness=-0.06` was darkening all clips
5. **Irrelevant Pexels clips** (desk for HIIT) — `pexels_query` was not being sent from n8n at all

### Fixes Applied (server.js v2.6.0)
| Fix | Change |
|-----|--------|
| BGM audibility | Raised BGM_VOLUME from 0.15 to 0.35. Removed loudnorm from mixed audio output. Applied loudnorm only to voiceover before mixing. |
| Caption timing | Rewrote word-matching to use fuzzy first-word search with sliding window instead of pure position counting. Fills timing gaps between segments. |
| Sentence case | Added .charAt(0).toUpperCase() in sanitizeForDrawtext() |
| Dark clips | Removed eq=brightness=-0.06 from static filters. Kept contrast=1.05. |
| Pexels relevance | Added topic-detection in getPexelsClips() with fitness-specific terms per topic (HIIT, strength, running, yoga, nutrition, sleep, etc.) |

### n8n Workflow Update
- Added pexels_query field to Assemble Video node body parameters
- Expression detects topic from content_angle and maps to specific fitness search terms

### Test Results
- Executions 67 and 68 both succeeded (~73s each)
- HIIT video uploaded: 2026-04-11_HIIT_training_3x_per_week.mp4 (11.5MB)
- Railway v2.6.0 deployed, GitHub commit d4af13b

*Last updated: Apr 11, 2026 (v2.6.0 — BGM, caption timing, case, brightness, Pexels fixes)*

---
## Session: Apr 11, 2026 — v2.6.0 Fixes (5 Issues from Instagram Review)

### Issues Found After Watching Instagram Video
1. BGM not audible — loudnorm on the mixed output was crushing the BGM to inaudible
2. Captions running ahead — Word-position matching drifted because punctuation/contractions did not align
3. Lowercase captions — sanitizeForDrawtext() never capitalized
4. Dark first clip — eq=brightness=-0.06 was darkening all clips
5. Irrelevant Pexels clips (desk for HIIT) — pexels_query was not being sent from n8n at all

### Fixes Applied (server.js v2.6.0)
- BGM: Raised BGM_VOLUME from 0.15 to 0.35. Removed loudnorm from mixed audio output. Applied loudnorm only to voiceover before mixing.
- Caption timing: Rewrote word-matching to use fuzzy first-word search with sliding window. Fills timing gaps between segments.
- Sentence case: Added .charAt(0).toUpperCase() in sanitizeForDrawtext()
- Dark clips: Removed eq=brightness=-0.06 from static filters. Kept contrast=1.05.
- Pexels relevance: Added topic-detection in getPexelsClips() with fitness-specific terms per topic (HIIT, strength, running, yoga, nutrition, sleep, etc.)

### n8n Workflow Update
- Added pexels_query field to Assemble Video node body parameters
- Expression detects topic from content_angle and maps to specific fitness search terms

### Test Results
- Executions 67 and 68 both succeeded (~73s each)
- HIIT video uploaded: 2026-04-11_HIIT_training_3x_per_week.mp4 (11.5MB)
- Railway v2.6.0 deployed, GitHub commit d4af13b

*Last updated: Apr 11, 2026 (v2.6.0 — BGM, caption timing, case, brightness, Pexels fixes)*

---
## Session: Apr 12, 2026 — Automation Pipeline Fix & Schedule Trigger

### TikTok Decision
- **Decision deferred to Apr 15, 2026** — reminder scheduled for 9:00 AM that day
- n8n workflow already supports TikTok via Upload-Post API — enabling it is a config-only change

### n8n Schedule Trigger Added
- Workflow `h7bRds9UOUfmP36F` now has a **Schedule Trigger** firing daily at **6:00 AM CDT (11:00 AM UTC)**
- Two new nodes added: Schedule Trigger → "Call Supabase — Generate Content" (HTTP Request) → Parse Supabase Payload
- Workflow node count: 19 → 21

### scrape-fitness-articles Edge Function — Fixed (v2)

**Root causes of empty results (3 bugs):**
1. **9 of 10 RSS sources were dead** — 403/402/404 errors or returning HTML instead of XML
2. **Wrong INSERT column** — function used `source_url` for article URL; actual column is `url`
3. **Wrong automation_logs field** — function used `articles_scraped`; actual column is `articles_processed`

**Fixes applied:**
- Replaced all 10 RSS sources with verified working feeds (see table below)
- Fixed INSERT to use correct column name `url` for article links
- Fixed automation_logs UPDATE to use `articles_processed`
- Improved RSS parser: handles Atom `<entry>` + `<link href="..."/>` in addition to standard `<item>`
- Lowered relevance threshold from 0.6 → 0.5 for better article coverage
- Redeployed via Supabase CLI from `/home/ubuntu/supabase-functions/scrape-fitness-articles/index.ts`

**Verified working RSS sources (as of Apr 12, 2026):**

| Source | URL | Category |
|--------|-----|----------|
| Men's Health Fitness | https://www.menshealth.com/rss/all.xml/ | fitness |
| Healthline Health News | https://www.healthline.com/rss/health-news | health |
| Muscle & Fitness | https://www.muscleandfitness.com/feed/ | fitness |
| Runner's World | https://www.runnersworld.com/rss/all.xml/ | fitness |
| Women's Health | https://www.womenshealthmag.com/rss/all.xml/ | fitness |
| Greatist Fitness | https://greatist.com/feed | fitness |
| Self Fitness & Nutrition | https://www.self.com/feed/rss | nutrition |
| Precision Nutrition | https://www.precisionnutrition.com/feed | nutrition |
| Breaking Muscle | https://breakingmuscle.com/feed/ | fitness |
| Eat This Not That Health | https://www.eatthis.com/feed/ | nutrition |

**Test run result:** `{"success":true,"articles_saved":10}` in 10.1s — 10 articles saved with scores 0.6–0.9

### Content Strategy Update
- Content sources updated from dead Healthline/WebMD/Mayo/Verywell/Everyday Health feeds to the 10 verified sources above

### Next Session: Analytics Reporting
- Build analytics reporting dashboard for social media post performance
- Track views, engagement, platform breakdown per post
- Data source: Upload-Post API + Supabase `social_posts` table

*Last updated: Apr 12, 2026 (schedule trigger, scrape function fixed, RSS sources replaced)*
