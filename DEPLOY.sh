#!/bin/bash

echo "======================================"
echo "YFIT AI - GitHub Deployment Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the yfit-deploy directory"
    exit 1
fi

echo "📦 Setting up Git repository..."
echo ""

# Configure Git (if not already configured)
git config user.email "support@yfitai.com"
git config user.name "YFIT AI"

echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/yfitai/yfit-app.git

echo ""
echo "🚀 Ready to push to GitHub!"
echo ""
echo "⚠️  IMPORTANT: You'll need to authenticate with GitHub"
echo ""
echo "When prompted:"
echo "  - Username: yfitai"
echo "  - Password: Use a Personal Access Token (NOT your GitHub password)"
echo ""
echo "Don't have a token? Create one at:"
echo "https://github.com/settings/tokens/new"
echo ""
echo "Required permissions: repo (all)"
echo ""
read -p "Press Enter when ready to push to GitHub..."

echo ""
echo "📤 Pushing code to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "🎉 Your repository is now at:"
    echo "   https://github.com/yfitai/yfit-app"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Go to https://vercel.com"
    echo "   2. Click 'Add New Project'"
    echo "   3. Import your GitHub repository (yfit-app)"
    echo "   4. Add environment variables (I'll provide these)"
    echo "   5. Deploy!"
    echo ""
else
    echo ""
    echo "❌ Push failed. This usually means:"
    echo "   1. Repository doesn't exist yet - create it at https://github.com/new"
    echo "   2. Authentication failed - check your token"
    echo "   3. Repository name is different"
    echo ""
    echo "Need help? Let me know what error you see."
fi

