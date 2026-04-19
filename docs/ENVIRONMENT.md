# Environment Configuration Guide

This guide explains how to configure ScopeIQ for local development vs production deployment.

## Quick Start

### Local Development

```bash
# 1. Copy the local example file
cp .env.local.example .env.local

# 2. Edit .env.local with your local credentials
# The symlinks in apps/web/.env and apps/api/.env will automatically use it

# 3. Start development servers
pnpm dev
```

### Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all variables from `.env.production` (see file for reference)
3. **Critical**: Set `NEXT_PUBLIC_API_URL` to your production API URL
4. Redeploy the application

---

## Environment Files Overview

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.local.example` | Local development template | ✅ Yes |
| `.env.local` | Your actual local config | ❌ No (gitignored) |
| `.env.production` | Production reference template | ✅ Yes (no secrets) |
| `.env` | Active symlinked file (auto-managed) | ❌ No |

---

## Critical Variables Explained

### `NEXT_PUBLIC_API_URL`

**This is the #1 cause of 404 errors in production!**

- **Local**: `http://localhost:4000`
- **Production**: Your actual API server URL (e.g., `https://api.scopeiq.app`)

The frontend uses this to know where to send API requests. If this is missing or incorrect, you'll see 404 errors for `/v1/*` endpoints.

### `ALLOWED_ORIGINS`

Controls CORS - which domains can access your API.

- **Local**: `http://localhost:3000`
- **Production**: `https://scopeiq-web.vercel.app,https://scopeiq.app`

### `DATABASE_URL`

- **Local**: `postgres://scopeiq:scopeiq_dev@localhost:5432/scopeiq`
- **Production**: Your production database connection string

### `SUPABASE_*` Variables

You need **3 keys**:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key (safe for frontend)
- `SUPABASE_SERVICE_ROLE_KEY`: Secret key (backend only!)

---

## Vercel Deployment Checklist

### Environment Variables to Set in Vercel

All variables from `.env.production` must be set in Vercel Dashboard:

**Required:**
- ✅ `NEXT_PUBLIC_API_URL` - Your production API URL
- ✅ `API_URL` - Same as above (for server-side calls)
- ✅ `WEB_URL` - Your Vercel deployment URL
- ✅ `SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_ANON_KEY` - Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- ✅ `DATABASE_URL` - Production database
- ✅ `REDIS_URL` - Production Redis
- ✅ `EMAIL_APPROVAL_SECRET` - 32+ char secret
- ✅ `ALLOWED_ORIGINS` - Your Vercel domain

**Optional (depending on features):**
- `STRIPE_SECRET_KEY` - If using payments
- `STRIPE_WEBHOOK_SECRET` - If using Stripe webhooks
- `RESEND_API_KEY` - If using email
- `SENTRY_DSN` - If using error tracking
- `GEMINI_API_KEY` - If using AI features

### API Server Deployment

Your API server (`apps/api`) must be deployed separately from the frontend. Options:

1. **Railway** (recommended for simplicity)
2. **Render**
3. **Fly.io**
4. **AWS/GCP/Azure**

After deploying the API:
1. Note the API URL (e.g., `https://scopeiq-api.railway.app`)
2. Set `NEXT_PUBLIC_API_URL` in Vercel to this URL
3. Update `ALLOWED_ORIGINS` in API server config to include your Vercel URL
4. Ensure CORS is properly configured

---

## Troubleshooting

### 404 Errors on `/v1/*` endpoints

**Problem**: Frontend can't reach the API server.

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. Verify your API server is running and accessible
3. Check browser DevTools Network tab - what URL is being requested?
4. The URL should be your API server, not `scopeiq-web.vercel.app`

### CORS Errors

**Problem**: Browser blocks requests due to CORS policy.

**Solution**:
1. Set `ALLOWED_ORIGINS` in API server config to include your frontend URL
2. Example: `ALLOWED_ORIGINS=https://scopeiq-web.vercel.app`

### "Missing or invalid Authorization header"

**Problem**: Auth token not being sent.

**Solution**:
1. Verify `SUPABASE_*` variables are set correctly
2. Check if user is logged in
3. Verify token in browser DevTools → Application → Local Storage

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Local Development               │
├─────────────────────────────────────────┤
│  Frontend: http://localhost:3000        │
│  Backend:  http://localhost:4000        │
│  Database: localhost:5432               │
│  Redis:    localhost:6379               │
│  MinIO:    localhost:9000               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Production Deployment           │
├─────────────────────────────────────────┤
│  Frontend: https://scopeiq-web.vercel.app│
│  Backend:  https://api.scopeiq.app      │
│  Database: Managed PostgreSQL           │
│  Redis:    Managed Redis                │
│  Storage:  S3/MinIO                     │
└─────────────────────────────────────────┘
```

The frontend and backend are **separate deployments** that communicate via HTTP.

---

## Local Development Setup Script

```bash
#!/bin/bash
# Run this to set up local development

# 1. Copy env template
cp .env.local.example .env.local

# 2. Create symlinks (if they don't exist)
ln -sf /home/syeds/scopeiq/.env.local apps/web/.env
ln -sf /home/syeds/scopeiq/.env.local apps/api/.env

# 3. Install dependencies
pnpm install

# 4. Start services
pnpm dev
```

---

## Security Notes

- ⚠️ **NEVER** commit `.env.local` or any file with real secrets to Git
- ⚠️ **ALWAYS** use different credentials for local vs production
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` should **NEVER** be in frontend code
- ✅ Use `.env.example` files to document required variables
- ✅ Rotate secrets regularly
- ✅ Use Vercel's encrypted environment variables for production
