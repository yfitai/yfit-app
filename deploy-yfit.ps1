# YFIT Automated Deployment Script
# This script handles everything: version increment, build, commit, push

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("patch", "minor", "major")]
    [string]$VersionType = "patch"
)

Write-Host "`n🚀 YFIT Automated Deployment`n" -ForegroundColor Cyan

# 1. Read current version
Write-Host "📖 Reading current version..." -ForegroundColor Yellow
$versionFile = "public/version.json"
$versionContent = Get-Content $versionFile -Raw | ConvertFrom-Json

$currentVersion = $versionContent.version
$currentBuild = $versionContent.buildNumber

Write-Host "   Current: v$currentVersion (Build $currentBuild)" -ForegroundColor Gray

# 2. Increment version
Write-Host "`n🔢 Incrementing version..." -ForegroundColor Yellow

$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

switch ($VersionType) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
$newBuild = $currentBuild + 1
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

Write-Host "   New: v$newVersion (Build $newBuild)" -ForegroundColor Green

# 3. Update version.json
Write-Host "`n💾 Updating version.json..." -ForegroundColor Yellow

$newVersionContent = @{
    version = $newVersion
    timestamp = $timestamp
    buildNumber = $newBuild
} | ConvertTo-Json

$newVersionContent | Set-Content $versionFile -Encoding UTF8

Write-Host "   ✅ version.json updated" -ForegroundColor Green

# 4. Update changelog
Write-Host "`n📝 Updating changelog..." -ForegroundColor Yellow

$changelogFile = "CHANGELOG.md"
$dateStr = Get-Date -Format "yyyy-MM-dd HH:mm"
$changelogEntry = "`n## [$newVersion] - Build $newBuild - $dateStr`n`n**Changes:**`n- $Message`n`n---`n"

if (Test-Path $changelogFile) {
    $existingChangelog = Get-Content $changelogFile -Raw
    $headerText = "# YFIT Deployment Changelog`n`nAll deployments are tracked here automatically.`n"
    if ($existingChangelog -match "^# YFIT") {
        $pattern = "^(# YFIT[^\n]*\n[^\n]*\n[^\n]*\n)"
        $existingChangelog = $existingChangelog -replace $pattern, "`$1$changelogEntry"
    } else {
        $existingChangelog = $headerText + $changelogEntry + $existingChangelog
    }
    $existingChangelog | Set-Content $changelogFile -Encoding UTF8
} else {
    $headerText = "# YFIT Deployment Changelog`n`nAll deployments are tracked here automatically.`n"
    ($headerText + $changelogEntry) | Set-Content $changelogFile -Encoding UTF8
}

Write-Host "   ✅ CHANGELOG.md updated" -ForegroundColor Green

# 5. Build
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Build successful" -ForegroundColor Green

# 6. Git commit and push
Write-Host "`n📤 Committing and pushing to GitHub..." -ForegroundColor Yellow

git add .
git commit -m "v$newVersion (Build $newBuild): $Message"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

# 7. Summary
Write-Host "`n✨ Deployment Complete! ✨`n" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Version:    v$newVersion" -ForegroundColor White
Write-Host "Build:      $newBuild" -ForegroundColor White
Write-Host "Message:    $Message" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n⏱️  Timeline:" -ForegroundColor Yellow
Write-Host "   • Vercel deployment: 2-3 minutes" -ForegroundColor Gray
Write-Host "   • Desktop updates: Immediately" -ForegroundColor Gray
Write-Host "   • Android updates: Within 30 seconds" -ForegroundColor Gray
Write-Host "`n🔗 Check deployment:" -ForegroundColor Yellow
Write-Host "   • Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   • Live site: https://yfit-deploy.vercel.app" -ForegroundColor Gray
Write-Host "`n✅ Beta testers will receive this update automatically!`n" -ForegroundColor Green
