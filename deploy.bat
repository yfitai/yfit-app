@echo off
REM YFIT Full Deployment Script
REM Deploys to both Web (Vercel) and Android

echo ========================================
echo YFIT FULL DEPLOYMENT
echo ========================================
echo.

REM Step 1: Commit and push to GitHub (triggers Vercel)
echo [STEP 1/5] Committing to GitHub...
echo.
git add .
git commit -m "Update: %date% %time%"
git push
echo.
echo Done! Vercel will auto-deploy the web app.
echo.

REM Step 2: Build web assets
echo [STEP 2/5] Building web assets...
echo.
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

REM Step 3: Sync to Android
echo [STEP 3/5] Syncing to Android...
echo.
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Sync failed!
    pause
    exit /b 1
)
echo.

REM Step 4: Build Android APK
echo [STEP 4/5] Building Android APK...
echo.
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo ERROR: Android build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Step 5: Install on phone
echo [STEP 5/5] Installing on phone...
echo.
echo Make sure your phone is connected via USB!
echo.
C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
if errorlevel 1 (
    echo ERROR: Installation failed!
    echo Make sure:
    echo   - Phone is connected via USB
    echo   - USB debugging is enabled
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Deployment complete!
echo ========================================
echo.
echo Web: https://yfit-deploy.vercel.app
echo Android: Installed on your phone
echo.
pause
