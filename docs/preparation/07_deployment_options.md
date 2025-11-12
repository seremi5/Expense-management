# Deployment Options: Vercel, Railway, and CI/CD

## Executive Summary

This document provides comprehensive guidance on deploying the Expense Reimbursement System using modern cloud platforms. The recommended approach is **Vercel for frontend** (React) and **Railway for backend** (Node.js/Express), providing excellent developer experience, automatic scaling, and costs within the €2-22/month budget.

**Recommended Stack**:
- **Frontend**: Vercel (Free tier) - €0/month
- **Backend**: Railway ($5/month starter) - €4.65/month
- **Database**: Supabase (Free tier) - €0/month
- **Storage**: Cloudflare R2 (Free tier) - €0/month
- **Email**: Resend (Free tier) - €0/month
- **Total**: ~€5/month ✅

---

## 1. Vercel Frontend Deployment

### Why Vercel for Frontend?

- **Zero Config**: Deploy React/Vite apps instantly
- **Edge Network**: Global CDN with <100ms response times
- **Automatic HTTPS**: SSL certificates provisioned automatically
- **Preview Deployments**: Every PR gets a unique URL
- **Free Tier**: Unlimited deployments, 100 GB bandwidth/month

### Setup Vercel Project

**1. Install Vercel CLI**:
```bash
npm install -g vercel
```

**2. Login and Deploy**:
```bash
vercel login
cd frontend
vercel
```

**3. Configure Project**:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.up.railway.app/api/:path*"
    }
  ]
}
```

### Environment Variables

**In Vercel Dashboard**:
1. Project Settings → Environment Variables
2. Add variables:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=https://your-backend.up.railway.app
VITE_R2_PUBLIC_URL=https://receipts.yourdomain.com
```

**Environment-specific**:
- Production: Live site
- Preview: PR deployments
- Development: Local development

### Custom Domain

1. **Add Domain** in Vercel Dashboard
2. **Configure DNS**:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

3. **SSL**: Auto-provisioned by Vercel

---

## 2. Railway Backend Deployment

### Why Railway for Backend?

- **Usage-Based Pricing**: Pay only for what you use
- **PostgreSQL Support**: Built-in database option
- **Auto-Deploy**: Git push triggers deployment
- **Environment Management**: Easy env var management
- **Free Trial**: $5 credit to start

### Setup Railway Project

**1. Install Railway CLI**:
```bash
npm install -g @railway/cli
```

**2. Login and Initialize**:
```bash
railway login
cd backend
railway init
```

**3. Create railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment Variables

```bash
# Set via Railway CLI
railway variables set DATABASE_URL=postgresql://...
railway variables set SUPABASE_URL=https://...
railway variables set JWT_SECRET=your-secret-key
railway variables set CLOUDFLARE_ACCOUNT_ID=...
railway variables set RESEND_API_KEY=...
```

### Dockerfile (Optional, for more control)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

### Health Check Endpoint

```typescript
// routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})
```

---

## 3. Alternative: Render for Backend

### Render vs Railway Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Pricing | Usage-based (~$5/month) | Fixed tiers ($7/month) |
| Free Tier | $5 credit | 750 hours/month (sleeps after 15min) |
| Deploy Speed | Fast | Medium |
| Database | Add-on | Built-in PostgreSQL |
| Auto-sleep | No | Yes (free tier) |
| Best For | Production, always-on | Side projects, development |

### Render Setup

**render.yaml**:
```yaml
services:
  - type: web
    name: expense-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: expense-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: SUPABASE_URL
        sync: false

databases:
  - name: expense-db
    databaseName: expenses
    user: expense_user
```

---

## 4. CI/CD with GitHub Actions

### Workflow: Test → Build → Deploy

**.github/workflows/deploy.yml**:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: 'expense-backend'
```

### Pre-Deployment Checks

```yaml
# .github/workflows/checks.yml
name: Pre-deployment Checks

on:
  pull_request:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run type-check

  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
```

---

## 5. Database Migrations

### Migration Strategy

```typescript
// scripts/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL!

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql)

  console.log('Running migrations...')

  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('Migrations complete!')

  await sql.end()
}

runMigrations()
```

**package.json**:
```json
{
  "scripts": {
    "migrate": "tsx scripts/migrate.ts",
    "migrate:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg"
  }
}
```

**In Railway**:
1. Add build command: `npm run migrate && npm run build`
2. Or use separate migration service

---

## 6. Environment Management

### Multi-Environment Strategy

**Environments**:
1. **Development**: Local machine
2. **Staging**: Railway/Vercel preview
3. **Production**: Railway/Vercel production

### Environment Variable Management

```bash
# .env.example (committed to git)
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
RESEND_API_KEY=

# .env.local (local development, not committed)
DATABASE_URL=postgresql://localhost:5432/expenses_dev
SUPABASE_URL=https://xxx.supabase.co
JWT_SECRET=dev-secret-key-change-in-production

# .env.production (Railway/Vercel, not committed)
DATABASE_URL=postgresql://production-url
JWT_SECRET=strong-random-secret
```

### Secrets Management

**Using 1Password CLI**:
```bash
# Load secrets from 1Password
op inject -i .env.template -o .env
```

**Using GitHub Secrets**:
```yaml
- name: Create .env file
  run: |
    echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> .env
    echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
```

---

## 7. Monitoring and Logging

### Application Monitoring

**Sentry Integration** (Free tier: 5,000 errors/month):
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
})

// Error handler middleware
app.use(Sentry.Handlers.errorHandler())
```

### Log Management

```typescript
// lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, add file or service transport
  ],
})

export default logger

// Usage
logger.info('Expense submitted', { expenseId, userId })
logger.error('Database error', { error: error.message })
```

### Uptime Monitoring

**UptimeRobot** (Free tier: 50 monitors):
- Monitor: `https://your-backend.up.railway.app/health`
- Check interval: 5 minutes
- Alert contacts: email, SMS

---

## 8. Backup Strategy

### Database Backups

**Automated (Supabase Pro - $25/month)**:
- Daily automatic backups
- 7-day retention
- Point-in-time recovery

**Manual (Free tier)**:
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backups/backup_$DATE.sql.gz

# Upload to R2
aws s3 cp backups/backup_$DATE.sql.gz s3://backups/ --endpoint-url https://...
```

**GitHub Action for Weekly Backups**:
```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday at midnight

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} | gzip > backup.sql.gz

      - name: Upload to R2
        run: |
          # Upload using AWS CLI
```

---

## 9. Cost Optimization

### Monthly Cost Breakdown

**Free Tier Setup** (€0/month):
- Vercel: Free
- Railway: $5 trial credit
- Supabase: Free (under 500MB)
- R2: Free (under 10GB)
- Resend: Free (under 3,000 emails)

**Production Setup** (€5-7/month):
- Vercel: Free
- Railway: $5/month (€4.65)
- Supabase: Free or Pro $25
- R2: ~€0.15
- Resend: Free

**Cost Optimization Tips**:
1. Use Railway's usage-based pricing
2. Enable Vercel's automatic compression
3. Implement caching to reduce API calls
4. Use connection pooling (Supavisor)
5. Optimize database queries
6. Implement CDN for static assets

---

## 10. Disaster Recovery Plan

### Backup Recovery Procedure

**Database Recovery**:
```bash
# Restore from backup
gunzip -c backup_20250115.sql.gz | psql $DATABASE_URL
```

**Application Rollback**:
```bash
# Vercel
vercel rollback

# Railway
railway rollback
```

### Incident Response

1. **Detection**: Monitor alerts (Sentry, UptimeRobot)
2. **Assessment**: Check logs, identify scope
3. **Communication**: Update status page
4. **Recovery**: Rollback or hotfix
5. **Post-mortem**: Document and improve

---

## 11. Official Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Sentry**: https://docs.sentry.io

---

## 12. Next Steps for Architecture

The architecture team should design:
1. Deployment pipeline flow diagram
2. Environment promotion strategy
3. Feature flag system for gradual rollouts
4. Blue-green deployment procedure
5. Database migration rollback strategy
6. Monitoring dashboard design
7. On-call rotation and incident procedures
8. Performance budgets and alerts
