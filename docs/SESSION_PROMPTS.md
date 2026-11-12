# YFIT session prompts

Updated November 12, 2026. Paste these into the **main YFIT app development conversation**, not the retired marketing task. These are instructions for Manus; you do not need a code checkout on your Windows computer.

## Start-work — copy this

```text
Start-work and verify using the main app monopro structure. Use /home/ubuntu/yfit-app-full (GitHub: yfitai/yfit-app) as the default main-app workspace, not the retired marketing repository. Run: bash /home/ubuntu/yfit-app-full/start-work.sh — then read YFIT_MASTER_REFERENCE.md and the current yfit-ai hub notes. Follow all 6 Rules. Confirm the app, admin and docs hub repository identities, GitHub synchronization, clean/dirty status, and current bundle build number. Preserve any unsaved work. If the sandbox was reset and the script is missing, restore the canonical yfit-app checkout through the authorized GitHub connection first; do not recreate the app or use a substitute project. Do not ask for or store a PAT in chat, code, docs, or remote URLs. Ask if not sure before any change, and report any blocked checks instead of claiming startup is complete.
```

## End-work — copy this

```text
End-work in the main YFIT app development task using the existing monopro structure. Update /home/ubuntu/yfit-app-full/YFIT_MASTER_REFERENCE.md and the current yfit-ai hub resume notes with today's actual decisions, verification results, and unfinished items, without including credentials. Then run: bash /home/ubuntu/yfit-app-full/end-work.sh — commit and push the main app, yfit-admin and yfit-ai docs hub to their correct GitHub repositories. Confirm each working tree is clean and its local HEAD matches GitHub main before saying the session is saved. Preserve the Manus-managed admin S3 origin; if admin code changed, also save its managed checkpoint through Manus after the GitHub backup. Never use the retired marketing repository, force-push, discard unsaved work, change deployments, or consolidate repositories without approval. If any save or verification fails, stop and report it clearly. Ask if not sure before any change.
```

## Canonical map

The main app and live marketing site are both sourced in `yfitai/yfit-app`, locally `/home/ubuntu/yfit-app-full`. The current marketing homepage is `src/pages/LandingPage.tsx`; the social funnel is `src/pages/GoPage.tsx`; translations are in `src/lib/i18nResources.js`.

Admin/accounting/analytics source is `yfitai/yfit-admin`, locally `/home/ubuntu/yfit-marketing` despite the misleading folder name. Its managed `origin` is retained; the separate `github` remote is used for GitHub backup. The private `yfitai/yfit-ai` repository at `/home/ubuntu/yfit-ai` is the documentation hub. The video service is `yfitai/yfitai-yfit-video-service`, deployed on Railway. The old `yfitai/yfit-marketing` repository is retired and must not be used for current work.

This remains a coordinated multi-repository monopro structure. It is **not** a newly consolidated single source repository. No repository migration is implied by these prompts.

## Authentication and save behavior

Both scripts use the enabled GitHub connection through GitHub CLI. Repository authorization must include the app, admin and private documentation hub. There is no `.yfit-credentials` requirement and no PAT is written to `.git-credentials` or embedded in repository URLs. Git identity is configured locally for the intended repositories, not globally.

End-work preflights repository identity and branch, commits changes, rejects recognizable credential values in newly staged lines, pushes without force, and verifies clean working trees and matching remote hashes. This targeted credential check is not a guarantee that every possible secret format is detected. Old credentials already committed in historical documents require separate review and rotation; the scripts do not silently rewrite history.

End-work saves the three core session workspaces and also checks/saves the video-service checkout at `/home/ubuntu/yfit-video-service` when present. If video-service source was edited in another authorized path, save it to its correct GitHub remote separately before declaring all work saved. No video-service changes were made during this restart verification.

A GitHub source backup does not back up hosted databases, service settings/secrets, Manus task history, or account access. Treat source/build/endpoint checks separately from full signed-in app, mobile, email-delivery and social-posting tests.
