# YFIT Automated Deployment Guide

Your YFIT app now has **fully automated CI/CD** set up! 🚀

---

## 🎯 How It Works

When you push code to GitHub, the following happens **automatically**:

```
You Push to GitHub
       ↓
GitHub Actions Runs
       ↓
   ┌───┴───┐
   ↓       ↓
Vercel   Android APK
Deploys   Builds
   ↓       ↓
 Live!   Download
```

---

## 🚀 Quick Start - One Command Deployment

### **Windows PowerShell:**

```powershell
.\push-and-deploy.ps1
```

That's it! This script will:
1. ✅ Stage all your changes
2. ✅ Commit with your message
3. ✅ Push to GitHub
4. ✅ Trigger automatic deployment

---

## 📋 What Happens Automatically

### 1. **GitHub Actions** (Runs immediately after push)
- ✅ Installs dependencies
- ✅ Builds the project
- ✅ Runs tests
- ✅ Builds Android APK
- ✅ Uploads APK as artifact

**View progress:** https://github.com/yfitai/yfit-app/actions

### 2. **Vercel Deployment** (Runs in parallel)
- ✅ Detects GitHub push
- ✅ Builds production bundle
- ✅ Deploys to live URL
- ✅ Sends deployment notification

**View dashboard:** https://vercel.com/dashboard

### 3. **Android APK** (Built by GitHub Actions)
- ✅ Syncs Capacitor
- ✅ Builds debug APK
- ✅ Available for download

**Download:** GitHub Actions → Latest workflow → Artifacts → `yfit-app-debug.zip`

---

## ⏱️ Timeline

| Step | Time | Status |
|------|------|--------|
| Push to GitHub | Instant | ✅ |
| GitHub Actions starts | 10-30 seconds | ⏳ |
| Vercel deployment | 2-3 minutes | ⏳ |
| Android APK build | 5-10 minutes | ⏳ |
| **Total** | **~10 minutes** | ✅ |

---

## 🎮 Manual Commands (If Needed)

### **Push to GitHub:**
```powershell
git add .
git commit -m "Your message"
git push origin main
```

### **Check deployment status:**
```powershell
# GitHub Actions
# Visit: https://github.com/yfitai/yfit-app/actions

# Vercel
# Visit: https://vercel.com/dashboard
```

---

## 📦 Download Android APK

### **From GitHub Actions:**

1. Go to: https://github.com/yfitai/yfit-app/actions
2. Click on the latest successful workflow run
3. Scroll down to **Artifacts**
4. Download `yfit-app-debug.zip`
5. Extract and install `app-debug.apk` on your Android device

### **From Command Line:**
```powershell
# Install GitHub CLI if not already installed
winget install GitHub.cli

# Download latest APK artifact
gh run download --name yfit-app-debug
```

---

## 🔧 First-Time Setup

### **1. Connect Vercel to GitHub** (One-time)

If Vercel isn't connected yet:

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import `yfitai/yfit-app` repository
5. Configure:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
7. Click "Deploy"

**After this, all future pushes deploy automatically!**

### **2. Update Supabase URLs** (One-time)

1. Go to https://supabase.com/dashboard
2. Select your YFIT project
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel URL:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**`

---

## 📊 Monitoring

### **GitHub Actions Status:**
- Green checkmark ✅ = Success
- Red X ❌ = Failed (check logs)
- Yellow circle 🟡 = Running

### **Vercel Deployment:**
- **Production:** Your live app URL
- **Preview:** Automatic preview for pull requests

### **Build Logs:**
- GitHub Actions: Click on workflow → Click on job → View logs
- Vercel: Dashboard → Project → Deployments → Click deployment → View logs

---

## 🐛 Troubleshooting

### **Build Fails on GitHub Actions:**

```powershell
# Test build locally first
npm install
npm run build

# If it works locally, check GitHub Actions logs
# Usually it's a missing environment variable or dependency issue
```

### **Vercel Deployment Fails:**

1. Check environment variables in Vercel dashboard
2. Verify `vercel.json` configuration
3. Check Vercel deployment logs
4. Ensure Supabase URLs are correct

### **Android APK Build Fails:**

1. Check GitHub Actions logs for specific error
2. Verify `capacitor.config.json` is correct
3. Ensure Android SDK versions are compatible
4. Try building locally:
   ```powershell
   npm run build
   npx cap sync android
   npx cap open android
   ```

### **Push to GitHub Fails:**

```powershell
# Check authentication
git remote -v

# Re-authenticate if needed
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Try pushing again
git push origin main
```

---

## 🎯 Best Practices

### **Commit Messages:**
Use clear, descriptive messages:
```
✅ Good: "Add nutrition tracking feature"
✅ Good: "Fix login authentication bug"
❌ Bad: "update"
❌ Bad: "changes"
```

### **Before Pushing:**
```powershell
# Test locally
npm run dev

# Test build
npm run build

# Check what's changed
git status
git diff
```

### **Branching Strategy:**
```powershell
# Create feature branch for testing
git checkout -b feature/new-feature

# Make changes and push
git push origin feature/new-feature

# GitHub Actions will create preview deployment
# Test thoroughly before merging to main
```

---

## 🚀 Advanced: Release Tags

To create a GitHub release with APK:

```powershell
# Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

GitHub Actions will automatically:
- Build the APK
- Create a GitHub Release
- Attach the APK to the release

---

## 📚 Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Vercel Docs:** https://vercel.com/docs
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Your Repository:** https://github.com/yfitai/yfit-app

---

## ✅ Deployment Checklist

- [ ] Vercel connected to GitHub (one-time)
- [ ] Environment variables set in Vercel (one-time)
- [ ] Supabase redirect URLs updated (one-time)
- [ ] Run `.\push-and-deploy.ps1`
- [ ] Wait ~10 minutes for full deployment
- [ ] Check GitHub Actions for build status
- [ ] Check Vercel for live URL
- [ ] Download APK from GitHub Actions artifacts
- [ ] Test deployed app
- [ ] Test APK on Android device

---

## 🎉 You're All Set!

Your YFIT app now has enterprise-grade CI/CD automation:

✅ **Push once** → **Deploy everywhere**  
✅ **No manual builds**  
✅ **Automatic testing**  
✅ **Instant rollbacks** (via Vercel)  
✅ **APK artifacts** (always available)

Just run `.\push-and-deploy.ps1` and let automation handle the rest! 🚀
