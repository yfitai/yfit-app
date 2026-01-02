#!/bin/bash

# YFIT Universal Sync Setup
# Run this ONCE in each task to set up universal gs-* commands

set -e

echo "================================================"
echo "🔄 YFIT Universal Sync Setup"
echo "================================================"
echo ""

# GitHub configuration
GITHUB_TOKEN="${GITHUB_TOKEN:-}"  # Set via environment variable
GITHUB_REPO="yfitai/yfit-app"

# Ensure yfit directory exists
if [ ! -d "/home/ubuntu/yfit" ]; then
    echo "📥 Cloning YFIT repository..."
    cd /home/ubuntu
    git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" yfit
    cd yfit
    git config user.email "yfitai@example.com"
    git config user.name "YFIT AI"
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
fi

# Configure git in yfit directory
cd /home/ubuntu/yfit
git config user.email "yfitai@example.com"
git config user.name "YFIT AI"
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

echo "✅ YFIT repository configured"

# Create universal sync commands
cat > /home/ubuntu/.gs_aliases << 'EOF'
# Universal YFIT Sync Commands
# These work from anywhere and sync the main YFIT repository

alias gs='cd /home/ubuntu/yfit && git add . && git commit -m "Update from Manus task $(date +%Y-%m-%d\ %H:%M)" && git push origin main && echo "✅ Changes saved to GitHub!"'
alias gs-push='cd /home/ubuntu/yfit && git add . && git commit -m "Update from Manus task $(date +%Y-%m-%d\ %H:%M)" && git push origin main && echo "✅ Changes saved to GitHub!"'
alias gs-pull='cd /home/ubuntu/yfit && git pull origin main && echo "✅ Latest changes pulled!"'
alias gs-status='cd /home/ubuntu/yfit && git status'
alias gs-log='cd /home/ubuntu/yfit && git log --oneline -10'
alias yfit='cd /home/ubuntu/yfit'
EOF

# Load aliases in bashrc if not already there
if ! grep -q ".gs_aliases" ~/.bashrc; then
    echo "source ~/.gs_aliases" >> ~/.bashrc
fi

# Load aliases now
source /home/ubuntu/.gs_aliases

echo ""
echo "================================================"
echo "✅ UNIVERSAL SYNC SETUP COMPLETE!"
echo "================================================"
echo ""
echo "📋 Universal Commands (work from ANY directory):"
echo "   gs or gs-push  → Save all changes to GitHub"
echo "   gs-pull        → Get latest changes from GitHub"
echo "   gs-status      → Check what changed"
echo "   gs-log         → View recent commits"
echo "   yfit           → Go to project directory"
echo ""
echo "🎯 How It Works:"
echo "   - These commands ALWAYS work on /home/ubuntu/yfit/"
echo "   - Run them from ANY directory in ANY task"
echo "   - Your changes are automatically saved to GitHub"
echo "   - Pull in other tasks to see the changes"
echo ""
echo "📚 Workflow:"
echo "   1. Start work: gs-pull"
echo "   2. Make changes in /home/ubuntu/yfit/"
echo "   3. End work: gs-push"
echo ""
echo "================================================"
