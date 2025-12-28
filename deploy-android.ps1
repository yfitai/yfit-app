# YFIT Android Deployment Script
# Builds and installs Android app on connected device

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YFIT Android Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if phone is connected
Write-Host "Checking for connected device..." -ForegroundColor Yellow
$adbPath = "C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$devices = & $adbPath devices
if ($devices -match "device$") {
    Write-Host "✓ Device connected" -ForegroundColor Green
} else {
    Write-Host "✗ No device connected!" -ForegroundColor Red
    Write-Host "Please connect your phone via USB and enable USB debugging" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1/4: Building web assets..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Step 2/4: Syncing to Android..." -ForegroundColor Yellow
npx cap sync android

Write-Host ""
Write-Host "Step 3/4: Building APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug
Set-Location ..

Write-Host ""
Write-Host "Step 4/4: Installing on device..." -ForegroundColor Yellow
& $adbPath install -r android\app\build\outputs\apk\debug\app-debug.apk

Write-Host ""
Write-Host "✓ Android app deployed!" -ForegroundColor Green
Write-Host "Open YFIT on your phone to test" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
