# Quick Deployment Guide

Fast-track deployment instructions for experienced developers.

## Prerequisites

- GitHub repo: `seremi5/Expense-management`
- Railway account
- Vercel account
- Gemini API key

## Step 1: Database (Railway)

```bash
# 1. Create Railway project → Provision PostgreSQL
# 2. Note DATABASE_URL from PostgreSQL service
```

## Step 2: Backend (Railway)

```bash
# 1. New Service → GitHub Repo → seremi5/Expense-management
# 2. Root Directory: backend
# 3. Add environment variables:
```

**Required Environment Variables:**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app  # Update after Vercel deploy
ALLOWED_ORIGINS=https://your-app.vercel.app  # Update after Vercel deploy
GEMINI_API_KEY=your-gemini-api-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_RETRIES=3
RETRY_BASE_DELAY_MS=1000
MAX_FILE_SIZE_MB=10
LOG_LEVEL=info
```

```bash
# 4. Deploy
# 5. Open terminal → Run: npm run db:push
# 6. Note backend URL: https://your-backend.up.railway.app
```

## Step 3: Frontend (Vercel)

```bash
# 1. Import GitHub Repo → seremi5/Expense-management
# 2. Framework: Vite
# 3. Root Directory: frontend
# 4. Add environment variable:
```

**Environment Variable:**
```bash
VITE_API_URL=https://your-backend.up.railway.app
```

```bash
# 5. Deploy
# 6. Note frontend URL: https://your-app.vercel.app
```

## Step 4: Update CORS

Go back to Railway backend → Environment Variables:

```bash
FRONTEND_URL=https://your-actual-app.vercel.app
ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

Redeploy backend.

## Step 5: Create Admin User

```bash
# Register first user
curl -X POST https://your-backend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "name": "Admin User"
  }'

# Update role to admin (Railway PostgreSQL console)
UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

## Step 6: Test

1. Visit https://your-app.vercel.app
2. Login with admin credentials
3. Test expense creation
4. Test OCR upload
5. Verify data persistence

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Railway logs, verify all env vars set |
| Frontend API errors | Verify VITE_API_URL, check backend /api/health |
| CORS errors | Update ALLOWED_ORIGINS with exact Vercel URL |
| OCR not working | Verify GEMINI_API_KEY, check backend logs |
| Database errors | Verify DATABASE_URL, re-run npm run db:push |

## Health Checks

```bash
# Backend
curl https://your-backend.up.railway.app/api/health

# Expected: 200 OK with database status
```

## Deployment Complete

Your expense management system is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.up.railway.app
- **Database**: Managed by Railway

**Next Steps:**
- Monitor Railway logs for errors
- Enable Vercel analytics
- Set up custom domains (optional)
- Configure additional admin users

See `DEPLOYMENT.md` for detailed documentation.
