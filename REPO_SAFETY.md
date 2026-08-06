# YFIT Repository Safety Rules

## ⚠️ CRITICAL: Four Repos — Never Cross-Push

| Local Folder | GitHub Repo | Live URL | Purpose |
|---|---|---|---|
| `/home/ubuntu/yfit-app-full` | `yfitai/yfit-app` | `app.yfitai.com` | **MAIN APP** — React/Vite/Capacitor (monopro) |
| `/home/ubuntu/yfit-marketing` | Manus S3 (NOT GitHub) | Manus-hosted | **yfit-admin** — accounting, analytics, weekly reports ⚠️ MISLEADING FOLDER NAME |
| *(not cloned locally)* | `yfitai/yfit-marketing` | `www.yfitai.com` | Marketing landing page — Manus UI only |
| *(not cloned locally)* | `yfitai/yfitai-yfit-video-service` | Railway | AI video service |

**MONOPRO STRUCTURE:** The main app (`yfit-app-full`) is the single monorepo containing
the React frontend, Vercel serverless API, Capacitor mobile wrapper, live update bundles,
and all project documentation. This is the only repo you work in directly via git.

---

## Protection: Pre-Push Git Hook

A pre-push hook in `yfit-app-full` blocks any push to a GitHub remote that doesn't
contain `yfit-app` in the URL — preventing accidental pushes to the wrong repo.

**The hook is reinstalled automatically by `start-work.sh` every session.**

### Reinstall manually if needed:

```bash
cat > /home/ubuntu/yfit-app-full/.git/hooks/pre-push << 'EOF'
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
chmod +x /home/ubuntu/yfit-app-full/.git/hooks/pre-push
```

---

## History

- **Mar 2026:** Marketing site code was accidentally force-pushed to `yfit-app`, overwriting
  the main app on GitHub. Recovered by force-pushing local main app (4,449 objects) back to
  remote. Pre-push hooks installed to prevent recurrence.
- **Jul 2026:** Original folder `/home/ubuntu/yfit` renamed to `/home/ubuntu/yfit-app-full`.
  `yfit-marketing` local folder is now actually the `yfit-admin` Manus project — misleading
  name retained because it is Manus-managed and cannot be renamed without breaking the project.
- **Aug 2026:** `start-work.sh` and `end-work.sh` added to automate session setup/teardown
  and reinstall the pre-push hook on every session start.
