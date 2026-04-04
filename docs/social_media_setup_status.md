# YFIT Social Media Setup — Current Status & Action Plan
Last updated: Apr 4, 2026

## Platform Status

| Platform | Account | Upload-Post | Notes |
|----------|---------|-------------|-------|
| YouTube | ✅ Done | ✅ Connected | Done |
| Facebook | ✅ YFIT AI Page created (admin: Don Campbell) | ✅ Connected (purple) | Done |
| Instagram | ❌ @yfitai permanently disabled by Meta | ❌ Not connected | Create fresh via phone app with personal Gmail |
| LinkedIn | ✅ Account exists (support@yfitai.com) | ❌ Not connected | ID verification submitted — waiting for access restore |
| Pinterest | ⚠️ Partially set up | ❌ Not connected | Need to log in and complete |
| TikTok | ❌ Not started | ❌ Not connected | Requires phone app (Android/iOS) |

## Next Session Action Items

### Instagram (do on phone, NOT desktop)
- [ ] Open Instagram app on Android
- [ ] Create new account with **personal Gmail** (not support@yfitai.com — it's flagged by Meta)
- [ ] Username: `yfitaiapp` (confirmed available)
- [ ] Switch to Business account → link to YFIT AI Facebook Page
- [ ] Connect to Upload-Post

### LinkedIn
- [ ] Wait for ID verification to complete (usually same day)
- [ ] Log in to linkedin.com → confirm access restored
- [ ] Create a **LinkedIn Company Page** for YFIT AI (separate from personal profile)
- [ ] Go to Upload-Post → Users → YFIT row → click LinkedIn → authorize

### Pinterest
- [ ] Go to pinterest.com → log in with support@yfitai.com
- [ ] If locked out → Forgot Password → email reset
- [ ] Switch to Business account
- [ ] Create 5 boards: Nutrition Tips, Weight Loss, Workout Plans, Medication Guide, YFIT App Features
- [ ] Connect to Upload-Post

### TikTok
- [ ] Download TikTok app on Android
- [ ] Create account with support@yfitai.com or personal email
- [ ] Username: yfitai or yfitaiapp
- [ ] Switch to Business account → Health & Fitness
- [ ] Connect to Upload-Post

## Video Service Updates (done Apr 4)
- [x] Upgraded to use real Pexels video backgrounds based on content angle
- [x] PEXELS_API_KEY confirmed valid (5,592 portrait fitness videos available)
- [ ] Add PEXELS_API_KEY to Railway environment variables: `gqY0X3U13VfUjejR1rvec2X6I1yuJpGWXrO4vQ4esOl4XDE8UXsoji0N`

## n8n Workflow Fixes (done Apr 4)
- [x] Fixed Upload-Post text endpoint: `v1.upload-post.com` → `api.upload-post.com/api/upload_text`
- [x] Added explicit POST method to text node
- [x] Both nodes confirmed using `user=YFIT` matching Upload-Post profile name

## API Keys (all confirmed valid)
- [x] Pexels: `gqY0X3U13VfUjejR1rvec2X6I1yuJpGWXrO4vQ4esOl4XDE8UXsoji0N`
- [x] ElevenLabs: `sk_c73588c45da807e6ba8119f20e1fe445fb496d336c837d11`
- [x] Upload-Post JWT: already embedded in n8n workflow

## Remaining Before Full Go-Live
- [ ] Add PEXELS_API_KEY to Railway video service env vars
- [ ] Complete Instagram account setup (phone, personal Gmail)
- [ ] Restore LinkedIn access after ID verification + create Company Page
- [ ] Complete Pinterest setup and connect to Upload-Post
- [ ] Set up TikTok Business account and connect to Upload-Post
- [ ] Run full n8n workflow dry-run test
- [ ] Enable daily 6 AM CDT cron job
- [ ] Add social media follow links to welcome email footer
- [ ] Fix FormScoreGauge counter in main app (deferred)
