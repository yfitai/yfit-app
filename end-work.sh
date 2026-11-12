#!/bin/bash
# ============================================================
# YFIT END-WORK — canonical app session, not the retired website.
# Update YFIT_MASTER_REFERENCE.md with real decisions BEFORE running.
# Usage: bash /home/ubuntu/yfit-app-full/end-work.sh
# Commits and pushes app, admin and docs hub; verifies clean/synced.
# Never stores PATs, changes global credentials, or force-pushes.
# ============================================================
set -euo pipefail

GITHUB_CLI="gh"
if [ -n "${MANUS_CONFIG_HOME:-}" ] && [ -x "$MANUS_CONFIG_HOME/connectors/github/gh" ]; then
  GITHUB_CLI="$MANUS_CONFIG_HOME/connectors/github/gh"
fi
command -v "$GITHUB_CLI" >/dev/null 2>&1 || {
  echo "GitHub CLI unavailable. Enable the authorized GitHub connection, then rerun."
  exit 1
}
"$GITHUB_CLI" api user >/dev/null || {
  echo "GitHub authorization unavailable. Reconnect GitHub in Manus, then rerun."
  exit 1
}
export GIT_TERMINAL_PROMPT=0

github_git() {
  git -c credential.helper= -c "credential.helper=!\"$GITHUB_CLI\" auth git-credential" "$@"
}
fail() {
  echo "END-WORK INCOMPLETE: $*" >&2
  echo "Do not close or reset the workspace until this is resolved. Local work is preserved." >&2
  exit 1
}
trap 'echo "END-WORK stopped on an error; do not assume all repositories were saved." >&2' ERR

# Validate repository identity before staging or pushing. Never print a
# credential-bearing URL. A matching old URL is normalized to credential-free HTTPS.
ensure_remote() {
  local dir="$1" remote="$2" repo="$3" url
  if url=$(git -C "$dir" remote get-url "$remote" 2>/dev/null); then
    python3 - "$url" "$repo" <<'PY' || fail "Unexpected $remote remote for $repo; no changes made to that remote."
import sys
from urllib.parse import urlsplit
url, expected = sys.argv[1:]
if url.startswith('git@github.com:'):
    actual = url[len('git@github.com:'):].rstrip('/').removesuffix('.git')
    valid = actual == expected
else:
    parsed = urlsplit(url)
    actual = parsed.path.strip('/').removesuffix('.git')
    valid = parsed.scheme == 'https' and parsed.hostname == 'github.com' and actual == expected
sys.exit(0 if valid else 1)
PY
    git -C "$dir" remote set-url "$remote" "https://github.com/$repo.git"
  else
    [ "$remote" = "github" ] || fail "Missing $remote remote for $repo."
    git -C "$dir" remote add "$remote" "https://github.com/$repo.git"
  fi
}

APP="/home/ubuntu/yfit-app-full"
ADMIN="/home/ubuntu/yfit-marketing"
HUB="/home/ubuntu/yfit-ai"
DIRS=("$APP" "$ADMIN" "$HUB")
REPOS=("yfitai/yfit-app" "yfitai/yfit-admin" "yfitai/yfit-ai")
REMOTES=("origin" "github" "origin")
if [ -d "/home/ubuntu/yfit-video-service/.git" ]; then
  DIRS+=("/home/ubuntu/yfit-video-service")
  REPOS+=("yfitai/yfitai-yfit-video-service")
  REMOTES+=("origin")
fi
MESSAGE="${END_WORK_COMMIT_MESSAGE:-chore: save YFIT session $(date -u +%Y-%m-%d)}"

echo "============================================================"
echo "YFIT END-WORK — app + admin + monopro documentation hub"
echo "$(date -u)"
echo "============================================================"

# Preflight every workspace before committing any of them.
for i in "${!DIRS[@]}"; do
  dir="${DIRS[$i]}" repo="${REPOS[$i]}" remote="${REMOTES[$i]}"
  [ -d "$dir/.git" ] || fail "Missing canonical workspace for $repo. Run start-work first."
  [ "$(git -C "$dir" branch --show-current)" = "main" ] || fail "$repo is not on main; ask before switching branches."
  git -C "$dir" diff --check || fail "Whitespace/conflict check failed for $repo."
  [ -z "$(git -C "$dir" diff --name-only --diff-filter=U)" ] || fail "Unresolved merge conflicts in $repo."
  ensure_remote "$dir" "$remote" "$repo"
  "$GITHUB_CLI" api "repos/$repo" >/dev/null || fail "GitHub repository access unavailable for $repo."
done

for i in "${!DIRS[@]}"; do
  dir="${DIRS[$i]}" repo="${REPOS[$i]}" remote="${REMOTES[$i]}"
  echo "Saving $repo..."
  git -C "$dir" config user.name "YFIT AI"
  git -C "$dir" config user.email "don@yfitai.com"
  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    git -C "$dir" add -A
    # Reject recognizable secret values in newly added lines; never print them.
    python3 - "$dir" <<'PY' || fail "Potential credential in staged changes for $repo; review/redact before saving."
import re, subprocess, sys
patch = subprocess.check_output(['git', '-C', sys.argv[1], 'diff', '--cached', '--no-ext-diff', '--no-color', '--unified=0'], text=True)
patterns = re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sbp_[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
found = any(patterns.search(line[1:]) for line in patch.splitlines() if line.startswith('+') and not line.startswith('+++'))
sys.exit(1 if found else 0)
PY
    git -C "$dir" diff --cached --check
    if ! git -C "$dir" diff --cached --quiet; then
      git -C "$dir" commit -m "$MESSAGE"
    fi
  fi
  github_git -C "$dir" push "$remote" main
  echo "Saved $repo at $(git -C "$dir" rev-parse --short HEAD)."
done

# Check ALL workspaces again, after ALL pushes. No success on a partial save.
for i in "${!DIRS[@]}"; do
  dir="${DIRS[$i]}" repo="${REPOS[$i]}" remote="${REMOTES[$i]}"
  [ -z "$(git -C "$dir" status --porcelain)" ] || fail "$repo still has uncommitted work."
  local_sha="$(git -C "$dir" rev-parse HEAD)"
  remote_sha="$(github_git -C "$dir" ls-remote "$remote" refs/heads/main | awk '{print $1}')"
  [ "$local_sha" = "$remote_sha" ] || fail "$repo does not match GitHub main."
  echo "VERIFIED clean and synchronized: $repo ($(git -C "$dir" rev-parse --short HEAD))"
done

python3 - "$APP/public/version.json" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
print(f"Bundle metadata unchanged by end-work: Build {d['buildNumber']} — {d['timestamp'][:10]}")
PY

echo "Admin Manus S3 origin was not pushed or replaced. GitHub backup is verified."
echo "For changed Manus-managed admin code, also save its managed checkpoint through Manus."
echo "End-work complete: app, admin, docs hub and any present video-service checkout are clean and saved to GitHub."
