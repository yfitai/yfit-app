# Quick Android APK Build Guide

## Method 1: Using the Hammer Icon (Easiest)

1. Look at the **top-right** of Android Studio
2. Find the **hammer icon** (🔨) next to the green play button
3. Click the **hammer icon** to build
4. Wait for build to complete
5. The APK will be at: `C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk`

---

## Method 2: Using Build Menu

1. Click **Build** in the top menu
2. Click **Generate App Bundles or APK**
3. Click **Generate APK**
4. Select **APK** (should already be selected)
5. Click **Next**

### On the Keystore Screen:

**Option A - Use Debug Keystore (Recommended for Testing):**
- Look for "debug" option or checkbox
- Select it and click "Finish"

**Option B - Use Your Keystore:**
- Click "Choose existing..."
- Browse to: `C:\Users\campb\Projects\yfit-app\yfit-keystore.jks`
- Enter password: `yfit2024`
- Enter alias: `yfit-key`
- Enter alias password: `yfit2024`
- Click "Next" then "Finish"

---

## Method 3: Using Gradle Command Line (Advanced)

1. Open Terminal/PowerShell in Android Studio (bottom tab)
2. Run:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
3. Wait for build to complete
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## After Build Completes

You'll see a notification in the bottom-right corner:
- "APK(s) generated successfully"
- Click **"locate"** to open the folder
- Or manually navigate to: `C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\`
- Find **app-debug.apk**

---

## Troubleshooting

**If build fails with "CreateProcess error=2":**
- Try Method 1 (hammer icon) instead
- Or use Method 3 (Gradle command line)

**If you can't find the APK:**
- Check: `C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk`
- Make sure the build actually completed successfully

**If Gradle sync fails:**
- File → Invalidate Caches → Invalidate and Restart
- Wait for restart and try again
