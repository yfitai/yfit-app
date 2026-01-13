# YFIT Automated Deployment Script
# Simply run this script to push to GitHub and trigger automatic deployment

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  YFIT Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from your YFIT project directory" -ForegroundColor Yellow
    exit 1
}

# Check for uncommitted changes
Write-Host "📋 Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host ""
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    Write-Host ""
    $forcePush = Read-Host "Do you want to push anyway? (y/n)"
    
    if ($forcePush -ne "y" -and $forcePush -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "✅ Changes detected" -ForegroundColor Green
    Write-Host ""
    
    # Show what will be committed
    Write-Host "Files to be committed:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
}

# Get commit message
Write-Host "📝 Enter commit message (or press Enter for default):" -ForegroundColor Yellow
$commitMessage = Read-Host

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Plan" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commit message: $commitMessage" -ForegroundColor White
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. ✅ Stage all changes" -ForegroundColor White
Write-Host "  2. ✅ Commit with your message" -ForegroundColor White
Write-Host "  3. ✅ Push to GitHub (main branch)" -ForegroundColor White
Write-Host "  4. ✅ Trigger Vercel deployment (automatic)" -ForegroundColor White
Write-Host "  5. ✅ Build Android APK (automatic via GitHub Actions)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host ""
    Write-Host "Cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stage changes
Write-Host "📦 Staging changes..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to stage changes" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes staged" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

$commitResult = $LASTEXITCODE

if ($commitResult -ne 0) {
    # Check if it's because there's nothing to commit
    if ($commitResult -eq 1) {
        Write-Host "ℹ️  Nothing to commit (already up to date)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Check your internet connection" -ForegroundColor White
    Write-Host "  • Verify GitHub credentials" -ForegroundColor White
    Write-Host "  • Make sure you have push access to the repository" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor White
    exit 1
}

Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 Deployment Initiated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "What happens next (automatically):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ GitHub Actions will run tests and build" -ForegroundColor White
Write-Host "2. ✅ Vercel will detect the push and deploy" -ForegroundColor White
Write-Host "3. ✅ Android APK will be built" -ForegroundColor White
Write-Host ""
Write-Host "Track progress:" -ForegroundColor Yellow
Write-Host "  • GitHub Actions: https://github.com/yfitai/yfit-app/actions" -ForegroundColor Cyan
Write-Host "  • Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "Download APK:" -ForegroundColor Yellow
Write-Host "  • Go to GitHub Actions → Latest workflow → Artifacts" -ForegroundColor White
Write-Host "  • Download 'yfit-app-debug.zip'" -ForegroundColor White
Write-Host ""
Write-Host "Estimated time:" -ForegroundColor Yellow
Write-Host "  • Vercel deployment: 2-3 minutes" -ForegroundColor White
Write-Host "  • Android APK build: 5-10 minutes" -ForegroundColor White
Write-Host ""

# Open GitHub Actions in browser (optional)
Write-Host "Would you like to open GitHub Actions in your browser? (y/n)" -ForegroundColor Yellow
$openBrowser = Read-Host

if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "https://github.com/yfitai/yfit-app/actions"
    Write-Host "✅ Opening GitHub Actions..." -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! 🚀" -ForegroundColor Green
Write-Host ""
