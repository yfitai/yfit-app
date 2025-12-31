# YFIT Project - Quick Reference Card

**Print this out or keep it handy!** 📋

---

## 🚀 First Time Setup (Once Per Task)

```bash
export GITHUB_TOKEN="your_github_token_here"
cd /home/ubuntu
git clone https://github.com/yfitai/yfit-app yfit
cd yfit
chmod +x setup-task.sh
./setup-task.sh
```

**Note:** Replace `your_github_token_here` with your actual token (see SETUP_INSTRUCTIONS.md)

---

## 🔄 Daily Workflow (Every Time)

### Starting Work
```bash
yfit-pull
```

### Finishing Work
```bash
yfit-push
```

**That's it!** Just two commands.

---

## 📋 Helpful Commands

| Command | What It Does |
|---------|-------------|
| `yfit` | Go to project directory |
| `yfit-pull` | Get latest changes from GitHub |
| `yfit-push` | Save and share your changes |
| `yfit-status` | Check what files changed |
| `yfit-log` | View recent commits |

---

## 🎯 Your 6 Tasks

| Icon | Task | When to Use |
|------|------|-------------|
| 🌍 | Language Translator | Translating app to other languages |
| ⭐ | Main App Development | Core features, bug fixes |
| 📱 | Android IOS Build & Deploy | Building APKs, testing |
| 📚 | Documentation | Writing guides, docs |
| 📱 | Social Media Assets | Graphics, content creation |
| 🌐 | Marketing Website | Landing page, pricing |

---

## ⚠️ Golden Rules

1. **ALWAYS** run `yfit-pull` when starting work
2. **ALWAYS** run `yfit-push` when finishing work
3. **NEVER** switch tasks without running `yfit-push` first
4. **CHECK** `yfit-status` before switching tasks

---

## 🚨 Emergency: "I Think I Lost Work!"

```bash
# Check if it's in GitHub
yfit-log

# Check if it's uncommitted
yfit-status

# If you see changes, save them:
yfit-push
```

**Your work is probably safe!** Check other tasks too.

---

## 📞 Need Help?

1. Check `TASK_SWITCHING_GUIDE.md` (full guide)
2. Check `YFIT_PROJECT_ORGANIZATION.md` (project info)
3. Ask in any Manus task

---

## 🔗 Important Links

- **GitHub:** https://github.com/yfitai/yfit-app
- **Web App:** https://yfit-deploy.vercel.app
- **Marketing:** https://yfitai.com

---

**Remember:** GitHub is your source of truth. Pull at start, push at end! 🎉
