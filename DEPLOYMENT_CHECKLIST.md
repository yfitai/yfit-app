# YFIT AI Deployment Checklist

## ✅ Pre-Deployment (Already Complete)

- [x] Database tables added to Supabase (12 new tables)
- [x] React app with all 86 components ready
- [x] USDA integration included
- [x] Git repository initialized
- [x] Folder structure verified and correct

---

## 📋 Deployment Steps (Do These Now)

### 1. Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Repository name: `yfit-app`
- [ ] Visibility: Public (recommended)
- [ ] Don't initialize with README, .gitignore, or license
- [ ] Click "Create repository"

### 2. Create GitHub Personal Access Token
- [ ] Go to https://github.com/settings/tokens/new
- [ ] Note: `YFIT Deployment`
- [ ] Expiration: 90 days (or your preference)
- [ ] Check: `repo` (this checks all repo permissions)
- [ ] Click "Generate token"
- [ ] **COPY AND SAVE THE TOKEN** (you can only see it once!)

### 3. Push Code to GitHub
- [ ] Download the deployment package to your computer
- [ ] Extract the ZIP file
- [ ] Open Terminal (Mac) or Git Bash (Windows)
- [ ] Navigate to the folder: `cd path/to/yfit-deploy`
- [ ] Run: `./DEPLOY.sh`
- [ ] Enter username: `yfitai`
- [ ] Enter password: **Paste your Personal Access Token**
- [ ] Wait for upload to complete

### 4. Deploy to Vercel
- [ ] Go to https://vercel.com
- [ ] Log in with GitHub
- [ ] Click "Add New..." → "Project"
- [ ] Select `yfit-app` repository
- [ ] Framework: Vite (should auto-detect)
- [ ] Don't click Deploy yet!

### 5. Add Environment Variables in Vercel
- [ ] Click "Environment Variables"
- [ ] Add `VITE_SUPABASE_URL` = (your Supabase project URL)
- [ ] Add `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
- [ ] Add `VITE_USDA_API_KEY` = (your USDA API key or `DEMO_KEY`)
- [ ] Make sure all three are added to Production, Preview, and Development

### 6. Deploy!
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build
- [ ] Click the deployment URL to test
- [ ] Verify app loads correctly

---

## 🎯 Post-Deployment (Next Phase)

### 7. Deploy Supabase Edge Functions
- [ ] Follow Edge Functions deployment guide
- [ ] Deploy 6 functions for backend automation
- [ ] Test each function

### 8. Configure Stripe Tax Collection
- [ ] Log into Stripe Dashboard
- [ ] Enable tax collection
- [ ] Configure tax settings (15 minutes)

### 9. Final Testing
- [ ] Test user registration
- [ ] Test USDA food search
- [ ] Test meal planning
- [ ] Test all major features
- [ ] Verify analytics tracking

---

## 🆘 Troubleshooting

### If GitHub push fails:
- Verify repository exists at https://github.com/yfitai/yfit-app
- Check that you're using Personal Access Token (not password)
- Ensure token has `repo` permissions

### If Vercel build fails:
- Check that all environment variables are added
- Verify Supabase URL and keys are correct
- Check build logs for specific errors

### If app loads but features don't work:
- Verify environment variables in Vercel
- Check browser console for errors
- Verify Supabase connection

---

## 📞 Get Help

If stuck on any step:
1. Note which step number you're on
2. Copy any error messages
3. Take a screenshot if helpful
4. Ask for help!

---

## 🎉 Success Criteria

You'll know deployment is successful when:
- ✅ Code is visible on GitHub with correct folder structure
- ✅ Vercel deployment shows "Ready"
- ✅ App loads at your Vercel URL
- ✅ You can create an account
- ✅ USDA food search works
- ✅ Dashboard displays correctly

---

**Current Status:** Ready to deploy! Start with Step 1 above.

