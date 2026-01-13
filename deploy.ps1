# YFIT Deployment Script for Windows PowerShell
# Run this script to test and deploy your app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  YFIT Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    $allGood = $false
}

if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found" -ForegroundColor Red
    $allGood = $false
}

if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Git not found. Please install from https://git-scm.com" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

if (-not $allGood) {
    Write-Host "Please install missing prerequisites and run this script again." -ForegroundColor Red
    exit 1
}

# Main menu
function Show-Menu {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  What would you like to do?" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Install dependencies (npm install)" -ForegroundColor White
    Write-Host "2. Test build locally (npm run build)" -ForegroundColor White
    Write-Host "3. Start development server (npm run dev)" -ForegroundColor White
    Write-Host "4. Commit and push to GitHub" -ForegroundColor White
    Write-Host "5. Deploy to Vercel (requires Vercel CLI)" -ForegroundColor White
    Write-Host "6. Build Android APK (requires Capacitor)" -ForegroundColor White
    Write-Host "7. Run all steps (1-4)" -ForegroundColor White
    Write-Host "8. Exit" -ForegroundColor White
    Write-Host ""
}

function Install-Dependencies {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Installing Dependencies" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    }
}

function Test-Build {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Testing Build" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Build successful!" -ForegroundColor Green
        Write-Host "Your app is ready for deployment." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Build failed. Please check the errors above." -ForegroundColor Red
    }
}

function Start-DevServer {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Starting Development Server" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The server will start at http://localhost:5173/" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    npm run dev
}

function Push-ToGitHub {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Push to GitHub" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check git status
    Write-Host "Checking git status..." -ForegroundColor Yellow
    git status
    
    Write-Host ""
    $confirm = Read-Host "Do you want to commit and push all changes? (y/n)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host ""
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Remove demo mode functionality - production ready"
        }
        
        Write-Host ""
        Write-Host "Staging changes..." -ForegroundColor Yellow
        git add .
        
        Write-Host "Committing changes..." -ForegroundColor Yellow
        git commit -m $commitMessage
        
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ Failed to push. You may need to set up remote or authenticate." -ForegroundColor Red
            Write-Host ""
            Write-Host "Try these commands manually:" -ForegroundColor Yellow
            Write-Host "  git remote add origin https://github.com/YourUsername/yfit.git" -ForegroundColor White
            Write-Host "  git push origin main" -ForegroundColor White
        }
    } else {
        Write-Host "Push cancelled." -ForegroundColor Yellow
    }
}

function Deploy-ToVercel {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Deploy to Vercel" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Command "vercel") {
        Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
        Write-Host ""
        
        $deployType = Read-Host "Deploy to (1) Preview or (2) Production? Enter 1 or 2"
        
        if ($deployType -eq "2") {
            vercel --prod
        } else {
            vercel
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Deployed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "✗ Deployment failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Vercel CLI not found." -ForegroundColor Red
        Write-Host ""
        Write-Host "Install it with:" -ForegroundColor Yellow
        Write-Host "  npm install -g vercel" -ForegroundColor White
        Write-Host ""
        Write-Host "Then run:" -ForegroundColor Yellow
        Write-Host "  vercel login" -ForegroundColor White
        Write-Host "  vercel" -ForegroundColor White
    }
}

function Build-AndroidAPK {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Build Android APK" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Command "npx") {
        Write-Host "Step 1: Building web assets..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Step 2: Syncing with Capacitor..." -ForegroundColor Yellow
            npx cap sync android
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Step 3: Opening Android Studio..." -ForegroundColor Yellow
                npx cap open android
                
                Write-Host ""
                Write-Host "✓ Android Studio should open now." -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps in Android Studio:" -ForegroundColor Yellow
                Write-Host "1. Wait for Gradle sync to complete" -ForegroundColor White
                Write-Host "2. Click Build → Build Bundle(s) / APK(s) → Build APK(s)" -ForegroundColor White
                Write-Host "3. Wait for build to complete" -ForegroundColor White
                Write-Host "4. Click 'locate' to find your APK" -ForegroundColor White
            } else {
                Write-Host ""
                Write-Host "✗ Capacitor sync failed" -ForegroundColor Red
            }
        } else {
            Write-Host ""
            Write-Host "✗ Build failed" -ForegroundColor Red
        }
    } else {
        Write-Host "npx not found. Please ensure Node.js is properly installed." -ForegroundColor Red
    }
}

function Run-AllSteps {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Running All Steps" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Install-Dependencies
    Start-Sleep -Seconds 2
    
    Test-Build
    Start-Sleep -Seconds 2
    
    Push-ToGitHub
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  All steps completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Deploy to Vercel or build Android APK" -ForegroundColor Yellow
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-8)"
    
    switch ($choice) {
        "1" { Install-Dependencies }
        "2" { Test-Build }
        "3" { Start-DevServer }
        "4" { Push-ToGitHub }
        "5" { Deploy-ToVercel }
        "6" { Build-AndroidAPK }
        "7" { Run-AllSteps }
        "8" { 
            Write-Host ""
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host ""
            Write-Host "Invalid choice. Please enter 1-8." -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} while ($true)
