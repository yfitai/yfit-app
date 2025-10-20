# Vercel Environment Variables for YFIT AI

## 📋 Required Environment Variables

Add these in Vercel when deploying your project:

### 1. VITE_SUPABASE_URL
**Value:** Your Supabase project URL

**Where to find it:**
1. Go to https://supabase.com/dashboard
2. Select your YFIT project
3. Click "Settings" (gear icon) in the left sidebar
4. Click "API"
5. Copy the URL under "Project URL"

**Example:** `https://abcdefghijklmnop.supabase.co`

---

### 2. VITE_SUPABASE_ANON_KEY
**Value:** Your Supabase anonymous/public key

**Where to find it:**
1. Same location as above (Settings → API)
2. Copy the key under "Project API keys" → "anon" / "public"
3. This is the public key (safe to use in frontend)

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)

---

### 3. VITE_USDA_API_KEY
**Value:** Your USDA FoodData Central API key

**Where to find it:**
- If you already have one, use it
- If not, get a free one at: https://fdc.nal.usda.gov/api-key-signup.html

**Note:** You can use `DEMO_KEY` for testing, but it has strict rate limits (1000 requests/hour)

**Example:** `your-usda-api-key-here` or `DEMO_KEY`

---

## 🔧 How to Add These in Vercel

### During Initial Deployment:

1. After selecting your repository, you'll see "Configure Project"
2. Scroll down to "Environment Variables"
3. For each variable:
   - **Name:** Enter the variable name exactly (e.g., `VITE_SUPABASE_URL`)
   - **Value:** Paste the value
   - **Environment:** Select "Production", "Preview", and "Development" (all three)
4. Click "Add" after each one
5. Continue with deployment

### After Deployment (Adding or Editing):

1. Go to your project in Vercel
2. Click "Settings"
3. Click "Environment Variables" in the left sidebar
4. Click "Add New"
5. Enter name and value
6. Select environments (Production, Preview, Development)
7. Click "Save"
8. **Redeploy** your project for changes to take effect

---

## ✅ Verification

After deployment, you can verify the environment variables are working:

1. Open your deployed app
2. Open browser console (F12)
3. Type: `import.meta.env.VITE_SUPABASE_URL`
4. You should see your Supabase URL (not undefined)

If you see `undefined`, the environment variables weren't set correctly.

---

## 🔒 Security Notes

- ✅ **VITE_SUPABASE_URL** - Safe to expose (public)
- ✅ **VITE_SUPABASE_ANON_KEY** - Safe to expose (public, has Row Level Security)
- ✅ **VITE_USDA_API_KEY** - Safe to expose (public API, rate-limited per key)

All these variables are prefixed with `VITE_` which means they're included in the frontend bundle. They're designed to be public and have appropriate security measures:

- Supabase uses Row Level Security (RLS) to protect data
- USDA API is public and rate-limited
- No sensitive data is exposed

---

## 📞 Need Your Keys?

If you need help finding your Supabase keys or USDA API key, let me know and I'll guide you through it!

