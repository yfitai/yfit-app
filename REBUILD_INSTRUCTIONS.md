# Android APK Rebuild Instructions

## What Was Fixed

The white screen issue has been resolved by adding the necessary network permissions and security configuration to the Android app. The following changes were made:

### 1. **AndroidManifest.xml** - Added Network Permissions
- `INTERNET` permission - allows the app to connect to Supabase
- `ACCESS_NETWORK_STATE` permission - allows the app to check network connectivity
- Network security configuration reference

### 2. **network_security_config.xml** - Created Security Configuration
- Configured secure HTTPS connections to Supabase and Vercel domains
- Ensures the app can communicate with your backend services

These changes have been committed and pushed to your GitHub repository.

---

## Steps to Rebuild and Install the Fixed APK

### Step 1: Pull the Latest Changes
1. Open **Git Bash** (or Command Prompt) on your Windows PC
2. Navigate to your project folder:
   ```bash
   cd C:\Users\campb\Projects\yfit-app
   ```
3. Pull the latest changes from GitHub:
   ```bash
   git pull origin main
   ```
4. You should see the updated files being downloaded

### Step 2: Open Project in Android Studio
1. Open **Android Studio**
2. If the project is already open, you may see a notification about external changes - click **"Sync Now"** or **"Load"**
3. If not already open, go to **File → Open** and select: `C:\Users\campb\Projects\yfit-app\android`
4. Wait for Gradle sync to complete (progress bar at bottom)

### Step 3: Build the New APK
1. In Android Studio menu, click: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete (you'll see a notification in the bottom-right corner)
3. When complete, click **"locate"** in the notification, or navigate to:
   ```
   C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk
   ```

### Step 4: Transfer APK to Your Samsung S25
1. Connect your Samsung S25 to your PC via USB cable
2. On your phone, swipe down and tap the USB notification
3. Select **"File Transfer"** or **"Transfer files"**
4. On your PC, open **File Explorer**
5. Navigate to your phone's storage (should appear as a device)
6. Copy the new `app-debug.apk` file to your phone's **Downloads** folder

### Step 5: Install the Updated APK
1. On your Samsung S25, open the **My Files** app
2. Navigate to **Downloads**
3. Tap on **app-debug.apk**
4. The system will recognize it as an update to the existing app
5. Tap **"Install"** or **"Update"**
6. Wait for installation to complete
7. Tap **"Open"** to launch the app

---

## What to Expect After Installation

✅ **The app should now launch properly** (no more white screen)
✅ **You should see the YFIT login/signup screen** or home screen if you're already logged in
✅ **The app can now connect to Supabase** for authentication and data sync
✅ **Camera scanner should work** for barcode scanning
✅ **Google Fit integration** should be available on the Daily Tracker page

---

## Testing Checklist

After installing the updated app, please test:

- [ ] App launches successfully (no white screen)
- [ ] Login/signup works
- [ ] Navigation between pages works
- [ ] Camera scanner opens and works
- [ ] Daily Tracker page loads
- [ ] Google Fit sync option appears (if you have Google Fit installed)
- [ ] Data syncs with your account

---

## Troubleshooting

**If you still see a white screen:**
1. Completely uninstall the old app first
2. Restart your phone
3. Install the new APK fresh
4. Check that you have internet connection

**If the build fails in Android Studio:**
1. Try **Build → Clean Project**
2. Then **Build → Rebuild Project**
3. Then try building the APK again

**If you get a "Parse Error" when installing:**
- Make sure you're installing the newly built APK, not the old one
- Check that the file transferred completely to your phone

---

## Next Steps After Successful Installation

Once the app is working:
1. Test the Google Fit integration on the Daily Tracker page
2. Try scanning a food barcode with the camera
3. Check if your workout data syncs properly
4. Report any issues you encounter

Let me know once you've tested the updated app!
