# YFIT AI — Beta Testing Guide

**Version:** 1.0-beta | **Date:** March 2026 | **Target:** 25 testers

---

## Overview: Two Separate Beta Tracks

YFIT runs as both a **web app** and a **mobile app** (via Capacitor/PWA). These are two completely separate beta processes with different requirements. You do not need both — start with the web app beta first, then layer in the Play Store track when you're ready for mobile.

| Track | Access Method | Requirements | Timeline |
|-------|--------------|--------------|----------|
| **Web App Beta** | Invite code → URL | None | Ready now |
| **Google Play Internal Testing** | Play Store app install | 14+ testers for 14+ days | 2–4 weeks |
| **Google Play Closed Testing** | Play Store invite | 1–2,000 testers | After internal track |

**Recommendation for 25 testers:** Start with the **web app beta** immediately. Set up the Play Store internal track in parallel so you can meet Google's 14-tester/14-day requirement for production access.

---

## TRACK 1: Web App Beta (Start Here)

### How It Works

Users sign up at `https://yfit-deploy.vercel.app` using an invite code. No app download required — works on any phone browser or desktop.

### Step 1: Generate Invite Codes

You have three codes pre-loaded in your database. To view or add more:

1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor) → select `beta_invites`
2. Existing codes:
   - `YFIT-BETA-2026` — 100 uses (general)
   - `YFIT-EARLY` — 50 uses (early adopters)
   - `YFIT-VIP` — 20 uses (friends/family)
3. To add a new code, click **Insert row** and fill in:
   - `code`: e.g. `YFIT-FRIEND-01`
   - `max_uses`: how many people can use it (e.g. `25`)
   - `notes`: who it's for
   - `is_active`: `true`

### Step 2: Invite Your 25 Testers

Send each tester a message like this:

> **Subject: You're invited to beta test YFIT AI**
>
> Hi [Name],
>
> I'd love your help testing YFIT AI — a personal fitness, nutrition, and medication tracking app I've been building.
>
> **To get started:**
> 1. Go to: https://yfit-deploy.vercel.app
> 2. Click **Sign Up**
> 3. Enter invite code: **YFIT-BETA-2026**
> 4. Complete the 5-step setup (takes ~2 minutes)
>
> Please use the **feedback button** (bottom-right corner) to report any bugs or suggestions. Your input directly shapes the app.
>
> Thank you!

### Step 3: Monitor Who Has Signed Up

In Supabase → `beta_invites` table, the `use_count` column increments each time someone uses a code. To see individual users:

1. Go to [Supabase Auth → Users](https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/auth/users)
2. You'll see every registered user with their email and signup date

---

## TRACK 2: Google Play Internal Testing

### What Google Requires

Google requires you to have **at least 12 testers** (they say 14 in some documentation) who have **actively opted in** to your internal testing track, and they must have the app installed for **at least 14 consecutive days** before Google will consider your app for production review. This is to verify the app is stable and actively used.

### Step-by-Step Setup

**Step 1: Prepare your APK/AAB**

Your app needs to be built as an Android App Bundle (`.aab`) file. If you're using Capacitor:
```
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```
The `.aab` file will be at `android/app/build/outputs/bundle/release/app-release.aab`.

**Step 2: Set Up Google Play Console**

1. Go to [Google Play Console](https://play.google.com/console) → your YFIT app
2. In the left menu, go to **Testing → Internal testing**
3. Click **Create new release**
4. Upload your `.aab` file
5. Add release notes (e.g. "Beta 1.0 — initial testing release")
6. Click **Save and publish**

**Step 3: Add Testers**

1. In **Internal testing → Testers** tab, click **Create email list**
2. Name it "Beta Testers"
3. Add up to 100 email addresses (one per line)
4. Click **Save changes**
5. Copy the **opt-in URL** — this is what you send to testers

**Step 4: Send Testers the Opt-In Link**

Each tester must:
1. Click your opt-in URL on their Android phone
2. Click **Become a tester**
3. Download the app from the Play Store link provided

> **Important:** Testers must use a Google account that matches the email you added to the list. The app will only appear in their Play Store after they opt in.

**Step 5: Meet the 14-Day Requirement**

Google counts days from when testers first install the app. You need:
- At least 12 testers with the app installed
- For at least 14 consecutive days
- With some active usage (opening the app counts)

**Timeline:** If you start today with 14 testers, you can apply for production access in ~2 weeks.

---

## How to Read Your Beta Data

### Reading Feedback Submissions

1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor)
2. Select the `user_feedback` table
3. You'll see columns:
   - `type` — bug / feature_request / general / praise
   - `category` — which part of the app (nutrition, fitness, etc.)
   - `title` — short summary
   - `description` — full details
   - `page_url` — exactly which page they were on
   - `status` — change this to `reviewing`, `in_progress`, or `resolved` as you work through it
   - `priority` — you can set `critical`, `high`, `medium`, `low`

**To filter by bugs only:** Click the filter icon → `type` = `bug`

**To mark as resolved:** Click the row → change `status` to `resolved`

### Reading Error Logs

1. Select the `error_logs` table
2. Key columns:
   - `error_message` — what went wrong
   - `page_url` — which page crashed
   - `severity` — `warning`, `error`, or `critical`
   - `created_at` — when it happened
3. Sort by `created_at` descending to see the most recent errors first
4. If you see the same `error_message` appearing many times, that's a priority fix

### Reading Feature Analytics

1. Select the `feature_analytics` table
2. Key columns:
   - `event_name` — what action was taken (e.g. `page_view`, `log_meal`, `scan_food`)
   - `feature` — which section (nutrition, fitness, medications, etc.)
   - `user_id` — which user did it
3. To see which features are most used, run this SQL query in the SQL editor:

```sql
SELECT feature, event_name, COUNT(*) as uses
FROM feature_analytics
GROUP BY feature, event_name
ORDER BY uses DESC;
```

4. To see how many unique users are active:

```sql
SELECT COUNT(DISTINCT user_id) as active_users,
       DATE(created_at) as date
FROM feature_analytics
GROUP BY date
ORDER BY date DESC;
```

---

## Tester Recruitment: Where to Find 25 People

You do not need strangers — 25 people from your existing network is ideal for a first beta. Here are the best sources:

| Source | How Many | Notes |
|--------|----------|-------|
| Friends & family | 5–8 | Most forgiving, will give honest feedback |
| Gym contacts / workout partners | 5–8 | Perfect target user — fitness-focused |
| Facebook fitness groups | 5–10 | Post asking for beta testers |
| Reddit (r/fitness, r/loseit) | 3–5 | Very engaged, detailed feedback |
| LinkedIn connections | 3–5 | Good for professional feedback |

**What to tell them:** Be specific about what you want tested. Example:
> "I need you to use the app for 1 week and specifically test: logging meals, the AI predictions page, and the medication tracker. Use the feedback button to report anything confusing or broken."

**Incentive ideas:** Early lifetime access, a shoutout in the app credits, or a small gift card for detailed feedback.

---

## Beta Checklist

Use this to track your beta progress:

- [ ] Run SQL migration in Supabase (done ✓)
- [ ] Deploy beta code to Vercel (done ✓)
- [ ] Test onboarding wizard yourself with a new account
- [ ] Test feedback button — submit a test bug report
- [ ] Verify `user_feedback` table receives the submission
- [ ] Identify 25 testers (friends, gym, social media)
- [ ] Send invite emails with code `YFIT-BETA-2026`
- [ ] Add tester emails to Google Play internal testing track
- [ ] Monitor `user_feedback` table daily during beta
- [ ] Monitor `error_logs` table for crashes
- [ ] After 14 days: check Google Play Console for production eligibility
- [ ] After beta: compile top 10 issues and fix before public launch

---

## Quick Reference: Important Links

| Resource | URL |
|----------|-----|
| Live App | https://yfit-deploy.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt |
| Feedback Table | https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor (user_feedback) |
| Error Logs | https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor (error_logs) |
| Analytics | https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor (feature_analytics) |
| Auth / Users | https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/auth/users |
| Google Play Console | https://play.google.com/console |
