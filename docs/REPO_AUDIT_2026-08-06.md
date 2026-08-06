# YFIT AI — Full Repository Audit Report
**Date:** August 6, 2026  
**Purpose:** Complete inventory of all code before any structural consolidation work begins.  
**Status:** READ-ONLY audit. No changes made to any repo.

---

## Summary Finding

The `yfitai/yfit-ai` **private repo is the original monopro** you built months ago. It already has the exact structure you want — `app/`, `admin/`, `marketing/`, `video-service/`, `docs/`. It was last updated July 17, 2026 and contains the Master Reference, the Rules, and the session history. This is the structure that should be restored and used going forward.

---

## All 5 GitHub Repos — Inventory

### 1. `yfitai/yfit-app` — 85 MB — Last updated: Aug 6, 2026 ✅ ACTIVE

**What it is:** The main YFIT app — React/Vite frontend, Capacitor mobile wrapper, Vercel serverless API functions, live update bundle system, and all project documentation.

**Status:** This is the primary working repo. All app development happens here. Deployed to `app.yfitai.com` via Vercel. Live update bundles served from `yfit-deploy.vercel.app`.

**Notable contents:** `src/` (React app), `api/` (Vercel serverless functions), `android/` + `ios/` (Capacitor), `public/updates/` (live bundles), `supabase/` (Edge Functions), `docs/` (documentation), `YFIT_MASTER_REFERENCE.md`, `REPO_SAFETY.md`, `start-work.sh`, `end-work.sh`.

**Verdict:** Keep as-is. This is correct and current.

---

### 2. `yfitai/yfit-ai` — 1.7 MB — Last updated: Jul 17, 2026 ✅ THE ORIGINAL MONOPRO

**What it is:** This is the **original monopro** — a private documentation and reference hub with the exact folder structure you described:
```
yfit-ai/
├── app/              ← app code references
├── admin/            ← admin/analytics references  
├── marketing/        ← marketing site references
├── video-service/    ← Railway video service references
├── supabase-functions/ ← Edge Function references
└── docs/             ← ALL reference documents
    ├── MASTER_REFERENCE.md
    ├── RESUME_STATE.md
    ├── DECISIONS_LOG.md
    └── ARCHITECTURE.md
```

The README even contains the exact start/end work prompts:
> *"Start-work and verify using main app monopro structure. Read the master project reference document for past decisions. Follow Rule 1 and 2. And ask if not sure for any change."*

**Status:** This repo exists and is intact. It was last updated July 17, 2026 (Session 24). It has been dormant since then because subsequent sessions worked directly in `yfit-app` instead.

**Verdict:** This is the monopro hub. It should be updated and restored as the central reference point.

---

### 3. `yfitai/yfit-admin` — 22.6 MB — Last updated: Jul 15, 2026 ⚠️ DIVERGED

**What it is:** The admin backend — accounting dashboard, Stripe sync, weekly analytics reports, CSV importer.

**Status:** The GitHub version was last updated July 15, 2026. The Manus S3 version (local `/home/ubuntu/yfit-marketing`) was last updated today (Aug 6, 2026) with the analytics report fix. **The Manus S3 version is 3 weeks ahead of GitHub.** They have diverged.

**What the Manus S3 version has that GitHub does not:**
- Marketing site redesign (visual-first layout, real screenshots, FAQ accordion)
- Weekly report fix (removed broken website analytics section)
- The `analyticsRouter.ts` and `reportGenerator.ts` changes from today

**Verdict:** The Manus S3 version is the current master. GitHub needs to be updated with the Manus S3 content.

---

### 4. `yfitai/yfit-marketing` — 26.8 MB — Last updated: May 5, 2026 ⚠️ OUTDATED

**What it is:** The `www.yfitai.com` marketing landing page — React/tRPC/Manus hosted.

**Status:** The GitHub version was last updated May 5, 2026. The Manus S3 version (also local `/home/ubuntu/yfit-marketing`) is the current version with the redesigned homepage using real app screenshots, FAQ accordion, competitor table, and language switcher.

**Key difference found in audit:**
- **Manus S3 (current):** Uses CDN screenshots, FAQ items, mobile hamburger menu, `useTracking` hook
- **GitHub (outdated May 5):** Has Stripe checkout, waitlist form, Sign In/Sign Up pages, i18n translations

The GitHub version actually has **more features** (Stripe, auth, waitlist) but is 3 months old. The Manus S3 version has a better visual design but removed some features.

**Verdict:** Neither version is complete. This needs careful merging. Do not delete either until they are compared page by page.

---

### 5. `yfitai/yfitai-yfit-video-service` — 170 KB — Last updated: Jul 18, 2026 ✅ ACTIVE

**What it is:** The Railway-hosted AI video generation service — Node/Express + ffmpeg + ElevenLabs.

**Status:** Small, self-contained, deployed to Railway. Last updated July 18 with video bitrate optimisation (v4.1.0). No issues.

**Verdict:** Keep as-is. Already correctly structured.

---

## The Two Manus S3 Projects

Both Manus S3 projects are stored at `s3://vida-prod-gitrepo/...` and are **not standard GitHub repos**. They are Manus-managed and restored automatically when the Manus project loads.

| Manus Project | Local Folder | GitHub Equivalent | Last Manus Commit |
|---|---|---|---|
| yfit-marketing (admin) | `/home/ubuntu/yfit-marketing` | `yfitai/yfit-admin` | Aug 6, 2026 (today) |
| yfit-marketing (marketing site) | Same folder — they share it | `yfitai/yfit-marketing` | Aug 6, 2026 (today) |

**Important:** The local `/home/ubuntu/yfit-marketing` folder serves as **both** the admin backend and the marketing site simultaneously. This is because the Manus `yfit-marketing` project was originally the marketing site but was repurposed to also host the admin/analytics backend. This dual-purpose is a source of ongoing confusion.

---

## Recommendations (DO NOT ACT YET — Confirm First)

### Option A: Restore the Monopro (Recommended)

The `yfitai/yfit-ai` private repo already has the correct structure. The plan would be:

1. **Update `yfit-ai`** with current content from all active repos — make it the central documentation hub again
2. **Push Manus S3 content to GitHub** — add a GitHub remote to the Manus project so changes sync to `yfitai/yfit-admin` and `yfitai/yfit-marketing`
3. **Update `start-work.sh`** to also pull the `yfit-ai` monopro at session start
4. **Retire Manus hosting** for the admin project — move it to Vercel (free, same as the main app)
5. **Keep `yfit-app`, `yfit-admin`, `yfit-marketing`, `yfit-video-service`** as separate repos but all referenced from the `yfit-ai` monopro hub

### What NOT to Do

- Do **not** delete `yfitai/yfit-marketing` GitHub repo — it has Stripe, auth, and waitlist features the Manus version lost
- Do **not** delete `yfitai/yfit-ai` — this is the monopro hub you built
- Do **not** merge all code into one giant repo — the separate repos are correct; the hub just needs to reference them
- Do **not** make any changes until you confirm this plan

---

## Do the Current Start/End Prompts Still Work?

**Yes** — the prompts work for the main app (`yfit-app`). They do not yet cover the `yfit-ai` monopro hub. Once we restore the monopro, the prompts will be updated to also sync that repo.

**Current prompts (safe to use now):**

**START:**
```
Start-work and verify using main app monopro structure. Run: bash /home/ubuntu/yfit-app-full/start-work.sh — then read the YFIT_MASTER_REFERENCE.md. Follow all 6 Rules. Ask if not sure before any change.
```

**END:**
```
End-work. Run: bash /home/ubuntu/yfit-app-full/end-work.sh — commit all changes, push to GitHub, update YFIT_MASTER_REFERENCE.md with today's decisions, and confirm git status is clean in both repos before closing.
```

---

*This audit was produced August 6, 2026. No changes were made to any repository during this audit.*
