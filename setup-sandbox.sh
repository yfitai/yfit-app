#!/bin/bash
# ============================================================
# YFIT Sandbox Setup Script
# Run this at the START of every new Manus session.
# Restores the full working environment from GitHub.
# ============================================================

set -e

# ── GitHub credentials ──────────────────────────────────────
# The token is stored in ~/.yfit-credentials (created on first run)
# On a fresh sandbox, paste the GitHub PAT when prompted.
# Token format: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: https://github.com/settings/tokens → yfitai account
GITHUB_USER="yfitai"
GITHUB_EMAIL="don@yfitai.com"
GITHUB_NAME="YFIT AI"
CREDS_FILE="$HOME/.yfit-credentials"

if [ -f "$CREDS_FILE" ]; then
  GITHUB_TOKEN=$(cat "$CREDS_FILE")
else
  echo "  First-time setup: enter the GitHub PAT for the yfitai account."
  echo "  (Get from: https://github.com/settings/tokens)"
  read -rsp "  GitHub PAT (ghp_...): " GITHUB_TOKEN
  echo ""
  echo "$GITHUB_TOKEN" > "$CREDS_FILE"
  chmod 600 "$CREDS_FILE"
  echo "  ✅ Token saved to $CREDS_FILE for future sessions"
fi

echo ""
echo "============================================================"
echo "  YFIT Sandbox Setup"
echo "  $(date)"
echo "============================================================"
echo ""

# ── Step 1: Configure git globally ──────────────────────────
echo "▶ Configuring git..."
git config --global user.name "$GITHUB_NAME"
git config --global user.email "$GITHUB_EMAIL"
git config --global credential.helper store
echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
echo "  ✅ Git configured as $GITHUB_NAME <$GITHUB_EMAIL>"
echo ""

# ── Step 2: Clone or update yfit-app ────────────────────────
echo "▶ Setting up yfit-app (main app)..."
if [ -d "/home/ubuntu/yfit-app-full/.git" ]; then
  echo "  → Already cloned. Pulling latest..."
  cd /home/ubuntu/yfit-app-full
  git pull origin main --quiet
  echo "  ✅ yfit-app updated: $(git log --oneline -1)"
else
  echo "  → Cloning from GitHub..."
  cd /home/ubuntu
  git clone "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/yfitai/yfit-app.git" yfit-app-full
  echo "  ✅ yfit-app cloned: $(cd yfit-app-full && git log --oneline -1)"
fi
echo ""

# ── Step 3: Install yfit-app dependencies ───────────────────
echo "▶ Installing yfit-app dependencies..."
cd /home/ubuntu/yfit-app-full
if [ ! -d "node_modules" ]; then
  npm install --legacy-peer-deps --silent
  echo "  ✅ Dependencies installed"
else
  echo "  ✅ node_modules already present (skipping install)"
fi
echo ""

# ── Step 4: Verify yfit-admin (Manus-managed) ───────────────
echo "▶ Checking yfit-admin (accounting/analytics)..."
if [ -d "/home/ubuntu/yfit-marketing/.git" ]; then
  cd /home/ubuntu/yfit-marketing
  ADMIN_COMMIT=$(git log --oneline -1)
  echo "  ✅ yfit-admin present: $ADMIN_COMMIT"
  echo "  ⚠️  NOTE: Local folder is 'yfit-marketing' but this is the yfit-admin repo"
  echo "  ⚠️  It is Manus-managed (S3) — do NOT git push to GitHub from here"
else
  echo "  ⚠️  yfit-admin not found at /home/ubuntu/yfit-marketing"
  echo "  ⚠️  This is normal if you are in a fresh Manus session — it will appear shortly"
fi
echo ""

# ── Step 5: Show current bundle build number ────────────────
echo "▶ Current live update bundle:"
if [ -f "/home/ubuntu/yfit-app-full/public/version.json" ]; then
  BUILD=$(python3 -c "import json; d=json.load(open('/home/ubuntu/yfit-app-full/public/version.json')); print(f\"Build {d['buildNumber']} — {d['timestamp'][:10]}\")" 2>/dev/null || cat /home/ubuntu/yfit-app-full/public/version.json)
  echo "  ✅ $BUILD"
else
  echo "  (version.json not found)"
fi
echo ""

# ── Step 6: Print the Session Start Rules ───────────────────
echo "============================================================"
echo "  SESSION START RULES (from YFIT_MASTER_REFERENCE.md)"
echo "============================================================"
echo ""
echo "  REPO MAP:"
echo "  /home/ubuntu/yfit-app-full  → yfitai/yfit-app  → app.yfitai.com (MAIN APP)"
echo "  /home/ubuntu/yfit-marketing → yfitai/yfit-admin (ACCOUNTING/ANALYTICS)"
echo "    ↑ MISLEADING FOLDER NAME — this is NOT the marketing site"
echo "  yfitai/yfit-marketing       → www.yfitai.com (not cloned locally)"
echo "  yfitai/yfitai-yfit-video-service → Railway (not cloned locally)"
echo ""
echo "  RULES:"
echo "  1. Read YFIT_MASTER_REFERENCE.md before making ANY changes"
echo "  2. Check which repo you are in (git remote -v) before every change"
echo "  3. Check bundle build number before creating a new bundle"
echo "  4. NEVER add outputDirectory to vercel.json"
echo "  5. Test food search after any API changes"
echo "  6. For translation fixes — check language section before editing i18nResources.js"
echo ""
echo "  NEVER save Manus webdev checkpoints for yfit-admin work"
echo "  All main app commits go to GitHub via: cd /home/ubuntu/yfit-app-full && git push"
echo ""
echo "============================================================"
echo "  ✅ Sandbox ready. Read YFIT_MASTER_REFERENCE.md now."
echo "============================================================"
echo ""
