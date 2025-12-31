# YFIT Project Organization & Reference Guide

**Last Updated:** December 28, 2025

---

## 📋 Project Overview

**Project Name:** YFIT - AI-Powered Fitness & Nutrition Coach  
**GitHub Repository:** https://github.com/yfitai/yfit-app  
**Owner:** Don Campbell

---

## 🌐 Important URLs

### Production Apps
- **Web App (Desktop):** https://yfit-deploy.vercel.app
- **Marketing Website:** (To be published from yfit-marketing project)
- **Domain:** www.yfitai.com (configured in Vercel)

### Development Dashboards
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt
- **GitHub Repository:** https://github.com/yfitai/yfit-app

### Database
- **Supabase Project:** mxggxpoxgqubojvumjlt
- **Table Editor:** https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/editor
- **SQL Editor:** https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/sql

---

## 📁 Project Structure in Manus

### Recommended Task Organization

Create separate tasks for different work areas. Use clear, descriptive names:

#### 1. **YFIT - Main App Development** ⭐ (Favorite)
**Purpose:** Primary task for app feature development and bug fixes  
**Project Path:** `/home/ubuntu/yfit/`  
**Use for:**
- Adding new features
- Fixing bugs
- Database schema changes
- API integrations

#### 2. **YFIT - Android Build & Deploy** 📱
**Purpose:** Building and deploying Android APK  
**Project Path:** `/home/ubuntu/yfit/`  
**Quick Commands:**
```powershell
cd C:\Users\campb\Projects\yfit-app
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug --no-daemon --max-workers=1
cd ..
C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

#### 3. **YFIT - Marketing Website** 🌐
**Purpose:** Working on the marketing/landing page  
**Project Path:** `/home/ubuntu/yfit-marketing/`  
**Use for:**
- Updating marketing copy
- Design changes
- Adding testimonials
- SEO optimization

#### 4. **YFIT - Social Media Assets** 📱
**Purpose:** Creating graphics, videos, and content for social media  
**Use for:**
- Instagram posts
- Facebook ads
- App Store screenshots
- Promotional videos

#### 5. **YFIT - Documentation** 📚
**Purpose:** User guides, API docs, and internal documentation  
**Use for:**
- User manuals
- API documentation
- Feature specifications
- Training materials

---

## 🛠️ Common Commands & Workflows

### Web App Development Workflow

```bash
# 1. Make code changes in /home/ubuntu/yfit/src/

# 2. Test locally (if needed)
cd /home/ubuntu/yfit
npm run dev

# 3. Commit and push to GitHub
git add .
git commit -m "Description of changes"
git push origin main

# 4. Vercel automatically deploys (2-3 minutes)
# Check deployment at: https://vercel.com/dashboard
```

### Android Build Workflow

```powershell
# Navigate to project
cd C:\Users\campb\Projects\yfit-app

# Pull latest changes from GitHub
git pull origin main

# Build web app
npm run build

# Sync to Android
npx cap sync android

# Build Android APK
cd android
.\gradlew assembleDebug --no-daemon --max-workers=1

# Install on device
cd ..
C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Database Changes Workflow

```bash
# 1. Update schema in Supabase SQL Editor
# Go to: https://supabase.com/dashboard/project/mxggxpoxgqubojvumjlt/sql

# 2. Update code to match new schema
# Edit files in /home/ubuntu/yfit/src/

# 3. Test changes

# 4. Push to GitHub
git add .
git commit -m "Database schema update"
git push origin main
```

---

## 🔧 Build Configuration

### Android Build Settings

**File:** `android/gradle.properties`

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.daemon=false
kotlin.daemon.jvmargs=-Xmx2048m
org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=384m
```

**Memory Requirements:**
- Minimum: 8GB total RAM, 4GB free
- Recommended: 16GB total RAM, 6GB+ free

**If build crashes:**
1. Close Chrome, Slack, and other memory-heavy apps
2. Check free RAM: `Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory`
3. Target: FreePhysicalMemory > 4,000,000 (4GB)

---

## 📊 Project Files & Locations

### Local Computer (Windows)
- **Main Project:** `C:\Users\campb\Projects\yfit-app`
- **Backup:** `C:\Users\campb\Projects\yfit-app-BACKUP-2025-12-13`
- **Other copies:** (See PowerShell search results - multiple locations)

### Manus Sandbox
- **Main App:** `/home/ubuntu/yfit/`
- **Marketing:** `/home/ubuntu/yfit-marketing/`

### GitHub
- **Repository:** https://github.com/yfitai/yfit-app
- **Branch:** main
- **Total Commits:** 254+ (as of Dec 28, 2025)

---

## 🐛 Recent Bug Fixes (Dec 28, 2025)

### Bug #1: Daily Tracker - Blood Pressure Error
**Issue:** "Could not find blood_pressure_diastolic column"  
**Root Cause:** Code used `blood_pressure_systolic/diastolic` but database had `bp_systolic/bp_diastolic`  
**Fix:** 
1. Created `daily_logs` table in Supabase
2. Replaced all `blood_pressure_*` with `bp_*` in `src/components/DailyTracker.jsx`
**Status:** ✅ Fixed (Web + Android)

### Bug #2: Android Food Search - Missing USDA Foods
**Issue:** Android only showed branded foods, not USDA foods  
**Root Cause:** Android app was using cached old code  
**Fix:** Rebuilt Android with latest code from GitHub  
**Status:** ✅ Fixed

---

## 📝 Database Schema

### Key Tables

#### `daily_logs`
Stores daily health tracking data (sleep, water, steps, vitals)

```sql
Columns:
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- logged_at (timestamp)
- sleep_hours (decimal)
- sleep_quality (text: 'poor', 'fair', 'good', 'excellent')
- water_ml (integer)
- steps (integer)
- bp_systolic (integer)
- bp_diastolic (integer)
- glucose_mg_dl (integer)
- weight_kg (decimal)
- body_fat_percent (decimal)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Other Tables
- `users` - User accounts and profiles
- `nutrition_logs` - Food intake tracking
- `workouts` - Exercise sessions
- `medications` - Medication tracking
- `goals` - User fitness goals
- (See Supabase Table Editor for complete list)

---

## 🚀 Deployment Process

### Web App (Automatic via Vercel)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploy:**
   - Detects push automatically
   - Builds and deploys (2-3 minutes)
   - Check status: https://vercel.com/dashboard

3. **Verify Deployment:**
   - Visit: https://yfit-deploy.vercel.app
   - Test key features

### Android App (Manual)

1. **Build APK** (see Android Build Workflow above)
2. **Test on Device**
3. **For Play Store Release:**
   - Build release APK: `.\gradlew assembleRelease`
   - Sign with keystore
   - Upload to Google Play Console

---

## 🎨 Marketing Website

### Project Details
- **Manus Project:** yfit-marketing
- **Path:** `/home/ubuntu/yfit-marketing/`
- **Status:** Completed (Dec 28, 2025)
- **Features:**
  - Hero section with "Your Body, Reimagined"
  - 8 Quick Action Cards (Goals, Nutrition, Fitness, etc.)
  - Pricing tiers (Free, Pro Monthly $12.99, Pro Yearly $99.99, Lifetime $249.99)
  - Unique features: Medication Tracking, Form Analysis
  - Blue-green color scheme matching main app

### To Resume Marketing Work
1. Start new Manus task: "YFIT - Marketing Website"
2. The project files are saved in checkpoint: `fe3cd9f9`
3. Continue editing or publish

---

## 📞 Support & Resources

### Manus Support
- **Help Center:** https://help.manus.im
- **Issues to Report:**
  - Project organization/task management
  - Better bulk operations for tasks
  - Android build memory issues

### External Resources
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **React Docs:** https://react.dev

---

## ✅ Checklist for Starting Work

### Before Starting a Work Session

- [ ] Identify which area you're working on (App, Android, Marketing, etc.)
- [ ] Open or create the appropriate Manus task
- [ ] Pull latest changes from GitHub (if working locally)
- [ ] Check Vercel deployment status
- [ ] Verify database is accessible

### After Completing Work

- [ ] Test changes locally or on device
- [ ] Commit and push to GitHub
- [ ] Verify Vercel deployment (for web changes)
- [ ] Update documentation if needed
- [ ] Note any issues or follow-up items

---

## 🗂️ How to Clean Up Manus Sidebar

### Steps to Delete Old Tasks

1. **Hover over each task** in the left sidebar
2. **Look for delete/trash icon** (usually appears on hover)
3. **Click to delete** unwanted tasks
4. **Keep only:**
   - Your favorite task (Main App Development)
   - Any tasks with important unsaved work

### Renaming Tasks

1. **Click on the task name** in the sidebar
2. **Edit the name** (this won't lose the project)
3. **Press Enter** to save

### Best Practices

- **Use descriptive names** with emojis for easy identification
- **Archive completed tasks** instead of deleting (if feature available)
- **Keep 3-5 active tasks** maximum for clarity
- **Create new tasks** for new work areas instead of reusing old ones

---

## 📌 Quick Reference

### Most Used Commands

```powershell
# Check RAM
Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory

# Check what's using memory
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 20 Name, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet / 1MB, 2)}} | Format-Table -AutoSize

# Navigate to project
cd C:\Users\campb\Projects\yfit-app

# Git status
git status

# Pull latest
git pull origin main

# Push changes
git push origin main

# Build Android
cd android
.\gradlew assembleDebug --no-daemon --max-workers=1
cd ..

# Install APK
C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📅 Project Timeline

- **September 2025:** Project started, subscribed to Manus
- **October-December 2025:** Core app development
- **December 13, 2025:** Backup created
- **December 16, 2025:** Play Store assets prepared
- **December 28, 2025:** 
  - Fixed Daily Tracker bug
  - Fixed Android food search
  - Completed marketing website
  - Created this organization guide

---

## 🎯 Next Steps

### Immediate
- [ ] Clean up Manus sidebar (delete old tasks)
- [ ] Create organized task structure
- [ ] Test both web and Android apps thoroughly

### Short-term
- [ ] Publish marketing website
- [ ] Configure yfitai.com domain
- [ ] Add Stripe payment integration
- [ ] Create social media assets

### Long-term
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store
- [ ] Launch marketing campaign
- [ ] Gather user feedback and iterate

---

**Document maintained by:** Don Campbell  
**For questions or updates:** Contact Manus support or update this document in your project

