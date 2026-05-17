# YFIT Master Project Reference

**Last Updated:** May 16, 2026
**Read this at the start of every session before making any changes.**

---

## 🗂️ Repository Structure (Confirmed May 16, 2026)

| Repo | URL | Deployed At | Purpose |
|---|---|---|---|
| **yfitai/yfit-app** | github.com/yfitai/yfit-app | app.yfitai.com | Main app — React + Capacitor + Vercel serverless functions |
| **yfitai/yfit-marketing** | github.com/yfitai/yfit-marketing | www.yfitai.com | Marketing landing page — React + tRPC + Manus hosting |
| **yfitai/yfitai-yfit-video-service** | github.com/yfitai/yfitai-yfit-video-service | Railway | AI video generation — Node/Express + ffmpeg + ElevenLabs |
| **yfitai/yfit-admin** | github.com/yfitai/yfit-admin | Separate | Backend-only — accounting, Stripe sync, analytics, email reports |

**Decision (May 16, 2026):** Keep all 4 repos separate. Do NOT consolidate. Each serves a distinct purpose and deployment target.

---

## 🌐 Live URLs

| Service | URL | Notes |
|---|---|---|
| Main App (web) | https://app.yfitai.com | Primary user-facing app |
| Marketing Site | https://www.yfitai.com | Landing page, pricing, language switcher |
| Old Deploy URL | https://yfit-deploy.vercel.app | Still active — live update bundles served from here |
| GitHub | https://github.com/yfitai | Org account |
| Vercel Dashboard | https://vercel.com/yfit-ai | Both yfit-app and yfit-marketing projects |

---

## 🏗️ Architecture: How the App Actually Updates

This is critical to understand before making any changes.

### Two Deployment Layers

**Layer 1 — Vercel Static Build** (the shell)
- Built from `yfit-app` repo on every push to `main`
- Deployed to `app.yfitai.com`
- Contains the Capacitor WebView wrapper, CSP headers, and base HTML
- The `vercel.json` must NOT have `"outputDirectory": "dist"` — this was the bug fixed May 16, 2026

**Layer 2 — Capawesome Live Update Bundle** (the app content)
- Built manually by running `pnpm build` then creating `bundle.zip` from `dist/`
- Stored at `public/updates/bundle.zip` in the repo
- Served from `https://yfit-deploy.vercel.app/updates/bundle.zip`
- The Capacitor app downloads this bundle on launch and runs it instead of the Vercel build
- **This is what users actually see on their phones**
- Current live bundle: **Build 96** (May 16, 2026)

### Build Number Tracking
The bundle version is tracked in `public/updates/bundle.json`:
```json
{ "version": 96, "url": "https://yfit-deploy.vercel.app/updates/bundle.zip" }
```
Increment this number every time a new bundle is created.

### How to Deploy a Change to the App
1. Make code changes in `/tmp/yfit-app-full/src/` or relevant files
2. Run `cd /tmp/yfit-app-full && pnpm build`
3. Create bundle: `cd dist && zip -r ../public/updates/bundle.zip . && cd ..`
4. Update version in `public/updates/bundle.json` (increment number)
5. Commit and push: `git add -A && git commit -m "Build XX: description" && git push`
6. Wait ~3 minutes for Vercel to deploy
7. Force-close and reopen the app on device to trigger update

---

## 🔑 Environment Variables & API Keys

### Vercel — yfit-app project
| Variable | Purpose | Status |
|---|---|---|
| `USDA_API_KEY` | Food search (USDA FoodData Central) | ✅ Added May 16, 2026 |
| `VITE_USDA_API_KEY` | Frontend fallback (not used by serverless) | Pre-existing |

**USDA API Key added May 16, 2026:** `P7iVKpg1LFn7gjY8j6AGcZGr3HgxTqpeQeefX9Xy`
Get new keys free at: https://fdc.nal.usda.gov/api-key-signup.html

### Vercel — yfit-marketing project
| Variable | Purpose | Status |
|---|---|---|
| `USDA_API_KEY` | Food search proxy | ✅ Added May 16, 2026 |
| `RESEND_API_KEY` | Email reports (internal) | Pre-existing, sending-only key |

---

## 🍎 Food Search Architecture (Fixed May 16, 2026)

### How Food Search Works
1. User types in search box → `foodDatabase.js` is called
2. `foodDatabase.js` calls `https://app.yfitai.com/api/food/search` (USDA) or `https://app.yfitai.com/api/food/search-openfoodfacts`
3. Vercel serverless function at `api/food/search.js` calls USDA FoodData Central API
4. Results returned to app

### Bugs Fixed May 16, 2026
1. **`vercel.json` had `"outputDirectory": "dist"`** — this prevented ALL serverless functions from deploying. Removed.
2. **`foodDatabase.js` pointed to `yfit-deploy.vercel.app`** — updated to `app.yfitai.com`
3. **`api/food/search.js` sent `Accept: application/json` header** — USDA API rejects this intermittently. Removed.
4. **No retry logic** — added 3-attempt retry with 300ms/600ms backoff to both `search.js` files
5. **CSP blocked `app.yfitai.com`** — `index.html` CSP `connect-src` did not include `*.yfitai.com`. Added.
6. **USDA API key rate-limited from Vercel IPs** — added dedicated `USDA_API_KEY` env var to both Vercel projects

### Food Search Translation Decision (May 16, 2026)
- **Food names stay in English** — USDA only provides English names. This is standard practice (same as MyFitnessPal).
- **UI labels (buttons, macros, serving sizes) are translated** — already working.
- **No AI translation of food names for now** — can be added later as a separate feature.

---

## 🌍 Multilingual Support

### App (yfit-app)
- **Languages supported:** English, French, Spanish, Portuguese, Chinese (Simplified), Hindi, German, Japanese, Arabic, Korean, Italian, Russian, Japanese
- **Translation file:** `src/lib/i18nResources.js`
- **Structure:** One large object with language codes as top-level keys (`en`, `fr`, `es`, `pt`, `zh`, `hi`, `de`, `ja`, etc.)
- **CRITICAL:** All strings in the `"en"` section must be in English. Previous bugs had French and Chinese strings accidentally placed in the English section.

### Translation Bugs Fixed May 16, 2026
All were in the `"en"` section of `i18nResources.js`:

| Key | Was (wrong) | Now (correct) |
|---|---|---|
| `selectExercise` | 选择要追踪的练习 (Chinese) | Select exercises to track |
| `workoutDetails` | Détails de l'entraînement (French) | Workout Details |
| `workoutName` | Nom de l'entraînement (French) | Workout Name |
| `addExercise` | Ajouter un exercice (French) | Add Exercise |
| `saveWorkout` | Enregistrer l'entraînement (French) | Save Workout |
| `noExercisesAdded` | Aucun exercice ajouté pour l'instant (French) | No exercises added yet |
| `minReps` | Rép. min (French) | Min Reps |
| `maxReps` | Rép. max (French) | Max Reps |
| `restSec` | Repos (sec) (French) | Rest (sec) |
| `exerciseName` | Nom de l'exercice (French) | Exercise Name |
| `reset` | Réinitialiser (French) | Reset |
| `notesPlaceholder` | Des notes sur aujourd'hui... (French) | Notes about today... |
| `rollingAverage` | Moyenne glissante — aujourd'hui moins 7 jours (French) | Rolling average — today minus 7 days |
| `lastMeasured` | Dernière mesure : (French) | Last measured: |

### Plate Scan Button Fix (May 16, 2026)
- **Problem:** `NutritionEnhanced.jsx` had `"Plate Scan"` hardcoded in JSX instead of using `t('nutrition.plateScan.plateScan')`
- **Fix:** Changed to use the translation key. Chinese translation `餐盘扫描` was already in the file.

### `label_serving` Display Fix (May 16, 2026)
- **Problem:** When food logged via barcode, serving size showed raw key `label_serving` instead of friendly text
- **Fix:** Now displays `"label serving"` (en) / `"标签份量"` (zh)

### Marketing Site (yfit-marketing)
- **Languages:** English, French, Spanish, Portuguese, Chinese, Hindi, German, Japanese (8 total)
- **i18n library:** react-i18next with LanguageDetector
- **Language switcher:** Globe icon in top nav — `client/src/components/LanguageSwitcher.tsx`
- **Translation file:** `client/src/lib/i18n.ts` (all 8 languages inline)
- **Language detection order:** localStorage → browser navigator

---

## 📱 Social Media Automation

### Current Setup
- **Platform:** n8n workflow (self-hosted or cloud)
- **Video generation:** Railway service (`yfitai-yfit-video-service`) — Node/Express + ffmpeg + Pexels + ElevenLabs
- **Platforms posting to:** TikTok, Instagram, YouTube Shorts, Facebook, Pinterest, LinkedIn (6 total)
- **Current language:** English only

### Multilingual Social Media — Decision Pending (May 16, 2026)
User is considering adding multilingual captions to social posts. Plan discussed:

**Phase 1 (Captions only — ~2 hours):**
- Update GPT-4 content generation prompt to output captions in all 8 languages simultaneously
- Stack captions in posts with flag emoji separators (🇺🇸 🇫🇷 🇪🇸 🇧🇷 🇨🇳 🇮🇳 🇩🇪 🇯🇵)
- Platform-specific rules: LinkedIn = English only; Pinterest = EN/ES/PT only; all others = all 8
- Platform language targeting is handled by platform algorithms — no manual routing needed

**Phase 2 (Translated audio — ~3-4 hours, after Phase 1 stable):**
- Generate separate voiceovers via ElevenLabs for ES, PT, ZH, HI
- Separate video per language for those 4 languages
- English + 4 language videos = 5 videos per cycle

**Status:** User requested time to think. Do NOT start implementation until confirmed.

### Resend Email (yfit-marketing)
- **Purpose:** Internal reports only — weekly analytics PDF, monthly accounting PDF
- **Recipient:** support@yfitai.com
- **Key type:** Sending-only (restricted) — returns 401 on `/domains` endpoint, which is expected and correct
- **NOT connected to social media pipeline yet** — can be added as post-confirmation notification

---

## 🔧 vercel.json — Critical Configuration

### yfit-app (app.yfitai.com)
```json
{
  "buildCommand": "CI=false npm run build",
  "framework": "vite",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [...]
}
```
**DO NOT add `"outputDirectory": "dist"`** — this breaks all serverless functions.

### yfit-marketing (www.yfitai.com)
- Managed by Manus hosting — do not manually edit vercel.json

---

## 📋 Session Start Checklist

When starting a new session, always:

1. **Read this file first** before making any changes
2. **Check which repo** you are working in — yfit-app vs yfit-marketing are completely separate
3. **Check the current bundle build number** before creating a new bundle: `cat public/updates/bundle.json`
4. **Do not add `outputDirectory` to vercel.json** — this was the root cause of the food search outage
5. **Test food search** at `https://app.yfitai.com/api/food/search?query=apple` before and after any API changes
6. **For translation fixes** — always check which language section the string is in before editing `i18nResources.js`

---

## 📝 Session Change Log

### May 16, 2026

**Food Search — Complete Fix (6 bugs resolved):**
- Removed `outputDirectory` from `vercel.json` → serverless functions now deploy
- Updated `foodDatabase.js` URLs from `yfit-deploy.vercel.app` to `app.yfitai.com`
- Removed `Accept: application/json` header from `api/food/search.js` (caused intermittent 400s)
- Added 3-attempt retry logic to both `search.js` files
- Added `https://*.yfitai.com` to CSP `connect-src` in `index.html`
- Added `USDA_API_KEY` env var to both Vercel projects (key: `P7iVKpg1...`)
- Built and deployed live update bundles 93, 94, 95, 96

**Translation Fixes:**
- Fixed 14 French strings accidentally in English section of `i18nResources.js`
- Fixed 1 Chinese string (`selectExercise`) in English section
- Fixed `Plate Scan` button hardcoded text in `NutritionEnhanced.jsx`
- Fixed `label_serving` raw key display in logged meals list

**Architecture Decisions:**
- Confirmed: Keep all 4 repos separate (yfit-app, yfit-marketing, video-service, yfit-admin)
- Confirmed: Food names stay in English (USDA limitation — same as all major fitness apps)
- Pending: Multilingual social media captions (user thinking)

### January 13, 2026
- Removed demo mode (26 files, ~200 references)
- Fixed date picker truncation on Android
- Created AUTOMATION_REFERENCE.md

---

## 🚨 Known Issues / Watch List

| Issue | Status | Notes |
|---|---|---|
| Social media monitoring — verify all 6 platforms posting | Pending | Scheduled for next session |
| Multilingual social media captions | Pending decision | Plan documented above |
| `yfit-deploy.vercel.app` still active | Intentional | Live update bundles served from here |
| USDA rate limiting from Vercel shared IPs | Mitigated | Dedicated API key added + retry logic |

---

*This file is the single source of truth for YFIT project state. Update it at the end of every session.*
