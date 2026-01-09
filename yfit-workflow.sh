#!/bin/bash

# YFIT Automated Workflow System
# Simple commands for daily work

GITHUB_TOKEN="${GITHUB_TOKEN:-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}"
GITHUB_REPO="yfitai/yfit-app"
PROJECT_DIR="/home/ubuntu/yfit"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure we're in the project directory
cd "$PROJECT_DIR" 2>/dev/null || {
    echo "❌ Project directory not found. Run setup first!"
    exit 1
}

# Configure git with token
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" 2>/dev/null

case "$1" in
    start)
        echo "================================================"
        echo "🚀 Starting Work Session"
        echo "================================================"
        echo ""
        
        # VERIFY PROJECT FIRST
        source "$PROJECT_DIR/verify-project.sh"
        
        echo "📥 Pulling latest changes from GitHub..."
        git pull origin main
        echo ""
        echo -e "${GREEN}✅ Ready to work!${NC}"
        echo ""
        echo "📂 Project location: $PROJECT_DIR"
        echo "🌿 Current branch: $(git branch --show-current)"
        echo "📝 Latest commit: $(git log -1 --oneline)"
        echo ""
        echo "================================================"
        ;;
    
    end)
        echo "================================================"
        echo "💾 Ending Work Session"
        echo "================================================"
        echo ""
        echo "📊 Checking for changes..."
        
        if [[ -z $(git status -s) ]]; then
            echo ""
            echo -e "${YELLOW}ℹ️  No changes to save${NC}"
            echo ""
            echo "================================================"
            exit 0
        fi
        
        echo ""
        echo "📝 Changes found:"
        git status -s
        echo ""
        echo "💾 Saving all changes..."
        git add -A
        git commit -m "Update from Manus: $(date '+%Y-%m-%d %H:%M')"
        echo ""
        echo "📤 Pushing to GitHub..."
        git push origin main
        echo ""
        echo -e "${GREEN}✅ All changes saved and synced!${NC}"
        echo ""
        echo "================================================"
        ;;
    
    status)
        echo "================================================"
        echo "📊 Project Status"
        echo "================================================"
        echo ""
        git status
        echo ""
        echo "================================================"
        ;;
    
    history)
        echo "================================================"
        echo "📜 Recent History"
        echo "================================================"
        echo ""
        git log --oneline -10
        echo ""
        echo "================================================"
        ;;
    
    *)
        echo "YFIT Workflow Commands:"
        echo ""
        echo "  start-work      - Pull latest changes, start session"
        echo "  end-work        - Save all changes, push to GitHub"
        echo "  check-status    - See what files changed"
        echo "  view-history    - See recent commits"
        echo ""
        exit 1
        ;;
esac
