# YFIT Social Media Setup — Current Status & Action Plan
Last updated: Apr 4, 2026

## Platform Status

| Platform | Account Created | Profile Complete | Upload-Post Connected | Notes |
|----------|:-:|:-:|:-:|-------|
| YouTube | ✅ Done | ✅ Done | ⬜ Pending | Phase 2 complete |
| Facebook | 🔶 Partial | ⬜ | ⬜ Pending | Need Page ID + access token |
| Pinterest Business | 🔶 Partial | ⬜ | ⬜ Pending | Need access token from developers.pinterest.com |
| Instagram Business | 🔶 Partial | ⬜ | ⬜ Pending | Need access token via developers.facebook.com |
| LinkedIn Company | 🔶 Partial | ⬜ | ⬜ Pending | Need access token from linkedin.com/developers |
| TikTok Business | ⬜ Not started | ⬜ | ⬜ Pending | Requires phone app first |

## What "Partial" Means Per Platform

### Facebook
- [ ] Confirm Page name is "YFIT AI" and username is @yfitai
- [ ] Upload YFIT logo as profile photo
- [ ] Upload banner/cover image (2560×1440px)
- [ ] Set website: https://yfitai.com
- [ ] Add About text (see checklist)
- [ ] **Copy Facebook Page ID** (Settings → About) — needed for Upload-Post

### Pinterest Business
- [ ] Confirm account is converted to Business
- [ ] Verify website https://yfitai.com (unlocks analytics)
- [ ] Create 5 boards: Nutrition Tips, Weight Loss, Workout Plans, Medication Guide, YFIT App Features
- [ ] **Get Pinterest access token** from developers.pinterest.com → needed for Upload-Post

### Instagram Business
- [ ] Confirm switched to Professional/Business account
- [ ] Set bio text and website link
- [ ] **Get Instagram access token** via developers.facebook.com → create app → connect Instagram

### LinkedIn Company Page
- [ ] Confirm company page created at linkedin.com/company/yfitai
- [ ] Upload logo and fill all fields
- [ ] **Get LinkedIn access token** from linkedin.com/developers → create app

### TikTok Business (Not Started)
- [ ] Download TikTok app on phone
- [ ] Sign up with social@yfitai.com
- [ ] Username: yfitai
- [ ] Switch to Business Account → Health & Fitness
- [ ] Set bio, website, upload logo
- [ ] Go to business.tiktok.com → create developer app → copy Access Token

## Phase 3 — Upload-Post Connections (After All Accounts Done)
- [ ] Log in to upload-post.com
- [ ] Connect YouTube (OAuth)
- [ ] Connect Facebook Page (Page ID + token)
- [ ] Connect Pinterest (access token)
- [ ] Connect Instagram (access token)
- [ ] Connect LinkedIn (access token)
- [ ] Connect TikTok (access token)
- [ ] Copy Upload-Post API key → give to Manus for n8n/Supabase secrets

## API Keys Still Needed
- [ ] Pexels API key (pexels.com/api — free, instant)
- [ ] ElevenLabs API key (elevenlabs.io — free tier)
- [ ] Upload-Post API key (from upload-post.com account settings)

## Manus Tasks (After User Completes Above)
- [ ] Add all 3 API keys to Supabase secrets
- [ ] Update n8n workflow with Upload-Post API key
- [ ] Add social media follow links to welcome email template
- [ ] Add social media links to all email footers
- [ ] Verify generate-social-content edge function reads same article as Daily Insight
- [ ] Run end-to-end dry run test of full automation pipeline
