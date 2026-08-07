#!/bin/bash
# ============================================================
# YFIT START-WORK SCRIPT
# Run this at the START of every Manus session.
# Usage: bash /home/ubuntu/yfit-app-full/start-work.sh
# ============================================================

set -e

# ── GitHub credentials ──────────────────────────────────────
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
echo "▶ [1/7] Configuring git..."
git config --global user.name "$GITHUB_NAME"
git config --global user.email "$GITHUB_EMAIL"
git config --global credential.helper store
echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
echo "  ✅ Git: $GITHUB_NAME <$GITHUB_EMAIL>"
echo ""

# ── 2. Clone or pull yfit-app (main app + marketing site) ───
echo "▶ [2/7] Setting up yfit-app (main app + www.yfitai.com)..."
if [ -d "/home/ubuntu/yfit-app-full/.git" ]; then
  cd /home/ubuntu/yfit-app-full
  git pull origin main --quiet
  echo "  ✅ yfit-app up to date: $(git log --oneline -1)"
else
  cd /home/ubuntu
  git clone "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/yfitai/yfit-app.git" yfit-app-full
  echo "  ✅ yfit-app cloned: $(cd yfit-app-full && git log --oneline -1)"
fi
echo "  ⚠️  Marketing site (www.yfitai.com) is INSIDE this repo:"
echo "     src/pages/LandingPage.tsx  ← marketing homepage"
echo "     src/pages/GoPage.tsx       ← social funnel /go page"
echo "     src/lib/i18nResources.js   ← ALL translations (8 languages)"
echo ""

# ── 3. Install dependencies ─────────────────────────────────
echo "▶ [3/7] Checking npm dependencies..."
cd /home/ubuntu/yfit-app-full
if [ ! -d "node_modules" ]; then
  echo "  → Installing (first time, may take ~2 min)..."
  npm install --legacy-peer-deps --silent
  echo "  ✅ Dependencies installed"
else
  echo "  ✅ node_modules present (skipping install)"
fi
echo ""

# ── 3b. Reinstall pre-push git hook ─────────────────────────
echo "▶ [3b/7] Reinstalling pre-push safety hook..."
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
echo "▶ [4/7] Checking yfit-admin (accounting/analytics)..."
if [ -d "/home/ubuntu/yfit-marketing/.git" ]; then
  cd /home/ubuntu/yfit-marketing
  echo "  ✅ Present: $(git log --oneline -1)"
  echo "  ⚠️  Folder is named 'yfit-marketing' but this is the yfit-admin repo"
  echo "  ⚠️  Manus-managed — end-work.sh pushes it to GitHub automatically"
else
  echo "  ⚠️  Not found at /home/ubuntu/yfit-marketing"
  echo "  ⚠️  Normal in a fresh Manus session — it appears once Manus loads the project"
fi
echo ""

# ── 5. Show live bundle build number ────────────────────────
echo "▶ [5/7] Current live update bundle:"
if [ -f "/home/ubuntu/yfit-app-full/public/version.json" ]; then
  BUILD=$(python3 -c "import json; d=json.load(open('/home/ubuntu/yfit-app-full/public/version.json')); print(f\"Build {d['buildNumber']} — {d['timestamp'][:10]}\")" 2>/dev/null)
  echo "  ✅ $BUILD"
  echo "  ⚠️  Do NOT create a new bundle without checking this number first"
else
  echo "  (version.json not found — check public/version.json after clone)"
fi
echo ""

# ── 6. Pull yfit-ai monopro hub (docs) ──────────────────────
echo "▶ [6/7] Setting up yfit-ai monopro hub (docs)..."
if [ -d "/home/ubuntu/yfit-ai/.git" ]; then
  cd /home/ubuntu/yfit-ai
  git pull origin main --quiet 2>/dev/null || true
  echo "  ✅ yfit-ai hub up to date: $(git log --oneline -1)"
else
  cd /home/ubuntu
  git clone "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/yfitai/yfit-ai.git" yfit-ai --quiet 2>/dev/null
  echo "  ✅ yfit-ai hub cloned: $(cd yfit-ai && git log --oneline -1)"
fi
echo "  📖 Docs: /home/ubuntu/yfit-ai/docs/MASTER_REFERENCE.md"
echo ""

# ── 7. Print Session Start Rules ────────────────────────────
echo "▶ [7/7] Session Start Rules:"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  REPO MAP                                               │"
echo "  ├─────────────────────────────────────────────────────────┤"
echo "  │  /home/ubuntu/yfit-app-full                             │"
echo "  │    → github: yfitai/yfit-app                            │"
echo "  │    → live:   app.yfitai.com  ← MAIN APP                │"
echo "  │    → live:   www.yfitai.com  ← MARKETING SITE TOO!     │"
echo "  │    → marketing: src/pages/LandingPage.tsx               │"
echo "  │    → go page:   src/pages/GoPage.tsx                    │"
echo "  │    → i18n:      src/lib/i18nResources.js                │"
echo "  │                                                         │"
echo "  │  /home/ubuntu/yfit-marketing  ← MISLEADING NAME!       │"
echo "  │    → github: yfitai/yfit-admin (NOT yfit-marketing)    │"
echo "  │    → live:   Manus-hosted admin/analytics/reports       │"
echo "  │                                                         │"
echo "  │  /home/ubuntu/yfit-ai  ← MONOPRO DOCS HUB              │"
echo "  │    → github: yfitai/yfit-ai                             │"
echo "  │    → docs:   /home/ubuntu/yfit-ai/docs/                 │"
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
echo "  6. For translation fixes — edit src/lib/i18nResources.js"
echo "     NOT the JSON files in client/public/locales/"
echo ""
echo "  NEVER save Manus webdev checkpoints for yfit-admin work"
echo ""
echo "============================================================"
echo "  ✅ Sandbox ready."
echo "  📖 Next: cat /home/ubuntu/yfit-app-full/YFIT_MASTER_REFERENCE.md"
echo "  📖 Docs: /home/ubuntu/yfit-ai/docs/MASTER_REFERENCE.md"
echo "============================================================"
echo ""
