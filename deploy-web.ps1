# YFIT Web Deployment Script
# Deploys changes to Vercel (web app)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YFIT Web Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for uncommitted changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Found changes to commit:" -ForegroundColor Green
    git status --short
    Write-Host ""
    
    # Prompt for commit message
    $commitMsg = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git add .
    git commit -m $commitMsg
    
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push
    
    Write-Host ""
    Write-Host "✓ Deployed to web!" -ForegroundColor Green
    Write-Host "Vercel will automatically build and deploy in 1-2 minutes" -ForegroundColor Cyan
    Write-Host "Check status at: https://vercel.com/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "No changes to deploy" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
