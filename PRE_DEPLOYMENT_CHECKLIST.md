# Pre-Deployment Checklist

Complete this checklist before deploying to production.

## Prerequisites

- [ ] GitHub repository is up to date
- [ ] Railway account created (https://railway.app)
- [ ] Vercel account created (https://vercel.com)
- [ ] Gemini API key obtained (https://ai.google.dev)

## Backend Preparation

- [ ] Tests passing: `npm test` in backend directory
- [ ] Build succeeds: `npm run build` in backend directory
- [ ] Environment variables documented in `.env.production.example`
- [ ] Database migrations are up to date
- [ ] All dependencies in `package.json` are production-ready

## Frontend Preparation

- [ ] Build succeeds: `npm run build` in frontend directory
- [ ] Environment variables documented in `.env.production.example`
- [ ] API URL placeholder ready for configuration
- [ ] All dependencies in `package.json` are production-ready

## Security Review

- [ ] JWT_SECRET will be generated (64+ characters): `openssl rand -base64 64`
- [ ] No secrets committed to repository
- [ ] `.env` files are in `.gitignore`
- [ ] CORS origins will be properly configured
- [ ] Rate limiting is configured
- [ ] File upload size limits are set

## Database

- [ ] PostgreSQL will be provisioned on Railway
- [ ] Database migrations script is ready: `npm run db:push`
- [ ] Backup strategy understood (Railway auto-backups)

## Deployment Strategy

### Railway (Backend + Database)

1. **Database Setup**
   - [ ] Create new Railway project
   - [ ] Provision PostgreSQL
   - [ ] Note down DATABASE_URL variable

2. **Backend Service**
   - [ ] Deploy from GitHub repository
   - [ ] Set root directory to `backend`
   - [ ] Configure all environment variables from `.env.production.example`
   - [ ] Run database migrations
   - [ ] Test health endpoint: `/api/health`

### Vercel (Frontend)

1. **Frontend Setup**
   - [ ] Import GitHub repository
   - [ ] Set root directory to `frontend`
   - [ ] Configure environment variable: `VITE_API_URL`
   - [ ] Deploy and test

## Post-Deployment

- [ ] Update backend CORS settings with actual Vercel URL
- [ ] Create admin user via API
- [ ] Update admin user role in database
- [ ] Test complete user flow
- [ ] Test OCR functionality
- [ ] Monitor logs for errors

## Testing in Production

- [ ] Frontend loads correctly
- [ ] Login/Register works
- [ ] Expense creation works
- [ ] File upload works
- [ ] OCR extraction works
- [ ] Admin panel accessible
- [ ] Database persistence verified

## Monitoring Setup

- [ ] Railway logs accessible
- [ ] Vercel analytics enabled (optional)
- [ ] Error tracking configured
- [ ] Health check endpoint monitored

## Documentation

- [ ] DEPLOYMENT.md reviewed
- [ ] Team members have access to Railway/Vercel dashboards
- [ ] Environment variables documented securely
- [ ] Rollback procedure understood

## Rollback Plan

- [ ] Previous deployment identified
- [ ] Rollback procedure tested/understood
- [ ] Database backup confirmed
- [ ] Team notified of deployment window

## Final Checks

- [ ] All team members notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Support contact information ready
- [ ] Post-deployment monitoring plan in place

---

## Quick Command Reference

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Backend Build
```bash
cd backend
npm install
npm run build
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

### Generate JWT Secret
```bash
openssl rand -base64 64
```

### Database Migrations (Railway CLI or web terminal)
```bash
npm run db:push
```

### Create Admin User (after deployment)
```bash
curl -X POST https://your-backend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "name": "Admin User"
  }'
```

### Update User Role to Admin (Railway PostgreSQL console)
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

---

## Notes

- Railway provides automatic HTTPS
- Vercel provides automatic HTTPS
- Both platforms have generous free tiers for testing
- Environment variables should NEVER be committed to git
- Always use strong passwords for production admin accounts

## Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Gemini API Docs: https://ai.google.dev/docs
- Project Issues: https://github.com/seremi5/Expense-management/issues
