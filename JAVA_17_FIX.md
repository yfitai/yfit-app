# Fix Java Version Issue - Configure Android Studio to Use Java 17

## The Problem
Android Gradle plugin requires Java 17, but your system is using Java 11.

## The Solution
Configure Android Studio to use its embedded Java 17 JDK.

---

## Step-by-Step Instructions

### Method 1: Using Settings Search (Fastest)

1. Open Android Studio
2. Click **File → Settings** (or press `Ctrl + Alt + S`)
3. In the **search box** at the top left of Settings window, type: `Gradle JDK`
4. The search should highlight the **Gradle JDK** setting
5. Click on the **Gradle JDK** dropdown menu
6. Select one of these options (in order of preference):
   - ✅ **"jbr-17"** (JetBrains Runtime 17)
   - ✅ **"Embedded JDK"** (if it shows version 17)
   - ✅ **"Android Studio default JDK"**
   - ✅ Any option showing **version 17** or higher
7. Click **Apply**
8. Click **OK**
9. If prompted to sync, click **Sync Now**

---

### Method 2: Using Settings Navigation

1. Open **File → Settings**
2. In the left sidebar, navigate to:
   - **Build, Execution, Deployment**
   - → **Build Tools**
   - → **Gradle**
3. On the right side, find **"Gradle JDK"** dropdown
4. Select a Java 17 option (see list above)
5. Click **Apply** then **OK**

---

## After Changing the JDK

### Step 1: Sync Project
- Android Studio might automatically sync
- Or click the **elephant icon** (Gradle sync) in the toolbar
- Wait for sync to complete

### Step 2: Rebuild
In the Terminal (at `C:\Users\campb\Projects\yfit-app\android`), run:

```bash
.\gradlew assembleDebug
```

You should now see the build proceed without the Java version error!

---

## Expected Build Output

After fixing Java version, you should see:
```
> Task :app:preBuild
> Task :app:preDebugBuild
> Task :capacitor-android:preBuild
> Task :capacitor-android:preDebugBuild
...
BUILD SUCCESSFUL in Xm Ys
```

---

## If You Don't See Java 17 Options

If the dropdown doesn't show any Java 17 options:

### Option A: Download Embedded JDK
1. Go to **File → Project Structure**
2. Under **SDK Location**, note the **JDK location**
3. If it's Java 11, Android Studio should offer to download Java 17
4. Click **Download JDK**
5. Select version **17**
6. Click **Download**

### Option B: Download Java 17 Manually
1. Go to: https://adoptium.net/temurin/releases/
2. Download **Java 17 (LTS)** for Windows x64
3. Install it
4. Check "Set JAVA_HOME" during installation
5. Restart Android Studio
6. The new Java 17 should appear in the Gradle JDK dropdown

---

## Verification

After changing to Java 17 and running the build:
- ✅ No more "requires Java 17" error
- ✅ Build proceeds through compilation tasks
- ✅ Eventually shows "BUILD SUCCESSFUL"
- ✅ APK created at: `android/app/build/outputs/apk/debug/app-debug.apk`
