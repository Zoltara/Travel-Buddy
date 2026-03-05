# 🎯 Quick Start: Deploy to GitHub + Vercel

This guide gets your Travel Buddy app live in ~15 minutes.

## Step 1: Initialize Git & Push to GitHub (3 min)

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit with your changes
git commit -m "feat: initial commit with bug fixes (date calc, currency, booking URLs)"

# Create a new repository on GitHub:
# Go to https://github.com/new → Name it "travel-buddy" → Create repository

# Link your local repo to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/travel-buddy.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Set Up Database (2 min)

1. Go to https://console.neon.tech → Sign up (free)
2. Click **"New Project"** → Name: `Travel Buddy`
3. Copy the **Connection String** (looks like `postgresql://user:pass@ep-xxx.neon.tech/...`)
4. Save it for Step 3

## Step 3: Get OpenRouter API Key (2 min)

1. Go to https://openrouter.ai → Sign up (free $1 credit)
2. Dashboard → **Keys** → **Create Key**
3. Copy the key (starts with `sk-or-v1-...`)
4. Save it for Step 3

## Step 4: Deploy API to Railway (4 min)

1. Go to https://railway.app → **Sign in with GitHub**
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `travel-buddy` repository
4. Railway detects monorepo automatically. Click **Configure**:
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
5. Click **Deploy Now**
6. Go to **Variables** tab:
   ```
   NODE_ENV=production
   API_PORT=4000
   API_HOST=0.0.0.0
   NEON_DATABASE_URL=<paste-your-neon-connection-string>
   OPENROUTER_API_KEY=<paste-your-openrouter-key>
   OPENROUTER_MODEL=openai/gpt-4o-mini
   ```
7. Click **Add Variables** → Railway restarts
8. Go to **Settings** → **Generate Domain** → Copy the URL (e.g. `https://yourapp.up.railway.app`)
9. Test health endpoint:
   ```bash
   curl https://yourapp.up.railway.app/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

**Save this API URL!** You'll need it for Vercel.

## Step 5: Run Database Migrations (1 min)

```powershell
# From your project root
cd apps/api

# Set your database URL
$env:NEON_DATABASE_URL="<your-neon-connection-string>"

# Push schema to database
pnpm drizzle-kit push

# Confirm when prompted
```

## Step 6: Deploy Web to Vercel (3 min)

1. Go to https://vercel.com → **Sign in with GitHub**
2. Click **"Add New Project"** → **Import** your `travel-buddy` repo
3. Vercel auto-detects Next.js. Configure:
   - **Root Directory**: `apps/web` (click **Edit**)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `cd ../.. && pnpm turbo build --filter=@travel-buddy/web`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next` (default)
4. Expand **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=<paste-your-railway-api-url-from-step-4>
   ```
   Example: `https://travel-buddy-api-production.up.railway.app`
5. Click **Deploy**
6. Wait ~2 minutes for build
7. Copy your Vercel URL (e.g. `https://travel-buddy.vercel.app`)

## Step 7: Test Your Live App! (2 min)

1. **Visit your Vercel URL** (from Step 6)
2. **Test the search flow**:
   - Enter: `Thailand` → `Phuket` → Select dates (try 3 nights)
   - Verify: Shows "3 nights" (not 31) ✅
   - Verify: Currency defaults to THB
   - Change currency to USD → prices update ✅
   - Complete wizard → see 3 resort results
   - Click **Book Now** → goes to property page (not homepage) ✅
3. **Check browser console** → No errors
4. **Check Railway logs** → API responding correctly

---

## 🎉 You're Live!

Your Travel Buddy app is now deployed:
- **Web App**: https://your-app.vercel.app
- **API**: https://your-api.railway.app

### Share it:
```
🗺️ Travel Buddy - Stop comparing 47 tabs. Get 3 perfect resort recommendations.
https://your-app.vercel.app
```

---

## 🔧 Troubleshooting

### "Module not found" on Vercel
- Check that `vercel.json` exists in repo root
- Verify `next.config.ts` has `transpilePackages: ['@travel-buddy/types']`
- Redeploy: `git commit --allow-empty -m "trigger rebuild" && git push`

### API returns 500 errors
- Check Railway logs: Dashboard → **View Logs**
- Verify environment variables are set correctly
- Ensure `NEON_DATABASE_URL` is valid and schema was pushed

### Currency not working
- Check `NEXT_PUBLIC_API_URL` is set in Vercel
- Verify API is responding: `curl https://your-api/health`
- Check browser console for CORS or network errors

### Booking links still go to homepage
- This was fixed in the code - clear browser cache
- Check OpenRouter is returning full URLs (Railway logs)

---

## 📚 More Info

- **Detailed Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Full Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Project README**: [README.md](./README.md)

---

## 💡 What Changed (Bug Fixes)

All 3 bugs are now fixed:

1. **✅ Date calculation**: Changed from local timezone to UTC-based date arithmetic
   - `diffNights()` function uses `Date.UTC()` for timezone-independent calculations
   - Applied in: web dates page, mobile dates page, API adapter

2. **✅ Currency selection**: Added 10 currencies with intelligent defaults
   - Created `packages/types/src/currency.ts` with conversion helpers
   - Auto-detects currency from selected country (Thailand → THB)
   - Dropdown (web) and chips (mobile) to change currency
   - All prices convert from internal USD to display currency
   - Applied in: search context, resort cards, results pages

3. **✅ Booking URL normalization**: Fixed homepage links
   - Added `normalizeBookingUrl()` in API adapter
   - Detects homepage URLs (e.g., `https://booking.com`)
   - Substitutes with platform-specific search URL including destination + dates
   - Applied in: OpenRouter adapter for all booking platforms

---

**Questions?** Open an issue on GitHub or check the detailed guides.
