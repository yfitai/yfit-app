# 🚀 Quick Build Commands

## Android Build

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Or build from command line
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS Build

```bash
# 1. Build web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# Then build in Xcode:
# Product → Archive → Distribute
```

## Install on Device

### Android (via ADB)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### iOS (via Xcode)
1. Connect iPhone
2. Select device as target
3. Click Run button

## Update After Code Changes

```bash
# Quick update (web changes only)
npm run build
npx cap copy

# Full update (including plugins)
npm run build
npx cap sync
```

## Clean Build (if issues)

### Android
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### iOS
```bash
cd ios
pod install
cd ..
npx cap sync ios
```

## Check Capacitor Status

```bash
npx cap doctor
```

## Common Issues

**"Command not found: npx"**
```bash
npm install -g npm
```

**"Android SDK not found"**
- Set ANDROID_HOME environment variable
- Point to Android SDK location

**"CocoaPods not found" (iOS)**
```bash
sudo gem install cocoapods
```

## Production Builds

### Android (Signed APK)
1. Generate keystore (one time):
```bash
keytool -genkey -v -keystore yfit-release-key.keystore -alias yfit -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../yfit-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'yfit'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

### iOS (App Store)
1. Open in Xcode
2. Select "Any iOS Device"
3. Product → Archive
4. Distribute → App Store Connect
5. Upload

## Useful Commands

```bash
# List connected devices
adb devices                    # Android
xcrun xctrace list devices     # iOS

# View logs
adb logcat                     # Android
npx cap open ios               # iOS (use Xcode console)

# Uninstall app
adb uninstall com.yfitai.app   # Android

# Check Capacitor plugins
npx cap ls

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync
```
