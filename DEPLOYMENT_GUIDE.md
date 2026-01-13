# YFIT Deployment Guide - Complete Step-by-Step

This guide will walk you through deploying your cleaned YFIT app to production.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Git installed
- ✅ Node.js installed (v18 or higher)
- ✅ GitHub account
- ✅ Vercel account (free tier is fine)
- ✅ Android Studio (if building APK)

---

## Part 1: Local Testing (Windows PowerShell)

### Step 1: Navigate to Your Project

Open PowerShell and navigate to your project directory:

```powershell
# Replace with your actual path
cd C:\Users\YourUsername\path\to\yfit
```

### Step 2: Install Dependencies

```powershell
npm install
```

**Expected output:**
```
added 453 packages in 12s
```

### Step 3: Test Build Locally

```powershell
npm run build
```

**Expected output:**
```
✓ 2744 modules transformed.
✓ built in 17.08s
```

✅ If you see this, the build is successful!

### Step 4: Test Development Server

```powershell
npm run dev
```

**Expected output:**
```
VITE v6.4.1  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Testing Steps:**
1. Open browser to `http://localhost:5173/`
2. Try to log in with a real user account
3. Test key features:
   - Add a meal
   - Log weight
   - View progress
4. Verify no demo mode references appear

**Stop the server:** Press `Ctrl+C` in PowerShell

---

## Part 2: Push to GitHub

### Step 1: Check Git Status

```powershell
git status
```

You should see all the modified files from the demo mode cleanup.

### Step 2: Stage All Changes

```powershell
git add .
```

### Step 3: Commit Changes

```powershell
git commit -m "Remove demo mode functionality - production ready"
```

### Step 4: Push to GitHub

```powershell
# If you haven't set up remote yet
git remote add origin https://github.com/YourUsername/yfit.git

# Push to main branch
git push origin main
```

**If you get authentication error:**
```powershell
# Use GitHub CLI or Personal Access Token
# Option 1: Install GitHub CLI
winget install GitHub.cli

# Then authenticate
gh auth login

# Then push again
git push origin main
```

---

## Part 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Recommended for First Time)

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Sign Up" or "Log In"
   - Choose "Continue with GitHub"

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Find your `yfit` repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Environment Variables:**
   Click "Environment Variables" and add:
   
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   ⚠️ **Important:** Get these from your Supabase dashboard:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - You'll get a URL like: `https://yfit-abc123.vercel.app`

### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? yfit
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Part 4: Configure Supabase for Production

### Step 1: Update Supabase URL Whitelist

1. Go to https://supabase.com/dashboard
2. Select your YFIT project
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Site URL:**
   ```
   https://yfit-abc123.vercel.app
   ```
5. Add to **Redirect URLs:**
   ```
   https://yfit-abc123.vercel.app/**
   ```

### Step 2: Test Production Authentication

1. Visit your Vercel URL
2. Try to sign up with a new account
3. Check email for verification
4. Log in and test features

---

## Part 5: Build Android APK (Optional)

### Prerequisites

- Android Studio installed
- Java JDK 17 installed

### Step 1: Install Capacitor CLI (if not already)

```powershell
npm install -g @capacitor/cli
```

### Step 2: Build Web Assets

```powershell
npm run build
```

### Step 3: Sync with Capacitor

```powershell
npx cap sync android
```

**Expected output:**
```
✔ Copying web assets from dist to android\app\src\main\assets\public in 1.23s
✔ Creating capacitor.config.json in android\app\src\main\assets in 12.45ms
✔ copy android in 1.25s
✔ Updating Android plugins in 23.45ms
```

### Step 4: Open in Android Studio

```powershell
npx cap open android
```

This will launch Android Studio with your project.

### Step 5: Build APK in Android Studio

1. **Wait for Gradle sync** to complete (bottom right corner)
2. **Build APK:**
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. **Wait for build** (2-5 minutes)
4. **Locate APK:**
   - Click "locate" in the notification
   - Or find it at: `android\app\build\outputs\apk\debug\app-debug.apk`

### Step 6: Test APK

1. **Transfer to Android device:**
   ```powershell
   # Via ADB
   adb install android\app\build\outputs\apk\debug\app-debug.apk
   ```

2. **Or email the APK to yourself and install on device**

3. **Test the app:**
   - Open YFIT app
   - Log in with your account
   - Test all features

---

## Part 6: Monitoring & Maintenance

### Check Vercel Deployment Logs

```powershell
# Install Vercel CLI if not already
npm install -g vercel

# View logs
vercel logs
```

### Check for Errors

1. **Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Click your project
   - Check "Deployments" tab for any errors

2. **Browser Console:**
   - Open your deployed app
   - Press F12 to open DevTools
   - Check Console tab for errors

### Update Environment Variables

If you need to update Supabase keys or other env vars:

```powershell
# Via CLI
vercel env add VITE_SUPABASE_URL production

# Or via dashboard:
# 1. Go to Vercel dashboard
# 2. Select project → Settings → Environment Variables
# 3. Edit or add variables
# 4. Redeploy for changes to take effect
```

---

## Part 7: Troubleshooting

### Issue: Build Fails on Vercel

**Solution:**
```powershell
# Check build locally first
npm run build

# If it works locally but fails on Vercel:
# 1. Check Node.js version in vercel.json
# 2. Ensure all dependencies are in package.json
# 3. Check Vercel build logs for specific errors
```

### Issue: Authentication Not Working

**Solution:**
1. Verify Supabase URL is correct in Vercel env vars
2. Check Supabase redirect URLs include your Vercel domain
3. Clear browser cache and cookies
4. Check Supabase logs for auth errors

### Issue: APK Won't Install

**Solution:**
```powershell
# Enable "Install from Unknown Sources" on Android device
# Or sign the APK:

# Generate keystore
keytool -genkey -v -keystore yfit-release-key.keystore -alias yfit -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK in Android Studio:
# Build → Generate Signed Bundle / APK → APK
# Follow wizard with your keystore
```

### Issue: Features Not Working After Deployment

**Solution:**
1. Check browser console for errors
2. Verify all API endpoints are correct
3. Check Supabase RLS policies allow authenticated users
4. Test with different browsers
5. Clear application cache

---

## Part 8: Custom Domain (Optional)

### Step 1: Purchase Domain

- Namecheap, GoDaddy, or Google Domains
- Example: `yfit-app.com`

### Step 2: Add to Vercel

1. Go to Vercel dashboard → Your project
2. Click **Settings** → **Domains**
3. Click **Add**
4. Enter your domain: `yfit-app.com`
5. Click **Add**

### Step 3: Configure DNS

Vercel will show you DNS records to add:

**For root domain (yfit-app.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 4: Wait for DNS Propagation

- Usually takes 5-60 minutes
- Check status in Vercel dashboard
- Once verified, your app will be live at your custom domain!

### Step 5: Update Supabase

Add your custom domain to Supabase redirect URLs:
```
https://yfit-app.com/**
https://www.yfit-app.com/**
```

---

## Part 9: Continuous Deployment

### Automatic Deployments

Now that you're connected to GitHub, every time you push to main:

```powershell
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Send you a notification

### Preview Deployments

For testing before production:

```powershell
# Create a new branch
git checkout -b feature/new-feature

# Make changes and push
git add .
git commit -m "Test new feature"
git push origin feature/new-feature
```

Vercel creates a preview URL for testing before merging to main!

---

## Quick Reference Commands

### Local Development
```powershell
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Git Commands
```powershell
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push origin main # Push to GitHub
```

### Vercel Commands
```powershell
vercel               # Deploy to preview
vercel --prod        # Deploy to production
vercel logs          # View logs
vercel env ls        # List environment variables
```

### Capacitor Commands
```powershell
npx cap sync         # Sync web assets
npx cap open android # Open in Android Studio
npx cap run android  # Build and run on device
```

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Vite Docs:** https://vitejs.dev/guide/

---

## Checklist

Use this checklist to track your deployment:

- [ ] Local testing completed
- [ ] Build passes without errors
- [ ] Changes committed to Git
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Supabase URLs updated
- [ ] Production authentication tested
- [ ] Android APK built (if needed)
- [ ] APK tested on device (if needed)
- [ ] Custom domain configured (if needed)
- [ ] Monitoring set up

---

**Congratulations!** 🎉

Your YFIT app is now deployed and production-ready!

If you encounter any issues, refer to the troubleshooting section or check the error logs in Vercel dashboard.
