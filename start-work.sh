#!/bin/bash
# ============================================================
# YFIT START-WORK SCRIPT
# Run this at the START of every Manus session.
# Usage: bash /home/ubuntu/yfit-app-full/start-work.sh
# ============================================================

set -e

# ── GitHub credentials ──────────────────────────────────────
# Token stored in ~/.yfit-credentials (created on first run)
# On a fresh sandbox, paste the GitHub PAT when prompted.
# Get from: https://github.com/settings/tokens (yfitai account)
GITHUB_USER="yfitai"
GITHUB_EMAIL="don@yfitai.com"
GITHUB_NAME="YFIT AI"
CREDS_FILE="$HOME/.yfit-credentials"

if [ -f "$CREDS_FILE" ]; then
  GITHUB_TOKEN=$(cat "$CREDS_FILE")
else
  echo ""
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
echo "  YFIT START-WORK"
echo "  $(date)"
echo "============================================================"
echo ""

# ── 1. Configure git ────────────────────────────────────────
echo "▶ [1/6] Configuring git..."
git config --global user.name "$GITHUB_NAME"
git config --global user.email "$GITHUB_EMAIL"
git config --global credential.helper store
echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
echo "  ✅ Git: $GITHUB_NAME <$GITHUB_EMAIL>"
echo ""

# ── 2. Clone or pull yfit-app (main app) ────────────────────
echo "▶ [2/6] Setting up yfit-app (main app)..."
if [ -d "/home/ubuntu/yfit-app-full/.git" ]; then
  cd /home/ubuntu/yfit-app-full
  git pull origin main --quiet
  echo "  ✅ yfit-app up to date: $(git log --oneline -1)"
else
  cd /home/ubuntu
  git clone "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/yfitai/yfit-app.git" yfit-app-full
  echo "  ✅ yfit-app cloned: $(cd yfit-app-full && git log --oneline -1)"
fi
echo ""

# ── 3. Install dependencies ─────────────────────────────────
echo "▶ [3/6] Checking npm dependencies..."
cd /home/ubuntu/yfit-app-full
if [ ! -d "node_modules" ]; then
  echo "  → Installing (first time, may take ~2 min)..."
  npm install --legacy-peer-deps --silent
  echo "  ✅ Dependencies installed"
else
  echo "  ✅ node_modules present (skipping install)"
fi
echo ""

# ── 3b. Reinstall pre-push git hook (safety — blocks wrong-repo pushes) ─
echo "▶ [3b] Reinstalling pre-push safety hook..."
cat > /home/ubuntu/yfit-app-full/.git/hooks/pre-push << 'HOOK'
#!/bin/bash
REMOTE_URL=$(git remote get-url "$1" 2>/dev/null || echo "")
if echo "$REMOTE_URL" | grep -q "github.com"; then
  if ! echo "$REMOTE_URL" | grep -q "yfit-app"; then
    echo "🚫 PUSH BLOCKED — wrong repo. Expected yfit-app, got: $REMOTE_URL"
    exit 1
  fi
fi
exit 0
HOOK
chmod +x /home/ubuntu/yfit-app-full/.git/hooks/pre-push
echo "  ✅ Pre-push hook installed (blocks accidental pushes to wrong repo)"
echo ""

# ── 4. Check yfit-admin (Manus-managed, misleadingly named) ─
echo "▶ [4/6] Checking yfit-admin (accounting/analytics)..."
if [ -d "/home/ubuntu/yfit-marketing/.git" ]; then
  cd /home/ubuntu/yfit-marketing
  echo "  ✅ Present: $(git log --oneline -1)"
  echo "  ⚠️  Folder is named 'yfit-marketing' but this is the yfit-admin repo"
  echo "  ⚠️  Manus-managed (S3) — do NOT git push to GitHub from here"
else
  echo "  ⚠️  Not found at /home/ubuntu/yfit-marketing"
  echo "  ⚠️  Normal in a fresh Manus session — it will appear once Manus loads the project"
fi
echo ""

# ── 5. Show live bundle build number ────────────────────────
echo "▶ [5/6] Current live update bundle:"
if [ -f "/home/ubuntu/yfit-app-full/public/version.json" ]; then
  BUILD=$(python3 -c "import json; d=json.load(open('/home/ubuntu/yfit-app-full/public/version.json')); print(f\"Build {d['buildNumber']} — {d['timestamp'][:10]}\")" 2>/dev/null)
  echo "  ✅ $BUILD"
  echo "  ⚠️  Do NOT create a new bundle without checking this number first"
else
  echo "  (version.json not found — check public/version.json after clone)"
fi
echo ""

# ── 6. Print Session Start Rules ────────────────────────────
echo "▶ [6/6] Session Start Rules:"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  REPO MAP                                               │"
echo "  ├─────────────────────────────────────────────────────────┤"
echo "  │  /home/ubuntu/yfit-app-full                             │"
echo "  │    → github: yfitai/yfit-app                            │"
echo "  │    → live:   app.yfitai.com  ← MAIN APP                │"
echo "  │                                                         │"
echo "  │  /home/ubuntu/yfit-marketing  ← MISLEADING NAME!       │"
echo "  │    → github: yfitai/yfit-admin (NOT yfit-marketing)    │"
echo "  │    → live:   Manus-hosted admin/analytics/reports       │"
echo "  │                                                         │"
echo "  │  yfitai/yfit-marketing  (NOT cloned locally)            │"
echo "  │    → live:   www.yfitai.com  (Manus UI only)           │"
echo "  │                                                         │"
echo "  │  yfitai/yfitai-yfit-video-service  (NOT cloned)        │"
echo "  │    → live:   Railway                                    │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo "  RULES:"
echo "  1. Read YFIT_MASTER_REFERENCE.md before making ANY changes"
echo "  2. Check which repo you are in: git remote -v"
echo "  3. Check bundle build number before creating a new bundle"
echo "  4. NEVER add outputDirectory to vercel.json"
echo "  5. Test food search after any API changes:"
echo "     https://app.yfitai.com/api/food/search?query=apple"
echo "  6. For translation fixes — check language section first"
echo "     before editing i18nResources.js"
echo ""
echo "  NEVER save Manus webdev checkpoints for yfit-admin work"
echo ""
echo "============================================================"
echo "  ✅ Sandbox ready."
echo "  📖 Next: cat /home/ubuntu/yfit-app-full/YFIT_MASTER_REFERENCE.md"
echo "============================================================"
echo ""
