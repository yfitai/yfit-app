# YFIT Project - Task Setup Instructions

**Run this in each new Manus task to initialize the project**

---

## 🚀 Quick Setup (One Command)

Copy and paste this command into each new task:

```bash
export GITHUB_TOKEN="YOUR_TOKEN_HERE" && cd /home/ubuntu/yfit && chmod +x setup-task.sh && ./setup-task.sh
```

**Replace `YOUR_TOKEN_HERE` with your actual GitHub token**

---

## 📋 Step-by-Step Setup

If you prefer to do it manually:

### Step 1: Set GitHub Token

```bash
export GITHUB_TOKEN="YOUR_TOKEN_HERE"
```

### Step 2: Navigate and Run Setup

```bash
cd /home/ubuntu
git clone https://github.com/yfitai/yfit-app yfit
cd yfit
chmod +x setup-task.sh
./setup-task.sh
```

---

## ✅ After Setup

You'll have these commands available:

- `yfit` - Navigate to project
- `yfit-pull` - Get latest changes (run at START of work)
- `yfit-push` - Save and share changes (run at END of work)
- `yfit-status` - Check what changed
- `yfit-log` - View recent commits

---

## 🔄 Daily Workflow

```bash
# Morning - Start work
yfit-pull

# Work on your task
# (edit files, test, etc.)

# Evening - Finish work
yfit-push
```

---

## 🔐 Your GitHub Token

**Your token is saved securely.** When you run the setup command, it will be set automatically.

If you need to set it manually:
```bash
export GITHUB_TOKEN="your_token_here"
```

**Note:** The token is only stored in your local environment, never committed to GitHub.

---

## 📚 Full Documentation

For complete details, see:
- `TASK_SWITCHING_GUIDE.md` - Complete workflow guide
- `YFIT_PROJECT_ORGANIZATION.md` - Project overview

---

**Questions?** Just ask in any Manus task!
