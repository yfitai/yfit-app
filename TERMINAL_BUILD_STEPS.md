# Build APK Using Terminal (Most Reliable Method)

## Current Status
You are in: `C:\Users\campb\Projects\yfit-app\android`

## Step-by-Step Instructions

### Step 1: Run the Build Command

In the Terminal window in Android Studio (or PowerShell), type exactly:

```bash
.\gradlew.bat assembleDebug
```

Press **Enter**

### Step 2: Wait for Build

You should see output like:
```
> Task :app:preBuild
> Task :app:preDebugBuild
> Task :app:compileDebugJavaWithJavac
> Task :app:mergeDebugResources
...
```

This will take 2-5 minutes. Be patient!

### Step 3: Look for Success Message

At the end, you should see:
```
BUILD SUCCESSFUL in Xm Ys
```

### Step 4: Find Your APK

The APK will be at:
```
C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## If You Get an Error

### "gradlew.bat: command not found" or similar
Try:
```bash
.\gradlew assembleDebug
```

### "Permission denied"
Try:
```bash
gradlew.bat assembleDebug
```

### "CreateProcess error=2"
This usually means a tool is missing. Try:
1. Close Android Studio
2. Open it again
3. Let it fully sync
4. Try the command again

---

## Alternative: Use File Explorer

If the terminal method doesn't work:

1. Open File Explorer
2. Navigate to: `C:\Users\campb\Projects\yfit-app\android`
3. Double-click `gradlew.bat`
4. When the command window opens, type: `assembleDebug`
5. Press Enter

---

## After Build Succeeds

1. Navigate to the APK location in File Explorer
2. Copy `app-debug.apk` to your phone
3. Install it on your Samsung S25

The APK will be at:
`C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk`
