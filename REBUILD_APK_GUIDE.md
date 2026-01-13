# APK Rebuild Guide - Cache-Busting Update

**Date:** January 13, 2026  
**Reason:** Added cache-busting to fix Android WebView caching issues

---

## 🎯 What Changed

We added cache-busting configuration so Android **always** fetches the latest version from Vercel. This fixes the issue where desktop updates but Android shows old cached content.

**This is a ONE-TIME rebuild.** After this, all future updates will auto-deploy without rebuilding!

---

## 📱 Simple Rebuild Instructions (PowerShell)

### **Prerequisites:**
- Android phone connected via USB
- USB debugging enabled on phone
- Android Studio installed (or Android SDK tools)

---

### **Option 1: Simple Commands (Recommended)**

Open PowerShell in your project directory and run these commands **one at a time**:

```powershell
# 1. Navigate to project
cd C:\path\to\yfit

# 2. Build web assets
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Build and install APK directly to phone
npx cap run android
```

**That's it!** The app will build and install automatically.

---

### **Option 2: Using Android Studio**

If the simple commands don't work:

```powershell
# 1. Navigate to project
cd C:\path\to\yfit

# 2. Build web assets
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. Click **locate** in the notification
5. Install the APK on your phone

---

## 🔧 What the Cache-Busting Does

### **Before (Problem):**
```
Desktop: Updates immediately ✅
Android: Shows cached old version ❌
```

### **After (Fixed):**
```
Desktop: Updates immediately ✅
Android: Updates immediately ✅
```

### **Technical Details:**

**capacitor.config.json:**
- Added proper server configuration
- Configured HTTPS scheme
- Set hostname and navigation rules

**MainActivity.java:**
- Disables WebView caching completely
- Clears cache on every app launch
- Forces fresh content fetch from Vercel

---

## ✅ After Rebuilding

Once you install the new APK:

1. ✅ **All future code changes** auto-deploy
2. ✅ **Just push to GitHub** → Vercel deploys
3. ✅ **Android updates** when users reopen app
4. ✅ **No more APK rebuilds** needed (unless native code changes)

---

## 🧪 Test the Fix

After installing the new APK:

1. **Check current date format:**
   - Open YFIT app
   - Go to Nutrition page
   - Should show: "Mon, Jan 13, 2026" (or current date)

2. **Test auto-update:**
   - I'll make a small visible change (like button color)
   - Push to GitHub
   - Wait 2-3 minutes
   - Close and reopen app
   - Should see the change immediately!

---

## 🚨 Troubleshooting

### **"npx cap run android" fails:**

Try:
```powershell
# Check if device is connected
adb devices

# If no devices, enable USB debugging on phone

# Try again
npx cap run android
```

### **Build fails in Android Studio:**

1. **Tools** → **SDK Manager**
2. Verify Android SDK is installed
3. **File** → **Invalidate Caches / Restart**
4. Try building again

### **APK installs but app crashes:**

```powershell
# Check logs
adb logcat | grep -i "yfitai"

# Or reinstall
adb uninstall com.yfitai.app
npx cap run android
```

---

## 📊 What to Expect

### **Build Time:**
- Web build: ~15-20 seconds
- Android sync: ~5-10 seconds
- APK build: ~2-5 minutes
- **Total: ~3-6 minutes**

### **File Size:**
- APK: ~50-70 MB (similar to before)

### **After Installation:**
- App opens normally
- All data preserved (logged in)
- Date picker shows new format
- Future updates auto-deploy!

---

## 🎉 Success Criteria

After installing the new APK, you should see:

1. ✅ Date picker shows: "Mon, Jan 13, 2026" (not "2026-01-1")
2. ✅ All features work normally
3. ✅ User stays logged in
4. ✅ Data is preserved

---

## 📝 Summary

**What you need to do:**
1. Run the rebuild commands (Option 1 or 2)
2. Install the new APK on your phone
3. Test the date picker fix
4. **That's it!**

**What happens after:**
- All future updates auto-deploy
- No more APK rebuilds needed
- Android always gets latest version
- Desktop and Android stay in sync

---

## 🆘 Need Help?

If you run into issues:
1. Share the error message
2. I'll help troubleshoot
3. We'll get it working!

---

**This is the last time you'll need to rebuild the APK for regular updates!** 🎉

After this, the workflow is:
```
Push to GitHub → Wait 2-3 min → Close/reopen app → Updated!
```
