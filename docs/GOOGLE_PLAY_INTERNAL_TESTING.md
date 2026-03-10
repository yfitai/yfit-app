# YFIT AI — Google Play Internal Testing Setup Guide

**Goal:** Build the AAB file and set up Google Play internal testing to satisfy the 14-tester/14-day requirement for production access.

---

## Overview

Google Play requires you to complete an **internal testing track** before your app can be reviewed for production (public) release. The requirements are:

- At least **12 testers** (Google's documentation sometimes says 14 — aim for 14 to be safe)
- Testers must have the app **installed for at least 14 consecutive days**
- The app must be uploaded as an **Android App Bundle (.aab)** file — not an APK

This guide walks you through every step from building the AAB to sending testers their opt-in link.

---

## PART 1: Build the Android App Bundle (AAB)

### Prerequisites

Before building, make sure you have the following installed on your Windows machine:

- **Node.js** (you already have this — used for the web app)
- **Java Development Kit (JDK) 17** — required by Gradle
- **Android SDK** — the command-line tools version (no Android Studio needed)

### Step 1: Check if Java is installed

Open PowerShell and run:
```powershell
java -version
```

If you see a version number (e.g., `openjdk 17.0.x`), you're good. If not, download and install JDK 17 from:
https://adoptium.net/temurin/releases/?version=17

### Step 2: Check if your Capacitor Android project exists

In PowerShell, navigate to your YFIT project folder and run:
```powershell
cd C:\path\to\your\yfit-project
ls android
```

If the `android` folder exists, you already have Capacitor set up. If not, run:
```powershell
npx cap add android
```

### Step 3: Build the web app first

Every time you want to create a new Android build, you must first build the web app:
```powershell
npm run build
npx cap sync android
```

This copies your latest web code into the Android project.

### Step 4: Build the AAB file

Navigate into the android folder and run the Gradle build command:
```powershell
cd android
.\gradlew bundleRelease
```

This will take 2–5 minutes. When complete, your AAB file will be at:
```
android\app\build\outputs\bundle\release\app-release.aab
```

> **If you get a "keystore" error:** You need to sign the app. See Part 1B below.

### Step 4B: Create a signing keystore (first time only)

Google Play requires all apps to be signed with a keystore. Run this command in PowerShell (replace the values in brackets):

```powershell
keytool -genkey -v -keystore yfit-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yfit-key
```

You'll be prompted to enter:
- A **keystore password** (save this somewhere safe — you'll need it every build)
- Your name, organization, city, state, country
- A **key password** (can be the same as keystore password)

This creates a file called `yfit-release-key.jks`. **Back this file up immediately** — if you lose it, you cannot update your app on the Play Store.

Then add the signing config to `android/app/build.gradle`. Open that file and find the `android { ... }` block. Add this inside it:

```gradle
signingConfigs {
    release {
        storeFile file("../../yfit-release-key.jks")
        storePassword "YOUR_KEYSTORE_PASSWORD"
        keyAlias "yfit-key"
        keyPassword "YOUR_KEY_PASSWORD"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

Then re-run `.\gradlew bundleRelease`.

---

## PART 2: Set Up Google Play Console

### Step 1: Log in to Google Play Console

Go to: https://play.google.com/console

Sign in with the Google account you used when you registered as a developer. If you haven't registered yet, there is a one-time $25 USD registration fee.

### Step 2: Find your YFIT app

On the dashboard, you should see your YFIT AI app listed. Click on it to open the app management page.

If you haven't created the app yet:
1. Click **Create app**
2. App name: **YFIT AI**
3. Default language: **English (United States)**
4. App or game: **App**
5. Free or paid: **Free**
6. Accept the declarations and click **Create app**

### Step 3: Navigate to Internal Testing

In the left sidebar, go to: **Testing → Internal testing**

Click **Create new release**.

### Step 4: Upload your AAB file

1. Click **Upload** and select your `app-release.aab` file from:
   `android\app\build\outputs\bundle\release\app-release.aab`
2. Wait for the upload to complete (may take 1–3 minutes)
3. In the **Release notes** box, type something like:
   > Beta 1.0 — Initial internal testing release. Core features: nutrition tracking, AI food scanner, workout logging, medication tracker, weight predictions.
4. Click **Save** then **Review release**
5. Click **Start rollout to Internal testing**

### Step 5: Add Your Testers

1. Go to the **Testers** tab (within Internal testing)
2. Click **Create email list**
3. Name it: **YFIT Beta Testers**
4. Add the Gmail addresses of your 14+ testers (one per line)
   - These must be the exact Gmail accounts they use on their Android phones
   - You can add up to 100 addresses
5. Click **Save changes**

### Step 6: Get the Opt-In URL

After saving your tester list, you'll see a section called **How testers join your test**. There will be a link that looks like:
```
https://play.google.com/apps/internaltest/XXXXXXXXXXXXXXXX
```

Copy this link — this is what you send to your testers.

---

## PART 3: Send Testers Their Instructions

Send each tester this message (email or DM):

> **Subject: YFIT AI Beta — Your Android Access Link**
>
> Hi [Name],
>
> Thank you for agreeing to beta test YFIT AI! Here's how to get started on Android:
>
> **Step 1:** Click this link on your Android phone:
> [YOUR OPT-IN URL HERE]
>
> **Step 2:** Click **"Become a tester"** on the page that opens
>
> **Step 3:** Click the link to download the app from the Play Store
>
> **Step 4:** Install and open YFIT AI
>
> **That's it!** The app just needs to stay installed on your phone for 14 days. You're welcome to use it as much or as little as you like — any feedback through the in-app feedback button (bottom right corner) is greatly appreciated.
>
> If you have any issues, just reply to this message.
>
> Thank you!

---

## PART 4: Monitor Your Testing Progress

### Check tester count and status

In Google Play Console → **Testing → Internal testing → Testers** tab:
- You can see how many testers have opted in
- Green checkmark = they've installed the app
- You need at least 12 with green checkmarks

### Check the 14-day clock

Google starts counting the 14 days from when the **first tester installs the app**. There is no visible countdown in the console — you track this yourself. Write down the date your first tester installs and count 14 days forward.

### Apply for production access

After 14 days with 12+ active testers:
1. Go to **Testing → Internal testing**
2. You should see a banner saying you're eligible to apply for production
3. Click **Apply for production access**
4. Fill out the content rating questionnaire and store listing
5. Google will review within 3–7 days

---

## Quick Reference Checklist

- [ ] Java 17 installed (`java -version` works in PowerShell)
- [ ] `npm run build && npx cap sync android` completed
- [ ] Keystore file created and backed up (`yfit-release-key.jks`)
- [ ] `build.gradle` updated with signing config
- [ ] `.\gradlew bundleRelease` completed successfully
- [ ] AAB file found at `android\app\build\outputs\bundle\release\app-release.aab`
- [ ] AAB uploaded to Google Play Console → Internal testing
- [ ] Tester email list created with 14+ Gmail addresses
- [ ] Opt-in URL copied and sent to all testers
- [ ] First tester installs app — **note the date:** ___________
- [ ] Day 14 target date: ___________
- [ ] 12+ testers have green checkmarks in Play Console
- [ ] Applied for production access

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `gradlew` command not found | Make sure you're inside the `android` folder: `cd android` |
| Build fails with "SDK not found" | Set `ANDROID_HOME` environment variable to your Android SDK path |
| "Keystore file not found" error | Check the path in `build.gradle` — use `../../` to go up two folders from `android/app/` |
| Tester can't find the app on Play Store | They must click the opt-in URL FIRST, then go to Play Store |
| Tester says "app not compatible with device" | Their Android version may be too old — minimum Android 7.0 (API 24) required |
| Upload fails with "Version code already exists" | Increment `versionCode` in `android/app/build.gradle` by 1 |
