#!/bin/bash

# YFIT Project - Task Initialization Script
# Run this script ONCE in each new Manus task to set up the project

set -e  # Exit on error

echo "================================================"
echo "🚀 YFIT Project Task Initialization"
echo "================================================"
echo ""

# GitHub configuration
GITHUB_REPO="yfitai/yfit-app"

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN environment variable not set"
    echo "   Using HTTPS without authentication (you'll need to enter credentials)"
    REPO_URL="https://github.com/${GITHUB_REPO}.git"
else
    echo "✅ GitHub token detected - using automated authentication"
    REPO_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
fi

# Step 1: Check if we're in the right directory
echo ""
echo "📂 Step 1: Checking directory..."
cd /home/ubuntu

# Step 2: Check if project already exists
if [ -d "yfit" ]; then
    echo "✅ Project directory 'yfit' already exists"
    echo "   Pulling latest changes from GitHub..."
    cd yfit
    if [ -n "$GITHUB_TOKEN" ]; then
        git remote set-url origin "$REPO_URL"
    fi
    git pull origin main
else
    echo "📥 Cloning YFIT project from GitHub..."
    git clone "$REPO_URL" yfit
    cd yfit
    echo "✅ Project cloned successfully"
fi

# Step 3: Configure Git
echo ""
echo "🔧 Step 2: Configuring Git..."
git config user.email "yfitai@example.com"
git config user.name "YFIT AI"
if [ -n "$GITHUB_TOKEN" ]; then
    git remote set-url origin "$REPO_URL"
    echo "✅ Git configured with automated authentication"
else
    echo "✅ Git configured (manual authentication required for push)"
fi

# Step 4: Check Node.js and dependencies
echo ""
echo "📦 Step 3: Checking dependencies..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        echo "   Installing Node.js dependencies (this may take a few minutes)..."
        npm install
        echo "✅ Dependencies installed"
    else
        echo "✅ Dependencies already installed"
    fi
else
    echo "⚠️  No package.json found - skipping npm install"
fi

# Step 5: Display project status
echo ""
echo "📊 Step 4: Project Status"
echo "================================================"
echo "📁 Project Path: $(pwd)"
echo "🌿 Current Branch: $(git branch --show-current)"
echo "📝 Latest Commit: $(git log -1 --oneline)"
echo "📦 Node Version: $(node --version 2>/dev/null || echo 'Not installed')"
echo "📦 NPM Version: $(npm --version 2>/dev/null || echo 'Not installed')"
echo ""

# Step 6: Create helpful aliases
echo "🔗 Step 5: Creating helpful shortcuts..."
cat > /home/ubuntu/.yfit_aliases << 'EOF'
# YFIT Project Aliases
alias yfit='cd /home/ubuntu/yfit'
alias yfit-pull='cd /home/ubuntu/yfit && git pull origin main'
alias yfit-push='cd /home/ubuntu/yfit && git add . && git commit -m "Update from Manus task $(date +%Y-%m-%d\ %H:%M)" && git push origin main'
alias yfit-status='cd /home/ubuntu/yfit && git status'
alias yfit-log='cd /home/ubuntu/yfit && git log --oneline -10'
EOF

# Load aliases
if ! grep -q ".yfit_aliases" ~/.bashrc; then
    echo "source ~/.yfit_aliases" >> ~/.bashrc
fi
source /home/ubuntu/.yfit_aliases
echo "✅ Shortcuts created"

# Step 7: Summary
echo ""
echo "================================================"
echo "✅ TASK INITIALIZATION COMPLETE!"
echo "================================================"
echo ""
echo "📋 Quick Commands:"
echo "   yfit           → Navigate to project"
echo "   yfit-pull      → Get latest changes from GitHub"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "   yfit-push      → Save and share your changes (AUTOMATED)"
else
    echo "   yfit-push      → Save and share your changes (requires password)"
fi
echo "   yfit-status    → Check what files changed"
echo "   yfit-log       → View recent commits"
echo ""
echo "📚 Next Steps:"
echo "   1. Start working on your task"
echo "   2. Run 'yfit-pull' at the start of each session"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "   3. Run 'yfit-push' when you finish work (NO PASSWORD NEEDED!)"
else
    echo "   3. Run 'yfit-push' when you finish work"
fi
echo ""
echo "🔒 Your work is safe:"
echo "   - Everything is backed up in GitHub"
echo "   - Pull/push to sync between tasks"
echo "   - Never lose your progress!"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "   - Authentication is AUTOMATIC!"
fi
echo ""
echo "================================================"
