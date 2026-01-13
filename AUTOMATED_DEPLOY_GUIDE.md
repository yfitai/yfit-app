# Automated Deployment Guide

**One command to deploy everything!**

---

## 🚀 Quick Start

### **Deploy with automatic version increment:**

```powershell
.\deploy-yfit.ps1 -Message "Your change description"
```

**That's it!** The script automatically:
- ✅ Increments build number
- ✅ Updates version.json
- ✅ Updates CHANGELOG.md
- ✅ Builds the app
- ✅ Commits to Git
- ✅ Pushes to GitHub
- ✅ Triggers Vercel deployment

---

## 📋 Examples

### **Bug Fix (Patch Version):**

```powershell
.\deploy-yfit.ps1 -Message "Fixed date picker display on Android"
```

**Result:** `1.0.2` → `1.0.3`, Build `3` → `4`

---

### **New Feature (Minor Version):**

```powershell
.\deploy-yfit.ps1 -Message "Added meal templates" -VersionType minor
```

**Result:** `1.0.3` → `1.1.0`, Build `4` → `5`

---

### **Major Update (Major Version):**

```powershell
.\deploy-yfit.ps1 -Message "Complete UI redesign" -VersionType major
```

**Result:** `1.1.0` → `2.0.0`, Build `5` → `6`

---

## 🎯 Version Types

| Type | When to Use | Example |
|------|-------------|---------|
| **patch** (default) | Bug fixes, small tweaks | Fixed button color |
| **minor** | New features, improvements | Added new page |
| **major** | Breaking changes, redesigns | New architecture |

---

## 📊 What the Script Does

### **Step-by-Step:**

1. **Reads current version** from `version.json`
   ```
   Current: v1.0.2 (Build 3)
   ```

2. **Increments version** based on type
   ```
   New: v1.0.3 (Build 4)
   ```

3. **Updates version.json**
   ```json
   {
     "version": "1.0.3",
     "timestamp": "2026-01-13T20:00:00Z",
     "buildNumber": 4
   }
   ```

4. **Updates CHANGELOG.md**
   ```markdown
   ## [1.0.3] - Build 4 - 2026-01-13 20:00
   
   **Changes:**
   - Fixed date picker display on Android
   ```

5. **Builds the app**
   ```
   npm run build
   ```

6. **Commits to Git**
   ```
   git commit -m "v1.0.3 (Build 4): Fixed date picker display on Android"
   ```

7. **Pushes to GitHub**
   ```
   git push origin main
   ```

8. **Shows summary**
   ```
   ✨ Deployment Complete! ✨
   Version: v1.0.3
   Build: 4
   ```

---

## 📝 CHANGELOG.md

The script automatically maintains a changelog:

```markdown
# YFIT Deployment Changelog

## [1.0.3] - Build 4 - 2026-01-13 20:00

**Changes:**
- Fixed date picker display on Android

---

## [1.0.2] - Build 3 - 2026-01-13 19:00

**Changes:**
- Removed test banner
- Added deployment documentation

---
```

**Benefits:**
- ✅ Track all deployments
- ✅ See what changed when
- ✅ Share with beta testers
- ✅ Automatic documentation

---

## ⏱️ Timeline

```
Run script (5 seconds)
    ↓
Build completes (15 seconds)
    ↓
Push to GitHub (2 seconds)
    ↓
Vercel deploys (2-3 minutes)
    ↓
Desktop: Updates immediately
Android: Updates within 30 seconds
    ↓
Done! ✅
```

**Total time:** ~3-4 minutes from command to live

---

## 🎨 Script Output

```
🚀 YFIT Automated Deployment

📖 Reading current version...
   Current: v1.0.2 (Build 3)

🔢 Incrementing version...
   New: v1.0.3 (Build 4)

💾 Updating version.json...
   ✅ version.json updated

📝 Updating changelog...
   ✅ CHANGELOG.md updated

🔨 Building application...
   ✅ Build successful

📤 Committing and pushing to GitHub...
   ✅ Pushed to GitHub

✨ Deployment Complete! ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version:    v1.0.3
Build:      4
Message:    Fixed date picker display on Android
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Timeline:
   • Vercel deployment: 2-3 minutes
   • Desktop updates: Immediately
   • Android updates: Within 30 seconds

🔗 Check deployment:
   • Vercel: https://vercel.com/dashboard
   • Live site: https://yfit-deploy.vercel.app

✅ Beta testers will receive this update automatically!
```

---

## 🔧 Advanced Usage

### **Check Current Version:**

```powershell
Get-Content public/version.json | ConvertFrom-Json
```

### **View Changelog:**

```powershell
Get-Content CHANGELOG.md
```

### **Dry Run (Test Without Deploying):**

Currently not supported, but you can:
1. Run the script
2. If something's wrong, undo with:
   ```powershell
   git reset --soft HEAD~1
   git restore --staged .
   ```

---

## 📚 Comparison: Before vs After

### **Before (Manual):**

```powershell
# 1. Edit version.json manually
{
  "buildNumber": 4  # Remember to increment!
}

# 2. Edit CHANGELOG.md manually
## [1.0.3] - Build 4 - 2026-01-13
...

# 3. Build
npm run build

# 4. Commit
git add .
git commit -m "v1.0.3: Fixed something"

# 5. Push
git push origin main
```

**Steps:** 5  
**Time:** 2-3 minutes  
**Error-prone:** ✅ (easy to forget version increment)

---

### **After (Automated):**

```powershell
.\deploy-yfit.ps1 -Message "Fixed something"
```

**Steps:** 1  
**Time:** 30 seconds  
**Error-prone:** ❌ (automatic!)

---

## ✅ Benefits

### **For You:**
- ✅ One command deployment
- ✅ Automatic version management
- ✅ Automatic changelog
- ✅ No manual steps
- ✅ No version conflicts
- ✅ Consistent commit messages

### **For Beta Testers:**
- ✅ Clear version history
- ✅ Know what changed
- ✅ Automatic updates
- ✅ Professional experience

### **For Documentation:**
- ✅ Complete deployment history
- ✅ Searchable changelog
- ✅ Easy to share
- ✅ Audit trail

---

## 🎯 Best Practices

### **Commit Message Guidelines:**

```powershell
# Good:
.\deploy-yfit.ps1 -Message "Fixed date picker truncation on Android"
.\deploy-yfit.ps1 -Message "Added meal template library"
.\deploy-yfit.ps1 -Message "Improved form analysis accuracy"

# Bad:
.\deploy-yfit.ps1 -Message "fix"
.\deploy-yfit.ps1 -Message "updates"
.\deploy-yfit.ps1 -Message "stuff"
```

### **When to Use Each Version Type:**

**Patch (default):**
- Bug fixes
- UI tweaks
- Performance improvements
- Documentation updates

**Minor:**
- New features
- New pages
- New components
- Significant improvements

**Major:**
- Breaking changes
- Complete redesigns
- Architecture changes
- Major feature overhauls

---

## 🚨 Troubleshooting

### **Script Won't Run:**

```powershell
# Enable script execution
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### **Build Fails:**

The script will stop and show the error. Fix the code and run again.

### **Git Push Fails:**

Check your internet connection and GitHub credentials.

### **Version Conflict:**

If `version.json` was modified elsewhere:
1. Pull latest changes: `git pull`
2. Run script again

---

## 📖 Full Workflow Example

### **Scenario: Beta tester reports a bug**

1. **Fix the bug in code**
   ```javascript
   // Fixed the issue in NutritionEnhanced.jsx
   ```

2. **Deploy with one command**
   ```powershell
   .\deploy-yfit.ps1 -Message "Fixed nutrition date picker bug reported by beta testers"
   ```

3. **Script output**
   ```
   ✨ Deployment Complete! ✨
   Version: v1.0.4
   Build: 5
   ```

4. **Wait 3 minutes**
   - Vercel deploys
   - Desktop updates
   - Android updates automatically

5. **Notify beta testers (optional)**
   ```
   "Hey team! Just deployed v1.0.4 with the date picker fix. 
   Your apps will update automatically within 30 seconds!"
   ```

6. **Done!** ✅

---

## 🎉 Summary

**Old workflow:**
```
Edit version → Edit changelog → Build → Commit → Push
(5 steps, 2-3 minutes, error-prone)
```

**New workflow:**
```
.\deploy-yfit.ps1 -Message "Your change"
(1 step, 30 seconds, automatic!)
```

**Result:**
- ✅ Faster deployments
- ✅ No manual errors
- ✅ Complete history
- ✅ Professional workflow
- ✅ Happy beta testers!

---

**You're now ready to deploy with maximum efficiency!** 🚀
