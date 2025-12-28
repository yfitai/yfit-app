# YFIT Android Rebuild Script
# This script syncs web code to Android and rebuilds the APK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YFIT Android Rebuild Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Sync web code to Android
Write-Host "[1/3] Syncing web code to Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to sync to Android" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sync complete" -ForegroundColor Green
Write-Host ""

# Step 2: Build the Android app
Write-Host "[2/3] Building Android APK..." -ForegroundColor Yellow
cd android
./gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build APK" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..
Write-Host "✓ Build complete" -ForegroundColor Green
Write-Host ""

# Step 3: Install on phone
Write-Host "[3/3] Installing on phone..." -ForegroundColor Yellow
Write-Host "Make sure your phone is connected via USB with USB debugging enabled" -ForegroundColor Cyan
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install APK" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  - Phone is connected via USB" -ForegroundColor Yellow
    Write-Host "  - USB debugging is enabled" -ForegroundColor Yellow
    Write-Host "  - ADB drivers are installed" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Installation complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Android app rebuilt successfully!" -ForegroundColor Green
Write-Host "You can now test the app on your phone" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
