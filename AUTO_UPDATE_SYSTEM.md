# Automatic Update System - Version Checking

**Date:** January 13, 2026  
**Status:** Implemented - Requires final APK rebuild

---

## 🎯 How It Works

### **The Problem We Solved:**
Android WebView caches aggressively, preventing automatic updates even with cache-busting configuration.

### **The Solution:**
**Version-checking system** that automatically detects and applies updates without user intervention.

---

## 🔧 Technical Implementation

### **1. Version Tracking (`public/version.json`)**

```json
{
  "version": "1.0.0",
  "timestamp": "2026-01-13T00:00:00Z",
  "buildNumber": 1
}
```

- Deployed with every build
- Incremented manually when pushing updates
- Checked by mobile app periodically

### **2. VersionChecker Component (`src/utils/VersionChecker.jsx`)**

**Features:**
- ✅ Runs only on mobile (Capacitor)
- ✅ Checks version every 30 seconds
- ✅ Compares server version with stored version
- ✅ Automatically reloads when new version detected
- ✅ Shows brief notification: "🎉 Updating to latest version..."
- ✅ Uses aggressive cache-busting headers

**How it works:**
1. On app startup, fetches `/version.json?t=${timestamp}`
2. Compares `buildNumber` with locally stored version
3. If different, shows notification and reloads
4. Continues checking every 30 seconds while app is open

### **3. Integration**

Added to `App.jsx`:
```jsx
import VersionChecker from './utils/VersionChecker'

return (
  <UnitPreferenceProvider>
    <VersionChecker />
    <BrowserRouter>
      ...
    </BrowserRouter>
  </UnitPreferenceProvider>
)
```

---

## 📱 User Experience

### **Before (Manual):**
```
1. App shows old version
2. User must: Settings → Apps → YFIT → Clear Cache
3. Reopen app
4. See new version
```

### **After (Automatic):**
```
1. App opens
2. Checks for updates automatically
3. If update available: Shows "Updating..." notification
4. Automatically reloads
5. User sees new version
```

**Time:** < 2 seconds  
**User action:** None! ✅

---

## 🚀 Deployment Workflow

### **For Regular Updates (No Version Change):**

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

**Result:** Vercel deploys, but mobile app won't auto-update (same version number)

---

### **For Updates That Need Mobile Refresh:**

```bash
# 1. Make your changes

# 2. Update version number
# Edit public/version.json:
{
  "version": "1.0.1",  # Increment version
  "timestamp": "2026-01-13T12:00:00Z",  # Update timestamp
  "buildNumber": 2  # INCREMENT THIS!
}

# 3. Commit and push
git add .
git commit -m "Your changes - v1.0.1"
git push origin main
```

**Result:** 
- Vercel deploys
- Mobile app detects new `buildNumber`
- Automatically reloads within 30 seconds
- Users see update with no action needed! ✅

---

## 🧪 Testing the System

### **After Rebuilding APK:**

1. **Install the new APK** (with VersionChecker)
2. **Open the app** - Should work normally
3. **Make a visible change** (e.g., change button color)
4. **Update version.json:**
   ```json
   {
     "version": "1.0.1",
     "timestamp": "2026-01-13T12:00:00Z",
     "buildNumber": 2
   }
   ```
5. **Push to GitHub**
6. **Wait 2-3 minutes** for Vercel deployment
7. **Keep app open** or reopen it
8. **Within 30 seconds:** Should see "Updating..." notification
9. **App reloads automatically**
10. **See the change!** ✅

---

## ⚙️ Configuration

### **Check Interval:**
```javascript
const VERSION_CHECK_INTERVAL = 30000; // 30 seconds
```

**Adjust in:** `src/utils/VersionChecker.jsx`

- **Shorter (10s):** More responsive, more network requests
- **Longer (60s):** Less responsive, fewer network requests
- **Recommended:** 30s (good balance)

### **Notification Duration:**
```javascript
setTimeout(() => {
  window.location.reload(true);
}, 1000); // 1 second
```

**Adjust in:** `src/utils/VersionChecker.jsx`

---

## 📊 Version Number Strategy

### **Semantic Versioning:**

```
version: "MAJOR.MINOR.PATCH"
buildNumber: Auto-increment integer
```

**Examples:**

| Change Type | Version | Build # | Example |
|-------------|---------|---------|---------|
| Bug fix | 1.0.1 | 2 | Fixed date picker |
| New feature | 1.1.0 | 3 | Added meal templates |
| Major update | 2.0.0 | 4 | Complete redesign |

**Important:** Always increment `buildNumber` for mobile updates!

---

## 🎯 When to Increment Version

### **Always Increment:**
- ✅ UI changes (colors, layout, text)
- ✅ Bug fixes
- ✅ New features
- ✅ Data structure changes
- ✅ Any change users should see

### **Don't Need to Increment:**
- ❌ Backend-only changes (if separate)
- ❌ Documentation updates
- ❌ Internal refactoring (no visible change)

**Rule of thumb:** If beta testers should see it, increment!

---

## 🔧 Troubleshooting

### **Updates Not Appearing:**

1. **Check Vercel deployment:**
   - Go to https://vercel.com/dashboard
   - Verify deployment succeeded
   - Check `version.json` is updated

2. **Check mobile app:**
   - Open browser console (if debugging)
   - Look for "Version check:" logs
   - Verify buildNumber changed

3. **Force check:**
   - Close and reopen app
   - Wait 30 seconds
   - Should trigger check

### **App Reloading Too Often:**

- Check if `buildNumber` is being incremented on every commit
- Only increment when you want mobile to update

### **Notification Not Showing:**

- Check if app is in foreground
- Notification shows for 1 second before reload
- May be too quick to see (this is OK!)

---

## 📝 Best Practices

### **For Development:**
1. Make changes
2. Test locally: `npm run dev`
3. When ready for beta testers:
   - Update `version.json` buildNumber
   - Commit and push
   - Notify testers (optional - will auto-update!)

### **For Beta Testing:**
1. Increment version for each test build
2. Keep a changelog
3. Testers don't need to do anything
4. Updates apply automatically within 30 seconds

### **For Production:**
1. Use semantic versioning
2. Document changes in commit messages
3. Increment buildNumber for every release
4. Users get updates seamlessly

---

## 🎉 Benefits

### **For Users:**
- ✅ No manual steps
- ✅ No cache clearing
- ✅ No APK downloads
- ✅ Updates appear automatically
- ✅ Seamless experience

### **For Developers:**
- ✅ Push to GitHub = Deploy
- ✅ Control when mobile updates
- ✅ No APK distribution
- ✅ Fast iteration
- ✅ Easy beta testing

### **For Beta Testers:**
- ✅ Always on latest version
- ✅ No manual updates
- ✅ Can provide immediate feedback
- ✅ Professional experience

---

## 🚨 Important Notes

1. **One more APK rebuild required** to include VersionChecker
2. **After that, no more APK rebuilds** for regular updates
3. **Always increment buildNumber** when you want mobile to update
4. **Version checks happen every 30 seconds** while app is open
5. **Works only on mobile** (Capacitor), not web browser

---

## 📚 Summary

**What we built:**
- Automatic version checking system
- No user intervention required
- Seamless updates for beta testers

**How to use it:**
1. Make changes
2. Update `buildNumber` in `version.json`
3. Push to GitHub
4. Mobile apps auto-update within 30 seconds

**One-time setup:**
- Rebuild APK with VersionChecker
- Distribute to beta testers once
- All future updates are automatic!

---

**This is the solution for hassle-free beta testing and deployment!** 🎉
