# 🚀 Deployment Guide

This Travel Buddy app is a monorepo with separate frontend (Next.js) and backend (Fastify API) that need to be deployed independently.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: https://vercel.com (for web app)
3. **Railway/Render/Fly.io Account**: (for API) - Railway recommended for free tier
4. **Neon Database**: https://neon.tech (serverless Postgres)
5. **OpenRouter API Key**: https://openrouter.ai (for LLM-powered search)

---

## 1️⃣ Deploy the API (Backend)

### Option A: Railway (Recommended)

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `Travel Buddy` repository
4. Railway will auto-detect the monorepo. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
   - **Port**: Railway auto-detects from `process.env.PORT` (set to 4000 in env.ts)

5. **Add Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   API_PORT=4000
   API_HOST=0.0.0.0
   NEON_DATABASE_URL=<your-neon-connection-string>
   OPENROUTER_API_KEY=<your-openrouter-key>
   OPENROUTER_MODEL=openai/gpt-4o-mini
   ```

6. **Get your API URL**: After deployment, Railway gives you a URL like:
   ```
   https://travel-buddy-api-production.up.railway.app
   ```
   **Save this URL** - you'll need it for the web app!

### Option B: Render

1. Go to https://render.com → **New Web Service**
2. Connect your GitHub repo → Select `Travel Buddy`
3. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/index.js`
   - **Environment**: Add same variables as Railway above

### Option C: Fly.io

```bash
cd apps/api
fly launch
# Follow prompts, set environment variables with: fly secrets set KEY=value
```

---

## 2️⃣ Deploy the Web App (Frontend)

### Vercel Deployment

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"** → **Import Git Repository**
3. Select your `Travel Buddy` repository
4. Vercel auto-detects Next.js. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm turbo build --filter=@travel-buddy/web`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next` (default)

5. **Add Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url-from-step-1.railway.app
   ```
   ⚠️ **CRITICAL**: Replace with your actual API URL from Railway/Render/Fly.io!

6. Click **Deploy**!

7. After deployment, Vercel gives you a URL like:
   ```
   https://travel-buddy-web.vercel.app
   ```

---

## 3️⃣ Database Setup (Neon)

1. Go to https://console.neon.tech
2. Create a new project called `Travel Buddy`
3. Copy the **Connection String** from Project Dashboard:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/travelbuddy?sslmode=require
   ```
4. Run migrations (from local machine):
   ```bash
   cd apps/api
   export NEON_DATABASE_URL="<your-connection-string>"
   pnpm drizzle-kit push
   ```

---

## 4️⃣ Verify Deployment

1. **Check API Health**:
   ```bash
   curl https://your-api-url.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Web App**:
   - Visit your Vercel URL
   - Try a search flow (location → dates → type → priorities → results)
   - Verify currency selection works
   - Check "Book Now" links go to property pages

---

## 🔧 Monorepo Configuration

The `vercel.json` at the root tells Vercel how to build the web app in the monorepo context. The `turbo.json` orchestrates builds across packages.

### Package Dependencies:
```
apps/web → packages/types
apps/api → packages/types, packages/scoring
packages/scoring → packages/types
```

---

## 🛠️ Troubleshooting

### "Module not found" errors on Vercel:
- Make sure `vercel.json` buildCommand includes `cd ../.. && pnpm turbo build`
- Verify `next.config.ts` has `transpilePackages: ['@travel-buddy/types']`

### API not responding:
- Check Railway/Render logs for startup errors
- Verify `NEON_DATABASE_URL` is set correctly
- Ensure `OPENROUTER_API_KEY` is valid

### CORS errors:
- Add your Vercel domain to API CORS settings if needed (currently allows all origins)

### Currency not defaulting correctly:
- Check browser console for geolocation errors
- Fallback is USD if country detection fails

---

## 📦 Environment Variables Checklist

### API (Railway/Render):
- ✅ `NODE_ENV=production`
- ✅ `NEON_DATABASE_URL`
- ✅ `OPENROUTER_API_KEY`
- ✅ `OPENROUTER_MODEL` (optional, defaults to gpt-4o-mini)

### Web (Vercel):
- ✅ `NEXT_PUBLIC_API_URL` (your Railway/Render API URL)

---

## 🔄 Future Deployments

After initial setup, just push to GitHub:
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Vercel auto-deploys on push. Railway/Render auto-deploy if enabled (check dashboard settings).

---

## 💰 Cost Estimate (Free Tier)

- **Neon**: Free tier (0.5GB storage, 3 compute hours/month)
- **Railway**: $5/month credit (enough for API)
- **Vercel**: Free (100GB bandwidth, unlimited hobby projects)
- **OpenRouter**: Pay-per-use (~$0.15 per 1M tokens with gpt-4o-mini)

**Total**: ~$5-10/month depending on usage.
