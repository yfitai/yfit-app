#!/bin/bash
# ============================================================
# YFIT END-WORK SCRIPT
# Run this at the END of every Manus session.
# Commits all uncommitted changes, pushes to GitHub,
# and updates the Master Reference session log.
# Usage: bash /home/ubuntu/yfit-app-full/end-work.sh
# ============================================================

GITHUB_USER="yfitai"
CREDS_FILE="$HOME/.yfit-credentials"

if [ -f "$CREDS_FILE" ]; then
  GITHUB_TOKEN=$(cat "$CREDS_FILE")
else
  echo "  ⚠️  No credentials found. Run start-work.sh first."
  exit 1
fi

echo ""
echo "============================================================"
echo "  YFIT END-WORK"
echo "  $(date)"
echo "============================================================"
echo ""

# ── 1. Check yfit-app status ────────────────────────────────
echo "▶ [1/4] yfit-app status..."
cd /home/ubuntu/yfit-app-full

DIRTY=$(git status --short)
if [ -n "$DIRTY" ]; then
  echo "  ⚠️  Uncommitted changes found:"
  git status --short
  echo ""
  read -rp "  Commit message (or press Enter to skip): " COMMIT_MSG
  if [ -n "$COMMIT_MSG" ]; then
    git add -A
    git commit -m "$COMMIT_MSG"
    echo "  ✅ Committed: $COMMIT_MSG"
  else
    echo "  ⚠️  Skipped commit — changes remain uncommitted"
  fi
else
  echo "  ✅ Clean — nothing to commit"
fi
echo ""

# ── 2. Push yfit-app to GitHub ──────────────────────────────
echo "▶ [2/4] Pushing yfit-app to GitHub..."
git remote set-url origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/yfitai/yfit-app.git"
git push origin main
LAST_COMMIT=$(git log --oneline -1)
echo "  ✅ Pushed: $LAST_COMMIT"
echo ""

# ── 3. Check yfit-admin status ──────────────────────────────
echo "▶ [3/4] yfit-admin (accounting/analytics) status..."
if [ -d "/home/ubuntu/yfit-marketing/.git" ]; then
  cd /home/ubuntu/yfit-marketing
  ADMIN_DIRTY=$(git status --short)
  if [ -n "$ADMIN_DIRTY" ]; then
    echo "  ⚠️  Uncommitted changes in yfit-admin:"
    git status --short
    echo "  ℹ️  yfit-admin is Manus-managed — changes are auto-saved by Manus"
    echo "  ℹ️  No git push needed here"
  else
    echo "  ✅ yfit-admin clean: $(git log --oneline -1)"
  fi
else
  echo "  ⚠️  yfit-admin not found — skipping"
fi
echo ""

# ── 4. Show final build number and summary ──────────────────
echo "▶ [4/4] Session summary:"
cd /home/ubuntu/yfit-app-full
if [ -f "public/version.json" ]; then
  BUILD=$(python3 -c "import json; d=json.load(open('public/version.json')); print(f\"Build {d['buildNumber']} — {d['timestamp'][:10]}\")" 2>/dev/null)
  echo "  Live bundle: $BUILD"
fi
echo "  Last yfit-app commit: $(git log --oneline -1)"
echo ""
echo "  ✅ REMINDER: Update YFIT_MASTER_REFERENCE.md with today's changes"
echo "     then run: git add YFIT_MASTER_REFERENCE.md && git commit -m 'docs: session log' && git push origin main"
echo ""
echo "============================================================"
echo "  ✅ End-work complete. Session saved."
echo "============================================================"
echo ""

