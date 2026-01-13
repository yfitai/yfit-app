# YFIT Automation Reference Guide

**Last Updated:** January 13, 2026

This document serves as the complete reference for all automation in the YFIT application. Keep this for future reference.

---

## 📋 Table of Contents

1. [Deployment Automation](#deployment-automation)
2. [Android Auto-Update System](#android-auto-update-system)
3. [Development Workflow](#development-workflow)
4. [Architecture Overview](#architecture-overview)
5. [Troubleshooting](#troubleshooting)
6. [Quick Reference Commands](#quick-reference-commands)

---

## 🚀 Deployment Automation

### **Current Setup**

```
GitHub Repository: yfitai/yfit-app
Vercel URL: https://yfit-deploy.vercel.app
Android App: Loads from Vercel (auto-updates)
```

### **How It Works**

```mermaid
Push to GitHub → Vercel Webhook → Auto Build → Auto Deploy → Live in 2-3 min
                                                              ↓
                                                    Android App Auto-Updates
```

### **Deployment Process**

1. **From Manus (Automated):**
   - Just say: "Deploy the changes" or "Push to production"
   - Manus handles: commit → push → Vercel auto-deploys

2. **From Local Machine (PowerShell):**
   ```powershell
   git add .
   git commit -m "Your message"
   git push origin main
   ```
   - Vercel detects push automatically
   - Builds and deploys in 2-3 minutes
   - No manual intervention needed

### **What Gets Deployed**

- ✅ All React code changes
- ✅ UI/UX updates
- ✅ Bug fixes
- ✅ New features
- ✅ API changes
- ✅ Database schema changes
- ✅ Configuration updates

### **Deployment Timeline**

| Step | Time | Action |
|------|------|--------|
| Push to GitHub | Instant | Git push completes |
| Vercel webhook triggers | 5-10 seconds | Vercel detects push |
| Build starts | 10-20 seconds | npm install + build |
| Build completes | 1-2 minutes | Assets generated |
| Deployment | 30-60 seconds | Files uploaded to CDN |
| **Total** | **2-3 minutes** | **Live!** |

---

## 📱 Android Auto-Update System

### **Configuration**

**File:** `capacitor.config.json`

```json
{
  "appId": "com.yfitai.app",
  "appName": "YFIT AI",
  "server": {
    "url": "https://yfit-deploy.vercel.app",
    "cleartext": true
  }
}
```

### **How It Works**

The Android app is essentially a **WebView** that loads content from Vercel:

1. **User opens app** → WebView initializes
2. **WebView loads** → Fetches from `https://yfit-deploy.vercel.app`
3. **Content displays** → Latest version from Vercel
4. **User closes app** → WebView clears cache (optional)
5. **User reopens app** → Fetches fresh content from Vercel

### **Update Process**

```
Developer pushes code → Vercel deploys → Android app gets updates automatically
```

**User Experience:**
- Close app completely (swipe away from recent apps)
- Reopen app
- ✅ Latest version loads automatically!

**No need to:**
- ❌ Download new APK
- ❌ Go to Play Store
- ❌ Sign out and sign in
- ❌ Clear app data
- ❌ Reinstall app

### **What Can Be Updated Instantly**

#### ✅ **Updates Without New APK:**

- **UI Changes:**
  - Colors, fonts, layouts
  - Button styles, spacing
  - Animations, transitions
  - Icons (from Lucide React)

- **Functionality:**
  - Business logic
  - API calls
  - Data processing
  - Form validation
  - Navigation flows

- **Content:**
  - Text content
  - Images (from URLs)
  - Charts and graphs
  - Error messages

- **Features:**
  - New pages/screens
  - New components
  - New user flows
  - Database queries

**Basically:** Everything coded in React/JavaScript!

#### ❌ **Updates That Need New APK:**

- **Native Android:**
  - Capacitor plugin updates
  - Native code changes
  - Permission changes (AndroidManifest.xml)

- **App Metadata:**
  - App name
  - App icon
  - Splash screen
  - Package ID

- **Build Configuration:**
  - Gradle changes
  - ProGuard rules
  - Signing configuration

**Basically:** Only native Android stuff!

### **When to Build New APK**

Only when you:
1. Update Capacitor plugins
2. Change app permissions
3. Update app icon/name
4. Change native Android code
5. Update Capacitor version

**Otherwise:** Just push to GitHub and users get updates automatically!

---

## 💻 Development Workflow

### **Standard Workflow**

```
1. Make changes in code
   ↓
2. Test locally (optional): npm run dev
   ↓
3. Commit and push to GitHub
   ↓
4. Vercel auto-deploys (2-3 min)
   ↓
5. Test on web: https://yfit-deploy.vercel.app
   ↓
6. Test on Android: Close and reopen app
   ↓
7. Done! ✅
```

### **From Manus**

**You say:** "Fix the login button color to blue"

**Manus does:**
1. Updates the code
2. Tests the build
3. Commits changes
4. Pushes to GitHub
5. Vercel auto-deploys

**You do:** Nothing! Just wait 2-3 minutes

### **From Local Machine**

```powershell
# Navigate to project
cd C:\path\to\yfit

# Make your changes in code editor

# Test locally (optional)
npm run dev

# Commit and push
git add .
git commit -m "Fix: Login button color"
git push origin main

# Wait 2-3 minutes
# Check: https://yfit-deploy.vercel.app
# Test on Android: Close and reopen app
```

### **Testing Changes**

#### **On Web:**
1. Push to GitHub
2. Wait 2-3 minutes
3. Visit: https://yfit-deploy.vercel.app
4. Test your changes

#### **On Android:**
1. Push to GitHub
2. Wait 2-3 minutes for Vercel deployment
3. On phone:
   - Close YFIT app completely (swipe away)
   - Reopen app
   - Test your changes

#### **Quick Test Example:**

```javascript
// Change something obvious
<h1 style={{ color: 'red' }}>TEST UPDATE</h1>
```

Push → Wait 2-3 min → Reopen app → See red heading!

---

## 🏗️ Architecture Overview

### **Tech Stack**

```
Frontend: React + Vite
Styling: Tailwind CSS
Backend: Supabase (PostgreSQL)
Auth: Supabase Auth
Storage: Supabase Storage
Hosting: Vercel
Mobile: Capacitor (WebView)
```

### **Data Flow**

```
User Interaction
    ↓
React Components
    ↓
Supabase Client
    ↓
Supabase API
    ↓
PostgreSQL Database
    ↓
Response to User
```

### **Deployment Architecture**

```
GitHub Repository (Source of Truth)
    ↓
Vercel (Webhook Listener)
    ↓
Build Process (npm run build)
    ↓
Static Assets (dist/)
    ↓
Vercel CDN (Global Distribution)
    ↓
Users (Web + Android)
```

### **File Structure**

```
yfit/
├── src/
│   ├── components/         # React components
│   ├── lib/               # Utilities (Supabase, etc.)
│   ├── contexts/          # React contexts
│   └── App.jsx            # Main app component
├── public/                # Static assets
├── android/               # Capacitor Android project
├── capacitor.config.json  # Capacitor configuration
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── vite.config.js        # Vite configuration
```

### **Key Configuration Files**

#### **capacitor.config.json**
```json
{
  "server": {
    "url": "https://yfit-deploy.vercel.app"
  }
}
```
**Purpose:** Tells Android app to load from Vercel

#### **vercel.json**
```json
{
  "buildCommand": "CI=false npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```
**Purpose:** Configures Vercel build process

---

## 🔧 Troubleshooting

### **Changes Not Showing on Android**

**Symptoms:**
- Pushed to GitHub
- Vercel deployed successfully
- Android app still shows old version

**Solutions:**

1. **Force Close and Reopen:**
   ```
   - Swipe app away from recent apps
   - Wait 5 seconds
   - Reopen app
   ```

2. **Clear App Cache:**
   ```
   - Android Settings → Apps → YFIT
   - Storage → Clear Cache
   - Reopen app
   ```

3. **Check Vercel Deployment:**
   ```
   - Visit: https://vercel.com/dashboard
   - Verify deployment completed
   - Check deployment logs for errors
   ```

4. **Verify Capacitor Config:**
   ```json
   // capacitor.config.json should have:
   {
     "server": {
       "url": "https://yfit-deploy.vercel.app"
     }
   }
   ```

5. **Rebuild APK (Last Resort):**
   ```powershell
   npm run build
   npx cap sync android
   npx cap open android
   # Build → Build APK in Android Studio
   ```

### **Vercel Deployment Fails**

**Symptoms:**
- Push to GitHub succeeds
- Vercel shows "Failed" status
- Build logs show errors

**Solutions:**

1. **Check Build Locally:**
   ```powershell
   npm run build
   ```
   If it fails locally, fix the errors first.

2. **Check Vercel Logs:**
   ```
   - Go to: https://vercel.com/dashboard
   - Click your project
   - Click failed deployment
   - Read error logs
   ```

3. **Common Issues:**
   - **ESLint errors:** Set `CI=false` in vercel.json
   - **Missing dependencies:** Check package.json
   - **Environment variables:** Verify in Vercel dashboard
   - **Build timeout:** Optimize build process

4. **Manual Deploy (Fallback):**
   ```powershell
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### **Date Picker Display Issues**

**Issue:** Date shows as `2026-01-1` instead of `2026-01-13`

**Solution:** Use `formatDateString` helper function:

```javascript
const formatDateString = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

**Applied in:** `src/components/NutritionEnhanced.jsx`

### **Authentication Issues**

**Symptoms:**
- Users can't log in
- Session expires immediately
- Redirect loops

**Solutions:**

1. **Check Supabase URLs:**
   ```javascript
   // In Vercel environment variables:
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

2. **Verify Redirect URLs:**
   ```
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: https://yfit-deploy.vercel.app
   - Redirect URLs: https://yfit-deploy.vercel.app/**
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for Supabase errors
   - Check network tab for failed requests

---

## 📚 Quick Reference Commands

### **Local Development**

```powershell
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Git Operations**

```powershell
# Check status
git status

# Stage all changes
git add .

# Commit with message
git commit -m "Your message"

# Push to GitHub (triggers Vercel deployment)
git push origin main

# Pull latest changes
git pull origin main
```

### **Vercel CLI (Optional)**

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

### **Capacitor (Android)**

```powershell
# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Run on connected device
npx cap run android
```

### **Testing**

```powershell
# Test on web (after deployment)
# Visit: https://yfit-deploy.vercel.app

# Test on Android (after deployment)
# 1. Close app completely
# 2. Reopen app
# 3. Test changes
```

---

## 🎯 Best Practices

### **Commit Messages**

Use clear, descriptive messages:

```
✅ Good:
- "Fix: Date picker showing truncated dates"
- "Feature: Add nutrition goal tracking"
- "Update: Improve meal logging UI"

❌ Bad:
- "update"
- "changes"
- "fix bug"
```

### **Before Pushing**

```powershell
# 1. Test locally
npm run dev

# 2. Test build
npm run build

# 3. Check what's changed
git status
git diff

# 4. Commit and push
git add .
git commit -m "Clear message"
git push origin main
```

### **After Pushing**

```
1. Monitor Vercel dashboard
2. Wait for deployment (2-3 min)
3. Test on web first
4. Then test on Android
5. Verify all features work
```

### **Development Cycle**

```
Make changes → Test locally → Push to GitHub → Vercel deploys → Test on web → Test on Android → Done!
```

---

## 📊 Monitoring

### **Vercel Dashboard**

**URL:** https://vercel.com/dashboard

**What to monitor:**
- ✅ Deployment status (Success/Failed)
- ✅ Build logs
- ✅ Deployment time
- ✅ Error messages

### **GitHub Repository**

**URL:** https://github.com/yfitai/yfit-app

**What to monitor:**
- ✅ Commit history
- ✅ Branch status
- ✅ Pull requests
- ✅ Issues

### **Supabase Dashboard**

**URL:** https://supabase.com/dashboard

**What to monitor:**
- ✅ Database queries
- ✅ Auth logs
- ✅ Storage usage
- ✅ API requests

---

## 🚨 Emergency Procedures

### **Rollback Deployment**

If a deployment breaks production:

1. **Via Vercel Dashboard:**
   ```
   - Go to: https://vercel.com/dashboard
   - Click project → Deployments
   - Find last working deployment
   - Click "..." → Promote to Production
   ```

2. **Via Git:**
   ```powershell
   # Revert last commit
   git revert HEAD
   git push origin main
   
   # Vercel auto-deploys the reverted version
   ```

### **Critical Bug Fix**

1. **Identify the bug**
2. **Fix in code**
3. **Test locally:** `npm run dev`
4. **Test build:** `npm run build`
5. **Push immediately:** `git push origin main`
6. **Monitor deployment:** Watch Vercel dashboard
7. **Test fix:** On web and Android
8. **Verify:** Confirm bug is fixed

**Timeline:** 5-10 minutes from fix to live

---

## 📝 Change Log

### **January 13, 2026**

**Demo Mode Removal:**
- Removed all demo mode functionality (26 files)
- Cleaned ~200 demo mode references
- All users now require authentication
- All data stored in Supabase

**Date Picker Fix:**
- Fixed truncated date display on Android
- Added `formatDateString` helper function
- Ensures proper zero-padding (YYYY-MM-DD)
- Applied to NutritionEnhanced component

**Documentation:**
- Created comprehensive automation reference
- Documented deployment process
- Documented Android auto-update system
- Added troubleshooting guide

---

## 🎓 Key Concepts

### **WebView vs Native App**

**YFIT is a hybrid app:**
- Uses Capacitor (WebView)
- Loads content from Vercel
- Feels like native app
- Updates like web app

**Benefits:**
- ✅ Instant updates (no APK needed)
- ✅ Single codebase (React)
- ✅ Easy maintenance
- ✅ Fast development

**Trade-offs:**
- ⚠️ Requires internet connection
- ⚠️ Slightly slower than pure native
- ⚠️ Limited offline functionality

### **Vercel Auto-Deployment**

**How it works:**
1. GitHub webhook notifies Vercel of push
2. Vercel clones repository
3. Runs `npm install`
4. Runs `npm run build`
5. Uploads `dist/` to CDN
6. Updates live URL

**Why it's great:**
- ✅ Fully automated
- ✅ Fast (2-3 minutes)
- ✅ Reliable
- ✅ Free for personal projects
- ✅ Global CDN

---

## 🔗 Important Links

- **Live App:** https://yfit-deploy.vercel.app
- **GitHub:** https://github.com/yfitai/yfit-app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## ✅ Summary

**Your deployment is 100% automated:**

```
Push to GitHub → Vercel auto-deploys → Android auto-updates
```

**No manual steps needed:**
- ❌ No manual builds
- ❌ No APK distribution
- ❌ No Play Store updates
- ❌ No user downloads
- ✅ Just push and it's live!

**Timeline:**
- Push → 2-3 minutes → Live!

**User experience:**
- Close app → Reopen → Updated!

**It doesn't get simpler than this!** 🚀

---

**End of Automation Reference Guide**

*Keep this document for future reference. All automation details are documented here.*
