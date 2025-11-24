# Install Java 17 - Complete Guide

## Why You Need This
Android Gradle plugin requires Java 17 or higher. Your system currently has Java 11, which is too old.

---

## Step-by-Step Installation

### Step 1: Download Java 17

1. **Go to:** https://adoptium.net/temurin/releases/?version=17

2. **Select:**
   - Version: **17 - LTS**
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
   - File Type: **.msi** (installer)

3. **Click the download button** (usually a blue button or link)

4. **Save the file** (it will be named something like `OpenJDK17U-jdk_x64_windows_hotspot_17.x.x_x.msi`)

---

### Step 2: Run the Installer

1. **Locate the downloaded .msi file** (probably in your Downloads folder)

2. **Double-click to run it**

3. **Click "Next"** on the welcome screen

4. **IMPORTANT - Check these boxes:**
   - ✅ **Set JAVA_HOME variable**
   - ✅ **Add to PATH**
   - ✅ **JavaSoft (Oracle) registry keys** (if shown)

5. **Choose installation location** (default is fine: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot\`)

6. **Click "Install"**

7. **Wait for installation to complete**

8. **Click "Finish"**

---

### Step 3: Verify Installation

1. **Open a NEW PowerShell window** (important - must be new to pick up new environment variables)

2. **Run this command:**
   ```bash
   java -version
   ```

3. **You should see something like:**
   ```
   openjdk version "17.0.x" 2024-xx-xx
   OpenJDK Runtime Environment Temurin-17.0.x+x (build 17.0.x+x)
   OpenJDK 64-Bit Server VM Temurin-17.0.x+x (build 17.0.x+x, mixed mode, sharing)
   ```

4. **Check JAVA_HOME:**
   ```bash
   echo $env:JAVA_HOME
   ```
   
   Should show: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot`

---

### Step 4: Restart Android Studio

1. **Close Android Studio completely** (File → Exit, or click the X)

2. **Wait a few seconds**

3. **Reopen Android Studio**

4. **Let the project load and sync**

---

### Step 5: Build Your APK

1. **Open Terminal in Android Studio** (bottom tab)

2. **Navigate to android folder:**
   ```bash
   cd C:\Users\campb\Projects\yfit-app\android
   ```

3. **Run the build:**
   ```bash
   .\gradlew assembleDebug
   ```

4. **You should see:**
   - No more "requires Java 17" error
   - Build tasks running
   - Eventually: `BUILD SUCCESSFUL`

---

## Troubleshooting

### "java -version" still shows Java 11

**Solution:**
1. Close ALL PowerShell/Terminal windows
2. Open a NEW PowerShell window
3. Try again

If still showing Java 11:
1. Search Windows for "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "System variables", find "JAVA_HOME"
5. Make sure it points to Java 17 (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17...`)
6. Under "System variables", find "Path"
7. Make sure Java 17's bin folder is ABOVE Java 11's bin folder in the list
8. Click OK on all windows
9. Restart computer if needed

### Build still fails with Java 11 error

**Solution:**
1. Make sure you restarted Android Studio AFTER installing Java 17
2. In Android Studio Terminal, verify Java version: `java -version`
3. If still wrong, close Android Studio completely and reopen
4. Try: `.\gradlew --stop` then `.\gradlew assembleDebug`

---

## After Successful Build

The APK will be located at:
```
C:\Users\campb\Projects\yfit-app\android\app\build\outputs\apk\debug\app-debug.apk
```

You can then:
1. Copy this file to your Samsung S25
2. Install it
3. Test the app!
