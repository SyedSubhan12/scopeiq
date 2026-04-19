# Vercel Deployment Quick Reference

## 🚀 Deploy Your Frontend

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## ⚙️ Environment Variables to Set in Vercel Dashboard

Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

### Critical (MUST SET)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.railway.app` | **This fixes the 404 errors!** |
| `API_URL` | `https://your-api.railway.app` | Server-side API URL |
| `WEB_URL` | `https://scopeiq-web.vercel.app` | Your Vercel deployment URL |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase service role key |
| `DATABASE_URL` | `postgres://...` | Production database |
| `REDIS_URL` | `redis://...` | Production Redis |
| `ALLOWED_ORIGINS` | `https://scopeiq-web.vercel.app` | CORS allowed origins |
| `EMAIL_APPROVAL_SECRET` | (32+ random chars) | Security secret |

### Optional (Feature-Dependent)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks |
| `RESEND_API_KEY` | Email sending |
| `SENTRY_DSN` | Error tracking |
| `GEMINI_API_KEY` | AI features |

## 🔧 Deploy Your API Server

Your API server must be deployed separately from the frontend.

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy from project root
railway up
```

After deployment:
1. Note your API URL (e.g., `https://scopeiq-api.railway.app`)
2. Set `NEXT_PUBLIC_API_URL` in Vercel to this URL
3. Add `ALLOWED_ORIGINS` in Railway env vars: your Vercel URL

### Option 2: Render

1. Create new Web Service on Render
2. Point to your repo's `apps/api` directory
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `node dist/index.js`
5. Add all environment variables
6. Deploy!

## ✅ Pre-Deployment Checklist

- [ ] API server is deployed and accessible
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] `ALLOWED_ORIGINS` includes your Vercel URL
- [ ] All required env vars are configured
- [ ] Database is migrated to production
- [ ] Supabase project is set up
- [ ] CORS is configured properly
- [ ] Test login flow
- [ ] Test API endpoints from browser

## 🐛 Troubleshooting

### 404 Errors on `/v1/*` Endpoints

**Cause**: Frontend is calling Vercel instead of your API server.

**Fix**:
1. Check `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Verify it matches your actual API server URL
3. Redeploy after changing env vars

### CORS Errors

**Cause**: API server doesn't allow requests from your Vercel domain.

**Fix**:
1. Set `ALLOWED_ORIGINS` in API server env vars
2. Include your Vercel URL: `https://scopeiq-web.vercel.app`
3. Redeploy API server

### Auth Errors

**Cause**: Supabase credentials are incorrect or missing.

**Fix**:
1. Verify `SUPABASE_*` variables in Vercel
2. Check Supabase dashboard for issues
3. Ensure auth routes work: `https://your-api.com/auth/login`

## 📝 Environment Variable Commands

```bash
# View current Vercel env vars
vercel env ls

# Pull env vars from Vercel
vercel env pull

# Add env var to Vercel
vercel env add NEXT_PUBLIC_API_URL

# Remove env var from Vercel
vercel env rm NEXT_PUBLIC_API_URL
```

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
