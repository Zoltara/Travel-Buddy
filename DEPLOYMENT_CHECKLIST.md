# 🚀 Deployment Checklist

Run through this checklist before deploying to production:

## Pre-Deployment

- [ ] **Code Quality**
  - [ ] Run `pnpm typecheck` - all packages pass ✅
  - [ ] Run `pnpm lint` (if configured)
  - [ ] Test locally with `pnpm dev`
  - [ ] All 3 bug fixes verified:
    - [ ] Date calculation shows correct nights (not 31 for 3)
    - [ ] Currency selector defaults to local currency
    - [ ] Book Now links go to property pages (not homepage)

- [ ] **Environment Setup**
  - [ ] Neon database created
  - [ ] OpenRouter API key obtained
  - [ ] Database schema pushed: `cd apps/api && pnpm drizzle-kit push`

- [ ] **Git Repository**
  - [ ] Code committed to GitHub
  - [ ] `.env` file is NOT committed (check `.gitignore`)
  - [ ] Build cache cleaned (`pnpm clean` or delete `.next/`, `dist/`, `.turbo/`)

## API Deployment (Railway/Render/Fly.io)

- [ ] Service created and connected to GitHub repo
- [ ] Root directory set to `apps/api`
- [ ] Build command: `pnpm install && pnpm build`
- [ ] Start command: `node dist/index.js`
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `API_PORT=4000` (or Railway/Render auto-detected port)
  - [ ] `API_HOST=0.0.0.0`
  - [ ] `NEON_DATABASE_URL=postgresql://...`
  - [ ] `OPENROUTER_API_KEY=sk-or-v1-...`
  - [ ] `OPENROUTER_MODEL=openai/gpt-4o-mini`
- [ ] **Save API URL** (e.g. `https://your-app.up.railway.app`)
- [ ] Test health endpoint: `curl https://your-api-url/health`

## Web Deployment (Vercel)

- [ ] New project created and connected to GitHub repo
- [ ] Root directory set to `apps/web`
- [ ] Framework preset: Next.js
- [ ] Build command: `cd ../.. && pnpm turbo build --filter=@travel-buddy/web`
- [ ] Install command: `pnpm install`
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_API_URL=<your-railway-api-url>`
- [ ] Deployment successful
- [ ] **Save Web URL** (e.g. `https://travel-buddy.vercel.app`)

## Post-Deployment Testing

- [ ] **API Health Check**
  ```bash
  curl https://your-api-url.railway.app/health
  # Should return: {"status":"ok","timestamp":"..."}
  ```

- [ ] **Web App Smoke Test**
  - [ ] Homepage loads
  - [ ] Navigate to search wizard (4 steps):
    1. [ ] Location autocomplete works
    2. [ ] Date picker shows correct night count
    3. [ ] Currency selector shows options
    4. [ ] Priorities sliders respond
  - [ ] Search returns 3 results
  - [ ] Resort cards display:
    - [ ] Price in selected currency
    - [ ] "Why we picked this" text
    - [ ] 3 Pros, 2 Cons
    - [ ] Book Now button
  - [ ] Click "Book Now" → goes to property page (not homepage)

- [ ] **Currency Feature Test**
  - [ ] Select Thailand → currency defaults to THB
  - [ ] Change currency dropdown → prices update
  - [ ] Budget input converts correctly to USD internally

- [ ] **Error Monitoring**
  - [ ] Check Railway/Render logs for API errors
  - [ ] Check Vercel deployment logs for Next.js errors
  - [ ] Check browser console for client-side errors

## Ongoing Maintenance

- [ ] Set up alerts for:
  - [ ] API downtime (Railway/Render status)
  - [ ] High error rates (logs)
  - [ ] OpenRouter quota exceeded
- [ ] Monitor costs:
  - [ ] Railway/Render usage
  - [ ] Neon database size
  - [ ] OpenRouter API usage
  - [ ] Vercel bandwidth
- [ ] Regular updates:
  - [ ] Dependency updates (`pnpm update`)
  - [ ] Security patches
  - [ ] Database backups (Neon auto-backups on paid tier)

## Troubleshooting

If deployment fails, check:

1. **Module resolution errors**: Verify `vercel.json` buildCommand and `next.config.ts` transpilePackages
2. **API not responding**: Check environment variables and Railway/Render logs
3. **CORS errors**: Verify API URL in `NEXT_PUBLIC_API_URL`
4. **Database errors**: Confirm migrations ran and connection string is correct
5. **OpenRouter errors**: Check API key validity and quota limits

---

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
