# YFIT Repository Safety Rules

## ⚠️ CRITICAL: Two Separate Repos — Never Cross-Push

| Folder | GitHub Repo | Purpose |
|--------|-------------|---------|
| `/home/ubuntu/yfit` | `github.com/yfitai/yfit-app` | **MAIN APP** — React/Vite fitness tracker (8+ months of work) |
| `/home/ubuntu/yfit-marketing` | `github.com/yfitai/yfit-marketing` | Marketing landing page only |

## Protection in Place

A `pre-push` git hook is installed in **both repos** that blocks any push to a GitHub remote that doesn't match the expected repo name:

- `/home/ubuntu/yfit/.git/hooks/pre-push` — blocks any push unless remote URL contains `yfit-app`
- `/home/ubuntu/yfit-marketing/.git/hooks/pre-push` — blocks any push to GitHub unless remote URL contains `yfit-marketing`

## If the Hook Is Ever Removed

Reinstall it:

```bash
# For main app:
cat > /home/ubuntu/yfit/.git/hooks/pre-push << 'EOF'
#!/bin/bash
REMOTE_URL=$(git remote get-url "$1" 2>/dev/null || echo "")
if echo "$REMOTE_URL" | grep -q "github.com"; then
  if ! echo "$REMOTE_URL" | grep -q "yfit-app"; then
    echo "🚫 PUSH BLOCKED — wrong repo. Expected yfit-app, got: $REMOTE_URL"
    exit 1
  fi
fi
exit 0
EOF
chmod +x /home/ubuntu/yfit/.git/hooks/pre-push

# For marketing site:
cat > /home/ubuntu/yfit-marketing/.git/hooks/pre-push << 'EOF'
#!/bin/bash
REMOTE_URL=$(git remote get-url "$1" 2>/dev/null || echo "")
if echo "$REMOTE_URL" | grep -q "github.com"; then
  if ! echo "$REMOTE_URL" | grep -q "yfit-marketing"; then
    echo "🚫 PUSH BLOCKED — wrong repo. Expected yfit-marketing, got: $REMOTE_URL"
    exit 1
  fi
fi
exit 0
EOF
chmod +x /home/ubuntu/yfit-marketing/.git/hooks/pre-push
```

## History

- **Mar 2026**: Marketing site code was accidentally force-pushed to `yfit-app`, overwriting main app on GitHub. Recovered by force-pushing local main app (4,449 objects) back to remote. Pre-push hooks installed to prevent recurrence.
