#!/bin/bash

# YFIT One-Command Setup
# Run this ONCE to set up everything

set -e

echo "================================================"
echo "🚀 YFIT Complete Setup"
echo "================================================"
echo ""

# GitHub configuration
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="yfitai/yfit-app"
PROJECT_DIR="/home/ubuntu/yfit"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not set!"
    echo ""
    echo "Run this command instead:"
    echo ""
    echo 'export GITHUB_TOKEN="your_token" && bash SETUP.sh'
    echo ""
    exit 1
fi

# Clone or update repository
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📥 Cloning YFIT repository..."
    cd /home/ubuntu
    git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" yfit
else
    echo "📂 Project directory exists, updating..."
    cd "$PROJECT_DIR"
    git pull origin main
fi

# Configure git
cd "$PROJECT_DIR"
git config user.email "yfitai@example.com"
git config user.name "YFIT AI"
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

echo "✅ Repository configured"
echo ""

# Install workflow system
echo "🔧 Installing workflow commands..."

cat > /home/ubuntu/.yfit_workflow << 'EOF'
# YFIT Workflow Aliases
alias start-work='bash /home/ubuntu/yfit/yfit-workflow.sh start'
alias end-work='bash /home/ubuntu/yfit/yfit-workflow.sh end'
alias check-status='bash /home/ubuntu/yfit/yfit-workflow.sh status'
alias view-history='bash /home/ubuntu/yfit/yfit-workflow.sh history'
alias go-to-project='cd /home/ubuntu/yfit'
EOF

# Add to bashrc if not already there
if ! grep -q ".yfit_workflow" ~/.bashrc; then
    echo "source /home/ubuntu/.yfit_workflow" >> ~/.bashrc
fi

# Load aliases
source /home/ubuntu/.yfit_workflow

echo "✅ Workflow commands installed"
echo ""

# Show status
echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "📋 Available Commands:"
echo ""
echo "  start-work      - Pull latest, start session"
echo "  end-work        - Save all, push to GitHub"
echo "  check-status    - See what changed"
echo "  view-history    - See recent commits"
echo "  go-to-project   - Navigate to project"
echo ""
echo "📂 Project Location: $PROJECT_DIR"
echo "🌿 Current Branch: $(cd $PROJECT_DIR && git branch --show-current)"
echo "📝 Latest Commit: $(cd $PROJECT_DIR && git log -1 --oneline)"
echo ""
echo "📚 Quick Start Guide: $PROJECT_DIR/YFIT_QUICK_START.md"
echo ""
echo "================================================"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start working: start-work"
echo "2. Make your changes"
echo "3. Save everything: end-work"
echo ""
echo "================================================"
