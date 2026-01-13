# YFIT Automated Deployment Script
# This script handles everything: version increment, build, commit, push

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("patch", "minor", "major")]
    [string]$VersionType = "patch"
)

Write-Host ""
Write-Host "🚀 YFIT Automated Deployment" -ForegroundColor Cyan
Write-Host ""

# 1. Read current version
Write-Host "📖 Reading current version..." -ForegroundColor Yellow
$versionFile = "public/version.json"
$versionContent = Get-Content $versionFile -Raw | ConvertFrom-Json

$currentVersion = $versionContent.version
$currentBuild = $versionContent.buildNumber

Write-Host "   Current: v$currentVersion (Build $currentBuild)" -ForegroundColor Gray

# 2. Increment version
Write-Host ""
Write-Host "🔢 Incrementing version..." -ForegroundColor Yellow

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
Write-Host ""
Write-Host "💾 Updating version.json..." -ForegroundColor Yellow

$newVersionContent = @{
    version = $newVersion
    timestamp = $timestamp
    buildNumber = $newBuild
} | ConvertTo-Json

$newVersionContent | Set-Content $versionFile -Encoding UTF8

Write-Host "   ✅ version.json updated" -ForegroundColor Green

# 4. Update changelog
Write-Host ""
Write-Host "📝 Updating changelog..." -ForegroundColor Yellow

$changelogFile = "CHANGELOG.md"
$dateStr = Get-Date -Format "yyyy-MM-dd HH:mm"

# Build changelog entry line by line
$entryLines = @()
$entryLines += ""
$entryLines += "## [$newVersion] - Build $newBuild - $dateStr"
$entryLines += ""
$entryLines += "**Changes:**"
$entryLines += "- $Message"
$entryLines += ""
$entryLines += "---"
$entryLines += ""

$changelogEntry = $entryLines -join "`n"

if (Test-Path $changelogFile) {
    $existingLines = Get-Content $changelogFile
    # Find where to insert (after the header)
    $insertIndex = 3 # After "# YFIT Deployment Changelog" and blank lines
    
    # Combine: header + new entry + rest
    $newLines = $existingLines[0..($insertIndex-1)] + $entryLines + $existingLines[$insertIndex..($existingLines.Length-1)]
    $newLines | Set-Content $changelogFile -Encoding UTF8
} else {
    $headerLines = @()
    $headerLines += "# YFIT Deployment Changelog"
    $headerLines += ""
    $headerLines += "All deployments are tracked here automatically."
    $headerLines += ""
    
    $allLines = $headerLines + $entryLines
    $allLines | Set-Content $changelogFile -Encoding UTF8
}

Write-Host "   ✅ CHANGELOG.md updated" -ForegroundColor Green

# 5. Build
Write-Host ""
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Build successful" -ForegroundColor Green

# 6. Git commit and push
Write-Host ""
Write-Host "📤 Committing and pushing to GitHub..." -ForegroundColor Yellow

git add .
git commit -m "v$newVersion (Build $newBuild): $Message"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green

# 7. Summary
Write-Host ""
Write-Host "✨ Deployment Complete! ✨" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Version:    v$newVersion" -ForegroundColor White
Write-Host "Build:      $newBuild" -ForegroundColor White
Write-Host "Message:    $Message" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "⏱️  Timeline:" -ForegroundColor Yellow
Write-Host "   • Vercel deployment: 2-3 minutes" -ForegroundColor Gray
Write-Host "   • Desktop updates: Immediately" -ForegroundColor Gray
Write-Host "   • Android updates: Within 30 seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Check deployment:" -ForegroundColor Yellow
Write-Host "   • Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   • Live site: https://yfit-deploy.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Beta testers will receive this update automatically!" -ForegroundColor Green
Write-Host ""
