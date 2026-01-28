# YFIT App - Deployment & Auto-Update Guide

## 🚀 Quick Start: Making Changes

### For Code Changes (Bug Fixes, Features, UI Updates)

```powershell
# 1. Make your changes in the code
# 2. Commit and push to GitHub
git add .
git commit -m "Description of changes"
git push origin main

# 3. That's it! Vercel auto-deploys and users get the update banner
```

**Timeline:**
- Vercel builds and deploys: ~2-3 minutes
- Android users see purple update banner: Within 60 seconds of opening the app
- Users tap banner → App reloads with new code

---

## 📱 Auto-Update System Explained

### How It Works

1. **VersionChecker Component** (`src/utils/VersionChecker.jsx`)
   - Runs only on Android/iOS (Capacitor native apps)
   - Checks `version.json` every 60 seconds
   - Also checks when user returns to the app
   - Compares server timestamp with stored timestamp

2. **Version File** (`public/version.json`)
   ```json
   {
     "version": "1.0.10",
     "timestamp": "2026-01-27T12:34:56.789Z",
     "buildNumber": 10
   }
   ```

3. **Auto-Bump Script** (`scripts/bump-version.js`)
   - Runs automatically before every Vercel build
   - Updates timestamp to current time
   - Increments build number
   - Updates version string

4. **Purple Update Banner**
   - Appears at top of screen when update detected
   - Text: "🎉 New version available! Tap to update"
   - Gradient background: Purple (#667eea) to (#764ba2)
   - Tapping reloads the app with new code

### What Gets Updated Automatically

✅ **No AAB Rebuild Needed:**
- Bug fixes
- UI changes
- New features (React components)
- Text/content updates
- API endpoint changes
- Database queries
- Styling changes

❌ **Requires New AAB:**
- Native plugin changes
- Android permissions changes
- App icon/name changes
- Major version updates (2.0.0)
- Capacitor configuration changes

---

## 🔧 GitHub to Vercel Workflow

### Current Setup

**Repository:** https://github.com/yfitai/yfit-app
**Vercel Project:** yfit-deploy
**Production URL:** https://yfit-deploy.vercel.app

### Automatic Deployment

```
Code Change → Push to GitHub → Vercel Webhook → Build → Deploy → Update Banner
```

**Vercel Build Command:**
```bash
npm run build
# This automatically runs: node scripts/bump-version.js
```

**Build Output:** `/dist` folder (Vite build)

### Manual Deployment (if needed)

```powershell
# Trigger Vercel deployment manually
vercel --prod

# Or use Vercel dashboard:
# https://vercel.com/yfitai/yfit-deploy
```

---

## 📦 Building Android AAB (When Required)

### When You Need a New AAB

- Major version updates (1.x.x → 2.0.0)
- Native plugin changes
- Android permissions changes
- App icon/splash screen changes

### GitHub Actions Workflow

**Location:** `.github/workflows/android-build.yml`

**Trigger Build:**

1. Go to: https://github.com/yfitai/yfit-app/actions
2. Click "Build Android AAB" in sidebar
3. Click "Run workflow" button
4. Wait ~6-7 minutes for build to complete
5. Download AAB from Artifacts section

**Build Requirements:**
- Java 21 (configured in workflow)
- Gradle 8.9.1
- Android SDK 36
- Signing keystore (stored in GitHub Secrets)

### GitHub Secrets (Already Configured)

- `KEYSTORE_BASE64` - Base64-encoded keystore file
- `KEYSTORE_PASSWORD` - XnsAudW53SP8
- `KEY_ALIAS` - yfit-key
- `KEY_PASSWORD` - XnsAudW53SP8

### Version Numbers

**Update before building AAB:**

File: `android/app/build.gradle`

```gradle
versionCode 6        // Increment by 1 for each release
versionName "1.0.10" // Semantic version
```

**Google Play Console requires:**
- `versionCode` must be higher than previous release
- `versionName` should match (but not enforced)

---

## 🔐 Authentication & Tokens

### GitHub Personal Access Token

**Token:** [Stored securely - contact admin]
**Scopes:** repo, workflow
**Expiration:** No expiration
**Usage:** Push code, trigger workflows

**Configure Git Credentials:**

```powershell
# If push fails with authentication error:
git config credential.helper store
git push origin main
# Enter username: yfitai
# Enter password: [paste token above]
```

### Vercel Token (if needed)

Check Vercel dashboard: https://vercel.com/account/tokens

---

## 🐛 Troubleshooting

### Update Banner Not Showing

**Check 1: Is the app loading from Vercel?**
```javascript
// In browser console (desktop):
console.log(window.location.origin)
// Should show: https://yfit-deploy.vercel.app
```

**Check 2: Is VersionChecker running?**
```javascript
// Check browser console for logs:
// "Version check: { server: '...', stored: '...' }"
```

**Check 3: Force a new timestamp**
```powershell
# Manually trigger a deployment
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

**Check 4: Clear app storage**
```
Android Settings → Apps → YFIT AI → Storage → Clear Data
```

### AAB Build Fails

**Common Issues:**

1. **Java Version Mismatch**
   - Solution: Workflow uses Java 21 (configured)

2. **Version Code Already Used**
   - Solution: Increment `versionCode` in `android/app/build.gradle`

3. **Keystore Not Found**
   - Solution: Check GitHub Secrets are set correctly

4. **Gradle Build Error**
   - Solution: Check build logs for specific error
   - May need to update dependencies

### Vercel Deployment Fails

**Check Vercel Dashboard:**
https://vercel.com/yfitai/yfit-deploy/deployments

**Common Issues:**

1. **Build Command Failed**
   - Check `package.json` scripts
   - Ensure `scripts/bump-version.js` exists

2. **Environment Variables Missing**
   - Check Vercel project settings
   - Ensure all required env vars are set

---

## 📝 Development Workflow

### Daily Development

```powershell
# 1. Make changes locally
code .

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Fix: Description of changes"
git push origin main

# 4. Verify deployment
# Check Vercel dashboard or visit https://yfit-deploy.vercel.app

# 5. Test on Android
# Open app → Wait 60 seconds → See purple banner → Tap to update
```

### Release Checklist

**For Minor Updates (1.0.x):**
- [ ] Make code changes
- [ ] Test locally
- [ ] Push to GitHub
- [ ] Verify Vercel deployment
- [ ] Test update banner on Android

**For Major Updates (1.x.0 or 2.0.0):**
- [ ] Update `versionCode` and `versionName` in `android/app/build.gradle`
- [ ] Commit version changes
- [ ] Push to GitHub
- [ ] Trigger GitHub Actions build
- [ ] Download AAB from Artifacts
- [ ] Upload to Google Play Console
- [ ] Submit for review
- [ ] Monitor rollout

---

## 🎯 Key Files Reference

### Configuration Files

- `capacitor.config.json` - Capacitor configuration (server URL, plugins)
- `android/app/build.gradle` - Android build config (version codes)
- `public/version.json` - Version tracking for update banner
- `.github/workflows/android-build.yml` - GitHub Actions build workflow
- `scripts/bump-version.js` - Auto-increment version on build

### Update System Files

- `src/utils/VersionChecker.jsx` - Update banner component
- `src/App.jsx` - Loads VersionChecker component (line 66)

### Deployment Files

- `vercel.json` - Vercel configuration (if exists)
- `vite.config.js` - Vite build configuration
- `package.json` - Build scripts and dependencies

---

## 🆘 Emergency Procedures

### Rollback Deployment

**Vercel:**
1. Go to: https://vercel.com/yfitai/yfit-deploy/deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"

**GitHub:**
```powershell
# Revert last commit
git revert HEAD
git push origin main
```

### Disable Auto-Updates Temporarily

**Option 1: Comment out VersionChecker**

File: `src/App.jsx` (line 66)
```jsx
{/* <VersionChecker /> */}
```

**Option 2: Set very old timestamp**

File: `public/version.json`
```json
{
  "timestamp": "2020-01-01T00:00:00.000Z"
}
```

Push changes to GitHub → Vercel deploys → Users won't see update banner

---

## 📞 Support Resources

- **GitHub Repository:** https://github.com/yfitai/yfit-app
- **Vercel Dashboard:** https://vercel.com/yfitai/yfit-deploy
- **Google Play Console:** https://play.google.com/console
- **Capacitor Docs:** https://capacitorjs.com/docs

---

## 📊 Monitoring

### Check Deployment Status

**Vercel:**
```bash
# View recent deployments
vercel ls

# Check deployment logs
vercel logs [deployment-url]
```

**GitHub Actions:**
- View workflow runs: https://github.com/yfitai/yfit-app/actions

### Version Tracking

**Current Version:**
- Check `public/version.json` for latest timestamp
- Check `package.json` for version number
- Check `android/app/build.gradle` for versionCode

**User Versions:**
- Google Play Console → Statistics → Version distribution

---

## ✅ Success Criteria

**Deployment Successful When:**
- ✅ Vercel build completes without errors
- ✅ Production URL loads correctly
- ✅ `version.json` timestamp is updated
- ✅ Android app shows purple update banner within 60 seconds
- ✅ Tapping banner reloads app with new code

**AAB Build Successful When:**
- ✅ GitHub Actions workflow completes (green checkmark)
- ✅ AAB artifact is downloadable
- ✅ Google Play Console accepts the AAB
- ✅ Version code is higher than previous release

---

*Last Updated: January 28, 2026*
*Maintained by: YFIT Development Team*
