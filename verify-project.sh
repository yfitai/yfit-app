#!/bin/bash

# ============================================================
# YFIT Project Verification System
# Ensures you're always working in the correct project
# ============================================================

echo ""
echo "🔍 VERIFYING PROJECT CONTEXT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check current directory
CURRENT_DIR=$(pwd)

if [[ "$CURRENT_DIR" == *"/yfit"* ]] && [[ "$CURRENT_DIR" != *"/yfit-marketing"* ]]; then
    echo "✅ PROJECT: Main App Development"
    echo "📁 LOCATION: /home/ubuntu/yfit/"
    echo "🎯 PURPOSE: YFIT Fitness App (Vercel/Supabase)"
    echo ""
    echo "📋 AVAILABLE COMMANDS:"
    echo "   • start-work  - Pull latest code from GitHub"
    echo "   • end-work    - Save and push to GitHub"
    echo "   • check-status - See what changed"
    echo ""
    echo "✅ You're in the RIGHT project!"
    
elif [[ "$CURRENT_DIR" == *"/yfit-marketing"* ]]; then
    echo "🌐 PROJECT: Marketing Website"
    echo "📁 LOCATION: /home/ubuntu/yfit-marketing/"
    echo "🎯 PURPOSE: YFIT Marketing Site (Manus Webdev)"
    echo ""
    echo "📋 AVAILABLE COMMANDS:"
    echo "   • webdev_save_checkpoint - Save changes"
    echo "   • webdev_check_status - Check project status"
    echo ""
    echo "✅ You're in the Marketing Website project!"
    
else
    echo "⚠️  WARNING: You're not in a YFIT project!"
    echo "📁 CURRENT LOCATION: $CURRENT_DIR"
    echo ""
    echo "🔧 TO FIX:"
    echo "   For Main App: cd /home/ubuntu/yfit"
    echo "   For Marketing: cd /home/ubuntu/yfit-marketing"
    echo ""
    return 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
