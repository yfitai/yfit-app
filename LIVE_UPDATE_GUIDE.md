# YFIT LiveUpdate System Guide

## 🎯 Overview

The YFIT app now uses **Capawesome LiveUpdate** to deliver automatic Over-the-Air (OTA) updates without requiring users to download new versions from Google Play.

### ✅ What This Solves

- **Barcode scanner works** (local loading, no remote URL issues)
- **Camera/progress photos work** (local loading)
- **Automatic updates** (no APK rebuild needed for web changes)
- **Silent background updates** (happens automatically on app launch)

---

## 🔧 How It Works

1. **App loads from local files** bundled in the APK
2. **On app launch**, LiveUpdate checks for new bundles at `https://yfit-deploy.vercel.app/updates/bundle.zip`
3. **If update found**, downloads and queues it for next app restart
4. **User restarts app**, update is applied automatically
5. **No user interaction needed** - completely silent

---

## 📦 Deployment Workflow

### For Web Changes (HTML/CSS/JS)

1. Make your changes to the React code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **That's it!** Vercel auto-deploys and creates the update bundle
4. Users get the update on next app launch (within 24 hours)

### For Native Changes (Capacitor plugins, permissions, etc.)

If you change:
- Capacitor plugins
- Android permissions
- Native code
- App icons/splash screens

You MUST rebuild and redistribute the APK:

```bash
# 1. Update version in android/app/build.gradle
# 2. Build APK
cd android && ./gradlew assembleRelease

# 3. Upload to Google Play Console
```

---

## 🛠️ Manual Update Bundle Creation

If you need to manually create an update bundle:

```bash
./scripts/create-update-bundle.sh
```

This will:
1. Build the app (`npm run build`)
2. Create `public/updates/bundle.zip` from the `dist` folder
3. Commit and push to deploy to Vercel

---

## 📱 Testing Updates

### Test on Your Device

1. Install the APK with LiveUpdate integrated (version 1.0.19+)
2. Open the app (it checks for updates on launch)
3. Check console logs in Chrome DevTools:
   ```
   LiveUpdate: Checking for updates...
   LiveUpdate: Update downloaded! Will apply on next app restart.
   ```
4. Force close and reopen the app
5. Update is applied!

### Check Current Version

The app logs the current bundle version on startup. Look for:
```
LiveUpdate: Current bundle: { bundleId: "production", ... }
```

---

## 🔍 Troubleshooting

### Updates Not Downloading

1. Check that `public/updates/bundle.zip` exists in the repo
2. Verify Vercel deployed successfully
3. Check the bundle is accessible at: https://yfit-deploy.vercel.app/updates/bundle.zip
4. Look for errors in Chrome DevTools console

### Barcode Scanner Still Broken

1. Verify `capacitor.config.json` does NOT have `server.url` set
2. Rebuild the APK and reinstall
3. The app MUST load from local files, not remote URL

### App Crashes After Update

1. LiveUpdate has automatic rollback protection
2. If the app crashes 3 times, it automatically reverts to the bundled version
3. Check console for rollback messages

---

## 📊 Update Bundle Size

Current bundle size: ~3.5 MB (zipped)

To reduce bundle size:
- Use code splitting (`import()`)
- Optimize images
- Remove unused dependencies

---

## 🚀 Next Steps

1. **Build new APK** with LiveUpdate integrated (version 1.0.19)
2. **Upload to Google Play Console** for beta testing
3. **Test barcode scanner** - should work immediately!
4. **Make a small web change** and verify OTA update works
5. **Monitor update adoption** via console logs

---

## 📝 Important Notes

- **First install** requires APK distribution (Google Play)
- **Web updates** are automatic and silent
- **Native updates** still require new APK
- **Bundle ID** is set to "production" (can be changed for staging/dev)
- **Update check** happens on every app launch
- **Download** happens in background (doesn't block app)
- **Apply** happens on next app restart

---

## 🔗 Resources

- [Capawesome LiveUpdate Docs](https://capawesome.io/plugins/live-update/)
- [LiveUpdate Service Code](/src/services/liveUpdate.js)
- [Bundle Creation Script](/scripts/create-update-bundle.sh)
