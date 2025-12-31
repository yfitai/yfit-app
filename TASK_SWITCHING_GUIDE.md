# YFIT Project - Task Switching Guide

**Last Updated:** December 28, 2025

---

## 🎯 Purpose

This guide ensures you **never lose work** when switching between Manus tasks. Follow these steps religiously and your work will always be safe in GitHub.

---

## 📋 Your 6 Tasks

| Icon | Task Name | Purpose |
|------|-----------|---------|
| 🌍 | **Language Translator** | Internationalization (i18n), translating app to multiple languages |
| ⭐ | **Main App Development** | Primary feature development, bug fixes, core functionality |
| 📱 | **Android IOS Build & Deploy** | Building APKs, testing on devices, deployment |
| 📚 | **Documentation** | User guides, API docs, command references, process documentation |
| 📱 | **Social Media Assets** | Graphics, videos, content creation, article scraping |
| 🌐 | **Marketing Website** | Landing page, pricing, testimonials, SEO |

---

## 🔄 The Golden Rule

**ALWAYS follow this workflow:**

### When STARTING work in ANY task:
```bash
yfit-pull
```
*(Gets the latest changes from GitHub)*

### When FINISHING work in ANY task:
```bash
yfit-push
```
*(Saves and shares your changes to GitHub)*

**That's it!** Follow this rule and you'll never lose work.

---

## 🚀 Initial Setup (Do This Once Per Task)

### Step 1: Run Setup Script

**In each of your 6 tasks, run this ONCE:**

```bash
cd /home/ubuntu/yfit
chmod +x setup-task.sh
./setup-task.sh
```

**What this does:**
- ✅ Clones the project from GitHub (if not already there)
- ✅ Configures Git with your credentials
- ✅ Installs Node.js dependencies
- ✅ Creates helpful shortcut commands
- ✅ Shows you the project status

**Expected output:**
```
================================================
✅ TASK INITIALIZATION COMPLETE!
================================================

📋 Quick Commands:
   yfit           → Navigate to project
   yfit-pull      → Get latest changes from GitHub
   yfit-push      → Save and share your changes
   yfit-status    → Check what files changed
   yfit-log       → View recent commits
```

### Step 2: Verify Setup

```bash
yfit
yfit-status
```

You should see:
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

✅ **You're ready to work!**

---

## 📖 Daily Workflow

### Scenario 1: Working in Main App Development

**Morning - Start work:**
```bash
yfit-pull
```

**Work on features:**
- Edit files in `/home/ubuntu/yfit/src/`
- Test your changes
- Fix bugs

**Evening - Finish work:**
```bash
yfit-push
```

**Done!** Your changes are now in GitHub.

---

### Scenario 2: Switching to Language Translator

**You just finished work in Main App Development and pushed your changes.**

**Now switch to Language Translator task:**

1. **Click "Language Translator" in sidebar**
2. **Run:**
   ```bash
   yfit-pull
   ```
3. **You now have ALL the changes you just made!**
4. **Work on translations**
5. **When done:**
   ```bash
   yfit-push
   ```

---

### Scenario 3: Building Android After Code Changes

**You made changes in Main App Development and want to build Android:**

1. **In Main App Development task:**
   ```bash
   yfit-push
   ```

2. **Switch to "Android IOS Build & Deploy" task**

3. **Pull latest changes:**
   ```bash
   yfit-pull
   ```

4. **Build Android:**
   ```bash
   npm run build
   npx cap sync android
   cd android
   .\gradlew assembleDebug --no-daemon --max-workers=1
   ```

5. **Install on device:**
   ```bash
   cd ..
   C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 🛡️ Safety Checks

### Before Switching Tasks

**Always run:**
```bash
yfit-status
```

**If you see changes:**
```
Changes not staged for commit:
  modified:   src/components/SomeFile.jsx
```

**Then run:**
```bash
yfit-push
```

**If you see:**
```
nothing to commit, working tree clean
```

**You're safe to switch tasks!**

---

## 🚨 Emergency: "I Think I Lost Work!"

**Don't panic!** Follow these steps:

### Step 1: Check if it's in GitHub

```bash
yfit-log
```

Look for your recent commits. If you see them, your work is safe!

### Step 2: Check if it's uncommitted

```bash
yfit-status
```

If you see modified files, they're still there! Just run:
```bash
yfit-push
```

### Step 3: Check other tasks

Your work might be in a different task. Switch to each task and run:
```bash
yfit-status
yfit-log
```

### Step 4: Check GitHub directly

Go to: https://github.com/yfitai/yfit-app/commits/main

All your commits are listed there.

---

## 📝 Detailed Command Reference

### Navigation Commands

```bash
# Go to project directory
yfit

# Or manually:
cd /home/ubuntu/yfit
```

### Sync Commands

```bash
# Get latest changes (run at START of work)
yfit-pull

# Save and share changes (run at END of work)
yfit-push

# Check what changed
yfit-status

# View recent commits
yfit-log
```

### Manual Git Commands

If you need more control:

```bash
cd /home/ubuntu/yfit

# Check status
git status

# Pull latest
git pull origin main

# Add all changes
git add .

# Commit with message
git commit -m "Description of what you did"

# Push to GitHub
git push origin main

# View commit history
git log --oneline -20
```

---

## 🎯 Task-Specific Workflows

### 🌍 Language Translator

**Purpose:** Translate app to multiple languages

**Typical workflow:**
1. `yfit-pull` - Get latest code
2. Edit translation files in `src/locales/`
3. Test translations
4. `yfit-push` - Share translations

**Files you'll work with:**
- `src/locales/en.json` (English)
- `src/locales/es.json` (Spanish)
- `src/locales/fr.json` (French)
- `src/i18n.js` (Configuration)

---

### ⭐ Main App Development

**Purpose:** Core feature development

**Typical workflow:**
1. `yfit-pull` - Get latest code
2. Edit files in `src/components/`, `src/pages/`, etc.
3. Test locally (if needed): `npm run dev`
4. `yfit-push` - Deploy to Vercel automatically

**Files you'll work with:**
- `src/components/` - React components
- `src/pages/` - Page components
- `src/lib/` - Utility functions
- `src/styles/` - CSS files

---

### 📱 Android IOS Build & Deploy

**Purpose:** Build and test mobile apps

**Typical workflow:**
1. `yfit-pull` - Get latest code
2. Build web app: `npm run build`
3. Sync to Android: `npx cap sync android`
4. Build APK: `cd android && .\gradlew assembleDebug --no-daemon --max-workers=1`
5. Install: `adb install -r android\app\build\outputs\apk\debug\app-debug.apk`
6. No need to push (no code changes)

**When to use:**
- After making changes in Main App Development
- Testing on physical devices
- Preparing for Play Store release

---

### 📚 Documentation

**Purpose:** Write guides and references

**Typical workflow:**
1. `yfit-pull` - Get latest code (to reference)
2. Create/edit markdown files in `docs/`
3. `yfit-push` - Share documentation

**Files you'll work with:**
- `docs/user-guide.md`
- `docs/api-reference.md`
- `docs/developer-guide.md`
- `YFIT_PROJECT_ORGANIZATION.md`
- `TASK_SWITCHING_GUIDE.md` (this file!)

---

### 📱 Social Media Assets

**Purpose:** Create content for social media

**Typical workflow:**
1. `yfit-pull` - Get latest code
2. Scrape articles, create graphics, write copy
3. Save assets to `public/social-media/`
4. If you want to use quotes in the app:
   - Create `src/data/health-tips.json`
   - Import in app code
5. `yfit-push` - Share assets

**Files you'll work with:**
- `public/social-media/` - Images, videos
- `src/data/health-tips.json` - Quotes for app
- `docs/social-media-calendar.md` - Content plan

---

### 🌐 Marketing Website

**Purpose:** Landing page and marketing

**Typical workflow:**
1. `yfit-pull` - Get latest code
2. Edit files in `yfit-marketing/` (separate project)
3. Test changes
4. `yfit-push` - Deploy to Vercel

**Files you'll work with:**
- `client/src/pages/Home.tsx` - Landing page
- `client/src/components/` - Marketing components
- `client/src/index.css` - Styles

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting to Pull

**Problem:** You start working without running `yfit-pull`

**Result:** You're working on old code, missing recent changes

**Solution:** **ALWAYS** run `yfit-pull` when starting work

---

### ❌ Mistake 2: Forgetting to Push

**Problem:** You finish work but don't run `yfit-push`

**Result:** Your changes aren't in GitHub, other tasks can't see them

**Solution:** **ALWAYS** run `yfit-push` when finishing work

---

### ❌ Mistake 3: Switching Tasks Without Pushing

**Problem:** You switch tasks without running `yfit-push`

**Result:** Your uncommitted changes are left behind

**Solution:** Check `yfit-status` before switching, push if needed

---

### ❌ Mistake 4: Editing Files Outside Manus

**Problem:** You edit files on your local computer and in Manus

**Result:** Merge conflicts, confusion

**Solution:** Choose ONE place to edit (recommend: Manus)

---

## 🔍 Troubleshooting

### Problem: "fatal: not a git repository"

**Solution:**
```bash
cd /home/ubuntu/yfit
./setup-task.sh
```

---

### Problem: "Your branch is behind 'origin/main'"

**Solution:**
```bash
yfit-pull
```

---

### Problem: "error: Your local changes would be overwritten by merge"

**Solution:**
```bash
cd /home/ubuntu/yfit
git stash  # Save your changes temporarily
git pull origin main  # Get latest
git stash pop  # Restore your changes
```

---

### Problem: "I made changes in the wrong task!"

**Solution:**
```bash
# In the wrong task:
yfit-push  # Save the changes to GitHub

# In the correct task:
yfit-pull  # Get the changes
```

**Your changes are now in the right task!**

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      GITHUB                             │
│         (Source of Truth - All Code Lives Here)         │
└─────────────────────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
              yfit-push            yfit-push
                    │                    │
                    │                    │
┌───────────────────┴──────┐   ┌────────┴────────────────┐
│   Task 1: Main App Dev   │   │  Task 2: Translation    │
│   /home/ubuntu/yfit/     │   │  /home/ubuntu/yfit/     │
│                          │   │                         │
│   1. yfit-pull (start)   │   │  1. yfit-pull (start)   │
│   2. Work on features    │   │  2. Work on i18n        │
│   3. yfit-push (end)     │   │  3. yfit-push (end)     │
└──────────────────────────┘   └─────────────────────────┘
```

**Key Points:**
- Each task has its own sandbox
- GitHub is the central hub
- Pull at start, push at end
- All tasks stay in sync

---

## ✅ Checklist: Am I Doing This Right?

**Before starting work:**
- [ ] I opened the correct task for what I'm working on
- [ ] I ran `yfit-pull` to get latest changes
- [ ] I checked `yfit-status` to confirm clean state

**While working:**
- [ ] I'm editing files in `/home/ubuntu/yfit/`
- [ ] I'm testing my changes as I go
- [ ] I'm committing logical chunks (not waiting until the end)

**Before finishing work:**
- [ ] I tested my changes
- [ ] I ran `yfit-status` to see what changed
- [ ] I ran `yfit-push` to save and share

**Before switching tasks:**
- [ ] I ran `yfit-push` in current task
- [ ] I confirmed "nothing to commit, working tree clean"
- [ ] I'm ready to switch!

---

## 🎓 Advanced Tips

### Tip 1: Commit Often

Don't wait until the end of the day. Commit after each logical change:

```bash
cd /home/ubuntu/yfit
git add .
git commit -m "Add user profile page"
git push origin main
```

### Tip 2: Use Descriptive Commit Messages

**Bad:**
```bash
git commit -m "Update"
```

**Good:**
```bash
git commit -m "Fix: Daily tracker blood pressure column names"
```

### Tip 3: Check GitHub Web Interface

Visit https://github.com/yfitai/yfit-app to see all your commits and changes.

### Tip 4: Create Branches for Big Features

```bash
cd /home/ubuntu/yfit
git checkout -b feature/language-translation
# Work on feature
git push origin feature/language-translation
# Merge when ready
```

---

## 📞 Need Help?

**If something goes wrong:**

1. **Check this guide** - Most issues are covered here
2. **Check Git status:** `yfit-status`
3. **Check Git log:** `yfit-log`
4. **Check GitHub:** https://github.com/yfitai/yfit-app
5. **Ask in Manus task:** Describe the issue and I'll help!

---

## 🎯 Summary

**The entire workflow in 3 commands:**

```bash
# 1. Start work
yfit-pull

# 2. Do your work
# (edit files, test, etc.)

# 3. Finish work
yfit-push
```

**Follow this and you'll never lose work!** 🎉

---

**Document maintained by:** Don Campbell  
**Last tested:** December 28, 2025  
**Status:** ✅ Production Ready
