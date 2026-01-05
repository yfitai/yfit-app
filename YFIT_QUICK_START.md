# YFIT - Quick Start Guide
**One-Page Reference for Daily Work**

---

## 🚀 **Start Your Day (Every Session)**

```bash
start-work
```

**What it does:**
- ✅ Pulls latest code from GitHub
- ✅ Shows you what's new
- ✅ Gets you ready to work

---

## 💾 **End Your Day (Every Session)**

```bash
end-work
```

**What it does:**
- ✅ Saves all your changes
- ✅ Pushes to GitHub automatically
- ✅ Shows confirmation

---

## 📂 **Project Structure**

```
/home/ubuntu/yfit/              ← Main YFIT App (everything)
├── src/                        ← React app code
├── android/                    ← Android build files
├── docs/                       ← Documentation
├── translations/               ← Language files
├── social-media/               ← Content & assets
└── YFIT_QUICK_START.md         ← This file!

/home/ubuntu/yfit-marketing/    ← Marketing Website (separate)
```

---

## 🎯 **Common Tasks**

### **1. Fix a Bug / Add Feature**
```bash
start-work                      # Pull latest
# Edit files in src/
end-work                        # Save changes
```

### **2. Build Android APK**
```bash
start-work                      # Get latest code
npm run build                   # Build web app
npx cap sync android            # Sync to Android
cd android
.\gradlew assembleDebug --no-daemon --max-workers=1
cd ..
# No end-work needed (no code changes)
```

### **3. Update Documentation**
```bash
start-work                      # Pull latest
# Edit files in docs/
end-work                        # Save changes
```

### **4. Add Translations**
```bash
start-work                      # Pull latest
# Edit files in translations/
end-work                        # Save changes
```

### **5. Add Social Media Content**
```bash
start-work                      # Pull latest
# Add files to social-media/
end-work                        # Save changes
```

---

## 🌐 **Marketing Website (Separate Project)**

### **Work on Marketing Site:**
```bash
# Just ask AI: "Save checkpoint for marketing website"
# AI will run: webdev_save_checkpoint
```

**Location:** `/home/ubuntu/yfit-marketing/`

---

## ❓ **Quick Commands Reference**

| Command | What It Does |
|---------|-------------|
| `start-work` | Pull latest, start session |
| `end-work` | Save all, push to GitHub |
| `check-status` | See what files changed |
| `view-history` | See recent commits |
| `go-to-project` | Navigate to /home/ubuntu/yfit |

---

## 🔄 **How Code Changes Sync**

### **When you make changes:**

1. Edit files in `/home/ubuntu/yfit/src/`
2. Run `end-work`
3. **Automatically:**
   - ✅ Web app updates (Vercel auto-deploys)
   - ✅ Code ready for Android build
   - ✅ All tasks can see changes

### **To update Android app:**

1. `start-work` (gets your code changes)
2. Build APK (see "Build Android APK" above)
3. Install on device

**One code change → Both web and Android updated!**

---

## 📱 **Android Build Commands**

**Full build process:**
```bash
start-work
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug --no-daemon --max-workers=1
cd ..
```

**Install on device:**
```bash
C:\Users\campb\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🚨 **Troubleshooting**

### **"I can't find my files!"**
```bash
go-to-project
ls -la
```

All your files are in `/home/ubuntu/yfit/`

### **"Did my changes save?"**
```bash
check-status
```

If you see "nothing to commit" → Everything is saved!

### **"I forgot to pull at start!"**
```bash
start-work
```

Run it anytime to get latest changes.

### **"Sandbox was reset!"**
```bash
start-work
```

This will restore everything from GitHub.

---

## 💡 **Pro Tips**

### **1. Always Pull First**
Start every session with `start-work` - even if you think nothing changed!

### **2. Save Often**
Don't wait until end of day. After completing a feature:
```bash
end-work
```

### **3. Check Before Switching**
Before switching to a different type of work:
```bash
check-status
```

If you see changes, run `end-work` first!

### **4. One Command = Everything Saved**
`end-work` saves:
- ✅ Code changes
- ✅ Documentation
- ✅ Translations
- ✅ Social media content
- ✅ Configuration files
- ✅ Everything!

---

## 🎯 **Daily Workflow Example**

### **Morning:**
```bash
start-work
```

### **During Day:**
- Fix bug in DailyTracker
- Update README
- Add Spanish translations
- Create social media post

### **Evening:**
```bash
end-work
```

**Done!** Everything is saved and synced.

---

## 📊 **What Gets Saved Where**

| What You're Working On | Where It Lives | How to Save |
|------------------------|----------------|-------------|
| App code (React/Ionic) | `/home/ubuntu/yfit/src/` | `end-work` |
| Android builds | `/home/ubuntu/yfit/android/` | `end-work` (if config changed) |
| Documentation | `/home/ubuntu/yfit/docs/` | `end-work` |
| Translations | `/home/ubuntu/yfit/translations/` | `end-work` |
| Social media | `/home/ubuntu/yfit/social-media/` | `end-work` |
| Marketing website | `/home/ubuntu/yfit-marketing/` | Ask AI to save checkpoint |

---

## 🔐 **Your Work is Safe**

### **Everything is backed up in:**
- ✅ GitHub: https://github.com/yfitai/yfit-app
- ✅ Vercel: https://yfit-deploy.vercel.app
- ✅ Manus: Marketing website checkpoints

### **If sandbox resets:**
1. Run `start-work`
2. Everything restores from GitHub
3. Continue working!

---

## 🌟 **Remember**

**Two commands to rule them all:**

```bash
start-work    # Beginning of session
end-work      # End of session
```

**That's it!** Everything else is just editing files and testing.

---

## 📞 **Need Help?**

**Ask AI:**
- "Show me what changed"
- "Save my work"
- "Pull latest code"
- "Build Android APK"
- "Where are my files?"

**AI knows what to do!**

---

**Last Updated:** December 31, 2025  
**Your GitHub:** https://github.com/yfitai/yfit-app  
**Your Web App:** https://yfit-deploy.vercel.app  
**Your Domain:** https://yfitai.com
