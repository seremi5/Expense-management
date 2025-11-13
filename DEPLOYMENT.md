# Deployment Guide - Expense Management System

This guide covers deploying the Expense Management application to production using Railway (backend + database) and Vercel (frontend).

## Architecture Overview

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
│  React + Vite   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────┐
│  Railway        │──────│ PostgreSQL   │
│  (Backend)      │      │  Database    │
│  Node.js API    │      │  (Railway)   │
└─────────────────┘      └──────────────┘
```

## Prerequisites

- GitHub account with repo: `https://github.com/seremi5/Expense-management`
- Railway account (sign up at https://railway.app)
- Vercel account (sign up at https://vercel.com)
- Gemini API key (for OCR functionality)

## Part 1: Database Setup on Railway

### 1.1 Create PostgreSQL Database

1. Go to https://railway.app/new
2. Click "New Project"
3. Select "Provision PostgreSQL"
4. Railway will create a database with connection credentials

### 1.2 Note Database Credentials

Railway will provide:
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL` (full connection string)

Keep these for backend configuration.

## Part 2: Backend Deployment on Railway

### 2.1 Deploy Backend Service

1. In the same Railway project, click "New Service"
2. Select "GitHub Repo"
3. Choose `seremi5/Expense-management`
4. Railway will auto-detect the Node.js backend

### 2.2 Configure Build Settings

Railway should auto-detect, but verify:

**Root Directory:** `backend`
**Build Command:** `npm install && npm run build`
**Start Command:** `npm start`

### 2.3 Set Environment Variables

In Railway backend service, add these variables:

```bash
# Database (Auto-filled from Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=<generate-strong-random-secret>
# Generate with: openssl rand -base64 64

# CORS - Set to your Vercel domain
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Gemini API (for OCR)
GEMINI_API_KEY=<your-gemini-api-key>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Retry Configuration
MAX_RETRIES=3
RETRY_BASE_DELAY_MS=1000

# File Upload
MAX_FILE_SIZE_MB=10
```

### 2.4 Run Database Migrations

Once backend is deployed:

1. Open Railway backend service terminal
2. Run migrations:
   ```bash
   npm run db:push
   ```

This will create all necessary tables.

### 2.5 Get Backend URL

Railway will provide a public URL like:
`https://your-backend.up.railway.app`

Note this for frontend configuration.

## Part 3: Frontend Deployment on Vercel

### 3.1 Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import `seremi5/Expense-management`
3. Configure project settings

### 3.2 Project Configuration

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 3.3 Set Environment Variables

In Vercel project settings, add:

```bash
VITE_API_URL=https://your-backend.up.railway.app
```

**Important:** Replace with your actual Railway backend URL!

### 3.4 Deploy

Click "Deploy" - Vercel will:
1. Build the frontend
2. Deploy to CDN
3. Provide a production URL

## Part 4: Post-Deployment Setup

### 4.1 Update CORS Settings

Update Railway backend environment variables:

```bash
FRONTEND_URL=https://your-actual-app.vercel.app
ALLOWED_ORIGINS=https://your-actual-app.vercel.app
```

### 4.2 Create Admin User

Access your backend at: `https://your-backend.up.railway.app/api/health`

To create the first admin user, use a tool like Postman or curl:

```bash
curl -X POST https://your-backend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "name": "Admin User"
  }'
```

Then manually update the user's role in the database to 'admin':

```sql
-- Run in Railway PostgreSQL console
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

### 4.3 Test the Application

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try logging in with admin credentials
3. Test OCR upload functionality
4. Verify database persistence

## Part 5: Domain Configuration (Optional)

### 5.1 Custom Domain for Frontend

In Vercel:
1. Go to project Settings → Domains
2. Add your custom domain (e.g., `expenses.yourdomain.com`)
3. Configure DNS as instructed by Vercel

### 5.2 Custom Domain for Backend

In Railway:
1. Go to backend service Settings → Networking
2. Add custom domain (e.g., `api.expenses.yourdomain.com`)
3. Configure DNS with provided CNAME

Update frontend environment variable:
```bash
VITE_API_URL=https://api.expenses.yourdomain.com
```

## Part 6: Monitoring and Maintenance

### 6.1 Railway Monitoring

- View logs in Railway dashboard
- Set up alerts for errors
- Monitor database usage
- Check API response times

### 6.2 Vercel Analytics

- Enable Vercel Analytics in project settings
- Monitor page load times
- Track user sessions
- Review error logs

### 6.3 Database Backups

Railway automatically backs up PostgreSQL:
- Daily backups retained for 7 days
- Set up additional backup strategies if needed

## Troubleshooting

### Backend Won't Start
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure database is running
4. Check `npm start` works locally

### Frontend Shows API Errors
1. Verify `VITE_API_URL` is correct
2. Check CORS settings on backend
3. Verify backend is responding: `/api/health`
4. Check browser console for errors

### OCR Not Working
1. Verify `GEMINI_API_KEY` is set correctly
2. Check API key has sufficient quota
3. Review backend logs for Gemini errors
4. Ensure file size limits are appropriate

### Database Connection Issues
1. Check `DATABASE_URL` is correctly set
2. Verify Railway PostgreSQL is running
3. Check connection from backend logs
4. Try running migrations again

## Security Checklist

- [ ] Strong `JWT_SECRET` generated (64+ characters)
- [ ] `NODE_ENV=production` set
- [ ] CORS properly configured with specific origin
- [ ] Database credentials secured (Railway managed)
- [ ] HTTPS enforced (automatic with Railway/Vercel)
- [ ] Admin user created with strong password
- [ ] API rate limiting configured
- [ ] File upload size limits set
- [ ] Environment variables never committed to git

## Cost Estimate

**Railway (Backend + DB):**
- Hobby Plan: $5/month (includes $5 credit)
- Scales with usage

**Vercel (Frontend):**
- Free tier: Sufficient for small teams
- Pro: $20/month for production apps

**Gemini API:**
- Pay per use
- Estimate: ~$10-50/month depending on usage

**Total:** ~$5-75/month depending on usage and tier

## Rollback Procedure

If something goes wrong:

**Vercel (Frontend):**
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Railway (Backend):**
1. Go to Deployments tab
2. Select previous deployment
3. Click "Redeploy"

**Database:**
- Contact Railway support for backup restoration
- Or restore from your own backup if configured

## Next Steps

After deployment:
1. Monitor application for 24-48 hours
2. Test all critical workflows
3. Set up monitoring alerts
4. Document any deployment-specific configurations
5. Create runbook for common issues
6. Plan regular maintenance windows

## Support

- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Gemini API: https://ai.google.dev/docs
- Project issues: https://github.com/seremi5/Expense-management/issues
