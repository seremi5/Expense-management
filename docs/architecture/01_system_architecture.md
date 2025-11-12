# System Architecture: Expense Reimbursement System

## Document Overview

**Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: PACT Architect
**Status**: Draft for Review

This document defines the high-level architecture for the Expense Reimbursement System, a web application for managing expense submissions and reimbursements for a youth ministry organization in Catalonia.

---

## Executive Summary

The Expense Reimbursement System is a modern, cloud-native application designed to handle 40-200 monthly expense submissions from 20-40 volunteers. The system features automated OCR processing, admin review workflows, and email notifications, all delivered through a mobile-friendly Catalan interface.

**Key Performance Targets**:
- Page load: <1 second
- Submission time: <3 seconds (including OCR)
- Uptime: 99.5% target
- Monthly infrastructure cost: €5-7

**Core Technology Stack**:
- Frontend: React 18 + Vite 5 + Tailwind CSS + shadcn/ui
- Backend: Node.js 20 + Express 4 + Drizzle ORM
- Database: PostgreSQL (Supabase)
- Storage: Cloudflare R2
- OCR: OpenAI GPT-4o Vision API
- Email: Resend with React Email
- Deployment: Vercel (frontend) + Railway (backend)

---

## 1. System Context Diagram

### External Systems and Actors

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPENSE REIMBURSEMENT SYSTEM                │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Frontend   │      │   Backend    │      │   Database   │ │
│  │  (Vercel)    │─────▶│  (Railway)   │─────▶│  (Supabase)  │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                     │                                 │
│         │                     ├──────▶ Cloudflare R2 (Storage) │
│         │                     ├──────▶ OpenAI (OCR)            │
│         │                     └──────▶ Resend (Email)          │
└─────────────────────────────────────────────────────────────────┘
         ▲                     ▲
         │                     │
    ┌────┴────┐           ┌────┴────┐
    │ Users   │           │ Admins  │
    │ (20-40) │           │  (2-3)  │
    └─────────┘           └─────────┘
```

### External Dependencies

1. **Supabase PostgreSQL Database**
   - Purpose: Primary data storage, authentication
   - Connection: Pooled via Supavisor (port 6543)
   - Free tier: 500MB database

2. **Cloudflare R2 Object Storage**
   - Purpose: Receipt file storage
   - Connection: S3-compatible API
   - Free tier: 10GB storage

3. **OpenAI GPT-4o Vision API**
   - Purpose: Invoice OCR and data extraction
   - Connection: REST API over HTTPS
   - Cost: ~€0.007 per invoice

4. **Resend Email Service**
   - Purpose: Transactional email notifications
   - Connection: REST API over HTTPS
   - Free tier: 3,000 emails/month

5. **Vercel Edge Network**
   - Purpose: Frontend hosting and CDN
   - Free tier: Unlimited deployments

6. **Railway Platform**
   - Purpose: Backend hosting
   - Cost: ~$5/month usage-based

---

## 2. High-Level Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRESENTATION TIER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 SPA                                            │  │
│  │  - Vite 5 build system                                   │  │
│  │  - Tailwind CSS + shadcn/ui components                   │  │
│  │  - React Hook Form + Zod validation                      │  │
│  │  - React Router for navigation                           │  │
│  │  - Zustand for state management                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                      HTTPS/JSON                                 │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js 20 + Express 4 API Server                       │  │
│  │  - RESTful API endpoints                                 │  │
│  │  - JWT authentication middleware                         │  │
│  │  - Multer file upload handling                           │  │
│  │  - Rate limiting (express-rate-limit)                    │  │
│  │  - Helmet security headers                               │  │
│  │  - CORS middleware                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                      Database ORM                               │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA TIER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 15 (Supabase)                                │  │
│  │  - Drizzle ORM for type-safe queries                     │  │
│  │  - Row-Level Security (RLS) policies                     │  │
│  │  - Automatic backups (Pro plan)                          │  │
│  │  - Connection pooling (Supavisor)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### Core Components

#### 3.1 Frontend Application (React SPA)

**Responsibilities**:
- User interface rendering
- Form validation and submission
- File upload management
- Client-side routing
- State management
- API communication

**Key Modules**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/           # Expense submission forms
│   │   ├── tables/          # Data tables with filtering
│   │   └── layout/          # App shell, navigation
│   ├── pages/
│   │   ├── Dashboard.tsx    # User expense list
│   │   ├── NewExpense.tsx   # Submission form
│   │   ├── ExpenseDetail.tsx# Single expense view
│   │   ├── AdminPanel.tsx   # Admin dashboard
│   │   └── Login.tsx        # Authentication
│   ├── hooks/
│   │   ├── useAuth.ts       # Authentication state
│   │   ├── useExpenses.ts   # Expense data fetching
│   │   └── useFileUpload.ts # File upload logic
│   ├── services/
│   │   ├── api.ts           # API client
│   │   └── auth.ts          # Auth service
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Helper functions
│   └── types/
│       └── index.ts         # TypeScript types
```

**Technology Choices**:
- **Vite 5**: Fast development builds, HMR <50ms
- **React Hook Form**: Minimal re-renders, excellent performance
- **Zod**: Runtime type validation matching DB schema
- **Zustand**: Lightweight state management (<1KB)
- **TanStack Query**: Server state caching and synchronization

#### 3.2 Backend API (Node.js + Express)

**Responsibilities**:
- RESTful API endpoints
- Authentication and authorization
- Business logic execution
- Database operations via ORM
- File upload orchestration
- OCR processing coordination
- Email notification sending

**Key Modules**:
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # Login, signup, token refresh
│   │   ├── expenses.ts      # CRUD operations
│   │   ├── admin.ts         # Admin endpoints
│   │   ├── upload.ts        # File upload handling
│   │   └── health.ts        # Health check
│   ├── middleware/
│   │   ├── authenticate.ts  # JWT verification
│   │   ├── authorize.ts     # Role-based access
│   │   ├── validate.ts      # Request validation
│   │   └── error.ts         # Error handling
│   ├── services/
│   │   ├── expense.ts       # Business logic
│   │   ├── ocr.ts           # OCR integration
│   │   ├── storage.ts       # R2 operations
│   │   └── email.ts         # Email sending
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema
│   │   └── index.ts         # DB connection
│   └── lib/
│       ├── jwt.ts           # Token management
│       ├── r2.ts            # R2 client
│       ├── openai.ts        # OpenAI client
│       └── resend.ts        # Email client
```

**Technology Choices**:
- **Express 4**: Battle-tested, extensive middleware ecosystem
- **Drizzle ORM**: Lightweight, type-safe, excellent PostgreSQL support
- **bcrypt**: Industry-standard password hashing (12 rounds)
- **jsonwebtoken**: JWT authentication with RS256 algorithm

#### 3.3 Database (PostgreSQL)

**Responsibilities**:
- Persistent data storage
- Data integrity enforcement
- Query optimization
- Row-level security
- Audit logging

**Core Tables** (see `02_database_schema.md` for details):
- `profiles`: User information
- `expenses`: Expense submissions
- `expense_line_items`: Invoice line items
- `audit_log`: Change tracking

**Access Patterns**:
- Connection pooling via Supavisor (transaction mode, port 6543)
- Maximum 10 connections per backend instance
- Prepared statements for all queries
- Indexed queries for common filters

#### 3.4 File Storage (Cloudflare R2)

**Responsibilities**:
- Receipt file storage
- Presigned URL generation
- File deletion

**Storage Structure**:
```
receipts/
└── {userId}/
    ├── drafts/
    │   └── {uuid}.{ext}
    └── {expenseId}/
        ├── {uuid}.{ext}        # Original
        └── {uuid}-thumb.jpg    # Thumbnail
```

**Access Pattern**:
- Direct upload via presigned PUT URLs (5-minute expiry)
- Download via presigned GET URLs (15-minute expiry)
- S3-compatible API using AWS SDK v3

#### 3.5 OCR Service (OpenAI Integration)

**Responsibilities**:
- Invoice image analysis
- Structured data extraction
- Confidence scoring
- Catalan language support

**Processing Flow**:
1. Receive uploaded receipt
2. Upload to R2 and get URL
3. Send to OpenAI GPT-4o Vision
4. Parse JSON response
5. Validate extracted data
6. Return to client with confidence scores

**Cost Optimization**:
- Use GPT-4o Mini for simple receipts (94% cheaper)
- Low-detail mode for clear scans (88% token reduction)
- Prompt caching for system instructions (50% discount)

#### 3.6 Email Service (Resend)

**Responsibilities**:
- Transactional email sending
- Template rendering
- Delivery tracking

**Email Types**:
1. Expense submitted confirmation
2. Admin review request
3. Expense approved notification
4. Expense declined notification
5. Password reset

**Templates**: React Email components with Catalan localization

---

## 4. Data Flow Diagrams

### 4.1 Expense Submission Flow

```
User                Frontend            Backend             R2      OpenAI    Database    Resend
 │                     │                   │                 │         │         │          │
 ├─ Fill form ────────▶│                   │                 │         │         │          │
 │                     │                   │                 │         │         │          │
 ├─ Upload receipt ───▶│                   │                 │         │         │          │
 │                     │                   │                 │         │         │          │
 │                     ├─ POST /upload ───▶│                 │         │         │          │
 │                     │                   │                 │         │         │          │
 │                     │                   ├─ Upload file ──▶│         │         │          │
 │                     │                   │◀─ File URL ─────┤         │         │          │
 │                     │                   │                 │         │         │          │
 │                     │                   ├─ Extract data ──────────▶│         │          │
 │                     │                   │◀─ JSON data ─────────────┤         │          │
 │                     │                   │                 │         │         │          │
 │                     │◀─ OCR data ───────┤                 │         │         │          │
 │                     │                   │                 │         │         │          │
 ├─ Review/Edit ──────▶│                   │                 │         │         │          │
 │                     │                   │                 │         │         │          │
 ├─ Submit ───────────▶│                   │                 │         │         │          │
 │                     │                   │                 │         │         │          │
 │                     ├─ POST /expenses ─▶│                 │         │         │          │
 │                     │                   │                 │         │         │          │
 │                     │                   ├─ Insert ────────────────────────▶│          │
 │                     │                   │◀─ Expense ──────────────────────┤          │
 │                     │                   │                 │         │         │          │
 │                     │                   ├─ Send confirmation ─────────────────────────▶│
 │                     │                   ├─ Send admin alert ──────────────────────────▶│
 │                     │                   │                 │         │         │          │
 │                     │◀─ Success ────────┤                 │         │         │          │
 │                     │                   │                 │         │         │          │
 │◀─ Confirmation ─────┤                   │                 │         │         │          │
 │                     │                   │                 │         │         │          │
```

### 4.2 Admin Review Flow

```
Admin               Frontend            Backend           Database          Resend
 │                     │                   │                 │                │
 ├─ View pending ─────▶│                   │                 │                │
 │                     │                   │                 │                │
 │                     ├─ GET /admin/───▶│                 │                │
 │                     │    expenses       │                 │                │
 │                     │                   │                 │                │
 │                     │                   ├─ Query ────────▶│                │
 │                     │                   │◀─ List ─────────┤                │
 │                     │                   │                 │                │
 │                     │◀─ Expenses ───────┤                 │                │
 │                     │                   │                 │                │
 │◀─ Display list ─────┤                   │                 │                │
 │                     │                   │                 │                │
 ├─ Select expense ───▶│                   │                 │                │
 │                     │                   │                 │                │
 ├─ Approve/Decline ──▶│                   │                 │                │
 │                     │                   │                 │                │
 │                     ├─ PATCH /admin/───▶│                 │                │
 │                     │    expenses/:id   │                 │                │
 │                     │                   │                 │                │
 │                     │                   ├─ Update ───────▶│                │
 │                     │                   │                 │                │
 │                     │                   ├─ Log audit ────▶│                │
 │                     │                   │                 │                │
 │                     │                   ├─ Send notification ─────────────▶│
 │                     │                   │                 │                │
 │                     │◀─ Success ────────┤                 │                │
 │                     │                   │                 │                │
 │◀─ Confirmation ─────┤                   │                 │                │
 │                     │                   │                 │                │
```

---

## 5. Technology Stack Mapping

### Frontend Stack

| Component | Technology | Purpose | Alternatives Considered |
|-----------|------------|---------|------------------------|
| Framework | React 18 | UI library | Vue 3, Svelte |
| Build Tool | Vite 5 | Development/build | Create React App (deprecated) |
| Styling | Tailwind CSS 3 | Utility-first CSS | CSS Modules, Emotion |
| Component Library | shadcn/ui | Accessible components | Material-UI, Chakra UI |
| Forms | React Hook Form | Form management | Formik |
| Validation | Zod | Schema validation | Yup, Joi |
| State Management | Zustand | Global state | Redux, Jotai |
| Data Fetching | TanStack Query | Server state | SWR, Apollo |
| Routing | React Router v6 | Client routing | TanStack Router |
| Date Handling | date-fns | Date utilities | Day.js, Luxon |
| i18n | react-i18next | Catalan translations | Format.js |

### Backend Stack

| Component | Technology | Purpose | Alternatives Considered |
|-----------|------------|---------|------------------------|
| Runtime | Node.js 20 LTS | JavaScript runtime | Deno, Bun |
| Framework | Express 4 | Web framework | Fastify, Koa |
| ORM | Drizzle | Database queries | Prisma, TypeORM |
| Validation | Zod | Request validation | Joi, AJV |
| Authentication | JWT | Token-based auth | Session-based |
| Password Hashing | bcrypt | Security | Argon2 |
| File Upload | Multer | Multipart handling | Busboy |
| Rate Limiting | express-rate-limit | DDoS protection | bottleneck |
| Security Headers | Helmet | HTTP security | Manual config |
| CORS | cors | Cross-origin | Custom middleware |
| Logging | Winston | Structured logging | Pino, Morgan |

### Infrastructure Stack

| Component | Technology | Purpose | Monthly Cost |
|-----------|------------|---------|--------------|
| Database | Supabase PostgreSQL | Primary storage | €0 (Free tier) |
| File Storage | Cloudflare R2 | Receipt storage | €0 (Free tier) |
| OCR Service | OpenAI GPT-4o Vision | Data extraction | €0.51-0.71 |
| Email Service | Resend | Notifications | €0 (Free tier) |
| Frontend Hosting | Vercel | SPA deployment | €0 (Free tier) |
| Backend Hosting | Railway | API server | €4.65 ($5) |
| Monitoring | Sentry (optional) | Error tracking | €0 (Free tier) |
| **Total** | | | **~€5-7/month** |

---

## 6. Network Topology

### Production Network Architecture

```
                        Internet
                           │
                           │
              ┌────────────┴────────────┐
              │                         │
         HTTPS (443)                HTTPS (443)
              │                         │
              ▼                         ▼
     ┌────────────────┐        ┌────────────────┐
     │  Vercel Edge   │        │  Railway       │
     │  Network       │        │  Load Balancer │
     │  (Frontend)    │        │  (Backend)     │
     └────────┬───────┘        └────────┬───────┘
              │                         │
         CDN Caching              Rate Limiting
              │                         │
              ▼                         ▼
     ┌────────────────┐        ┌────────────────┐
     │  Static Files  │        │  Express App   │
     │  (HTML, JS,    │        │  (Node.js)     │
     │   CSS, Images) │        │                │
     └────────────────┘        └────────┬───────┘
                                        │
                       ┌────────────────┼────────────────┐
                       │                │                │
                       ▼                ▼                ▼
              ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
              │  Supabase   │  │  Cloudflare │  │   OpenAI    │
              │  PostgreSQL │  │     R2      │  │   GPT-4o    │
              │  (Pooled)   │  │  (Storage)  │  │   Vision    │
              └─────────────┘  └─────────────┘  └─────────────┘
                                        │
                                        ▼
                               ┌─────────────┐
                               │   Resend    │
                               │   (Email)   │
                               └─────────────┘
```

### Security Boundaries

**Public Zone** (No Authentication Required):
- Static assets (CSS, JS, images)
- Login/signup pages
- Public landing page

**Private Zone** (Authentication Required):
- All API endpoints (except /auth/login, /auth/signup)
- User dashboard
- Expense submission form
- Receipt file access (presigned URLs)

**Admin Zone** (Admin Role Required):
- Admin dashboard
- Expense review endpoints
- User management
- System settings

**Service Zone** (Backend-to-Backend):
- Database connections (private network)
- R2 API (credentials in environment variables)
- OpenAI API (API key in environment variables)
- Resend API (API key in environment variables)

---

## 7. Scalability Considerations

### Current Scale (40-200 submissions/month)

**Expected Load**:
- Concurrent users: 5-10 peak
- API requests: ~1,000/day
- Database queries: ~5,000/day
- File uploads: ~200/month
- Email sends: ~800/month

**Infrastructure Capacity**:
- Vercel: Handles millions of requests/month
- Railway: $5 plan supports low-moderate traffic
- Supabase: Free tier supports 500 concurrent connections
- R2: Unlimited bandwidth, 10 million reads/month free

**Bottlenecks**: None expected at current scale

### Growth Path (500+ submissions/month)

**Scaling Strategies**:

1. **Horizontal Scaling (Backend)**
   - Railway auto-scales based on load
   - Add Redis for session storage
   - Implement worker queues for OCR processing

2. **Database Optimization**
   - Upgrade to Supabase Pro ($25/month) for better performance
   - Add read replicas if needed
   - Implement database connection pooling

3. **Caching Layer**
   - Add Redis for frequently accessed data
   - Implement CDN caching for static assets
   - Cache API responses with appropriate TTLs

4. **Asynchronous Processing**
   - Move OCR processing to background queue (BullMQ)
   - Batch email notifications
   - Implement webhook-based status updates

---

## 8. Disaster Recovery and High Availability

### Backup Strategy

**Database Backups**:
- **Frequency**: Daily automatic (Supabase Pro) or weekly manual (Free tier)
- **Retention**: 7 days (Pro) or manual management (Free tier)
- **Storage**: Cloudflare R2 encrypted bucket
- **Recovery Time Objective (RTO)**: 2 hours
- **Recovery Point Objective (RPO)**: 24 hours

**File Storage Backups**:
- **Frequency**: Continuous (R2 built-in durability)
- **Retention**: Indefinite for active expenses
- **Recovery**: Automatic failover across Cloudflare data centers

**Application Code**:
- **Version Control**: Git (GitHub)
- **Deployment Rollback**: One-click via Vercel/Railway
- **Config Backups**: Environment variables documented in 1Password

### Failover Procedures

**Frontend Failure**:
- Vercel provides automatic failover across edge locations
- No manual intervention required
- RTO: <1 minute

**Backend Failure**:
- Railway auto-restarts crashed containers
- Health check endpoint monitored every 30 seconds
- RTO: 2-5 minutes

**Database Failure**:
- Supabase provides automatic failover (Pro plan)
- Free tier requires manual intervention
- RTO: 15-30 minutes (manual restore from backup)

**External Service Failure**:
- **R2**: Automatic failover, no action needed
- **OpenAI**: Queue requests for retry, degrade to manual entry
- **Resend**: Queue emails for retry (up to 24 hours)

---

## 9. Security Architecture

### Defense in Depth

**Layer 1: Network Security**
- HTTPS enforced (TLS 1.3)
- HSTS headers with preload
- CSP headers to prevent XSS
- CORS restricted to known origins

**Layer 2: Application Security**
- JWT authentication with short-lived tokens (15 min)
- Refresh token rotation
- Rate limiting on all endpoints
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- XSS prevention (HTML sanitization)

**Layer 3: Data Security**
- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest (AES-256-GCM)
- Database-level Row-Level Security (RLS)
- Audit logging for all critical actions

**Layer 4: Infrastructure Security**
- Environment variables stored in platform secrets
- API keys rotated quarterly
- Principle of least privilege for service accounts
- Regular dependency updates (Dependabot)

### GDPR Compliance

**Data Subject Rights**:
- Right to access: `/api/gdpr/export` endpoint
- Right to erasure: `/api/gdpr/delete-account` endpoint
- Right to portability: JSON export functionality
- Right to rectification: User profile editing

**Data Minimization**:
- Only collect necessary fields
- Delete old audit logs after 2 years
- Purge deleted user data within 30 days

**Consent Management**:
- Explicit consent for data processing
- Audit trail of consent changes
- Withdrawal mechanism

---

## 10. Monitoring and Observability

### Key Metrics

**Application Metrics**:
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Throughput (requests/second)
- Active users (concurrent sessions)

**Business Metrics**:
- Expense submissions per day/week/month
- Average processing time
- Approval rate
- User satisfaction (future)

**Infrastructure Metrics**:
- CPU utilization
- Memory usage
- Database connection pool usage
- API response times

### Monitoring Tools

**Error Tracking**: Sentry
- Frontend errors
- Backend exceptions
- Performance monitoring

**Uptime Monitoring**: UptimeRobot (Free tier)
- Health check endpoint every 5 minutes
- Alert via email if down >1 minute

**Log Aggregation**: Winston + Railway logs
- Structured JSON logging
- 7-day retention

**Performance Monitoring**: Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

---

## 11. Development and Deployment Workflow

### Git Workflow

**Branching Strategy**:
```
main (production)
  └── develop (staging)
       ├── feature/expense-submission
       ├── feature/admin-dashboard
       └── bugfix/ocr-parsing
```

**Pull Request Process**:
1. Create feature branch from `develop`
2. Implement feature with tests
3. Open PR with description and screenshots
4. Automated checks run (linting, tests, build)
5. Code review by peer
6. Merge to `develop` (triggers preview deployment)
7. QA testing on preview environment
8. Merge to `main` (triggers production deployment)

### CI/CD Pipeline

**Continuous Integration** (GitHub Actions):
```
PR Created → Lint → Type Check → Unit Tests → Build → E2E Tests → Preview Deploy
```

**Continuous Deployment**:
```
Merge to main → Run Tests → Build → Deploy Frontend (Vercel) → Deploy Backend (Railway)
```

### Environment Strategy

| Environment | Purpose | Deployment | Database |
|-------------|---------|------------|----------|
| Development | Local dev | Manual | Local PostgreSQL or Supabase Dev |
| Preview | PR testing | Automatic (per PR) | Supabase Dev |
| Production | Live system | Automatic (main branch) | Supabase Production |

---

## 12. Cross-Cutting Concerns

### Logging Strategy

**Log Levels**:
- ERROR: System errors, exceptions
- WARN: Recoverable errors, deprecations
- INFO: Business events (submission, approval)
- DEBUG: Detailed debugging information

**Log Format** (JSON):
```json
{
  "timestamp": "2025-01-15T14:30:00.000Z",
  "level": "info",
  "message": "Expense submitted",
  "userId": "uuid",
  "expenseId": "uuid",
  "correlationId": "request-id",
  "metadata": {}
}
```

### Error Handling

**Frontend**:
- Global error boundary for React errors
- Toast notifications for user errors
- Retry logic for network failures
- Offline detection and messaging

**Backend**:
- Global error handler middleware
- Structured error responses
- Automatic Sentry reporting
- Graceful degradation

### Internationalization

**Primary Language**: Catalan (català)
- All UI text in Catalan
- Email templates in Catalan
- Date/number formatting for Spain locale

**Implementation**:
- react-i18next for frontend
- Spanish as fallback (optional future enhancement)
- Translation files in JSON format

---

## 13. Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | <1s | Lighthouse, Web Vitals |
| API Response Time | <500ms (p95) | Backend logs |
| Expense Submission | <3s (including OCR) | End-to-end timing |
| Dashboard Load | <1s | Frontend timing |
| File Upload | <2s (5MB file) | Upload progress tracking |

### Reliability

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.5% | UptimeRobot |
| Error Rate | <1% | Sentry |
| Data Loss | Zero | Database backups |

### Security

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| HTTPS Only | Enforced redirect | Manual test |
| Authentication | JWT with 15-min expiry | Code review |
| Authorization | RLS + middleware | Penetration test |
| Password Strength | 12+ chars, complexity | Zod validation |
| Data Encryption | AES-256-GCM | Security audit |

### Accessibility

| Standard | Target | Testing |
|----------|--------|---------|
| WCAG | 2.1 AA | axe DevTools |
| Keyboard Navigation | 100% | Manual test |
| Screen Reader | Compatible | NVDA/VoiceOver |
| Color Contrast | 4.5:1 minimum | Contrast checker |

---

## 14. Future Architecture Considerations

### Potential Enhancements

**Phase 2 (3-6 months)**:
- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Advanced reporting and analytics
- Multi-currency support

**Phase 3 (6-12 months)**:
- AI-powered expense categorization
- Fraud detection
- Integration with accounting software (e.g., Sage, QuickBooks)
- Advanced approval workflows

**Technical Debt to Address**:
- Implement proper feature flags
- Add comprehensive E2E test suite
- Set up staging environment
- Implement blue-green deployments

---

## 15. Architecture Decision Records

### ADR-001: Use Drizzle ORM over Prisma

**Status**: Accepted
**Date**: 2025-01-15

**Context**: Need type-safe database access with good PostgreSQL support.

**Decision**: Use Drizzle ORM instead of Prisma.

**Rationale**:
- Lightweight (~7KB vs Prisma's larger footprint)
- SQL-first approach with better query control
- No query engine required (serverless-friendly)
- Better performance for simple queries
- Lower learning curve for developers familiar with SQL

**Consequences**:
- Less mature ecosystem than Prisma
- Fewer GUI tools
- Manual migration management required

### ADR-002: Use OpenAI GPT-4o Vision for OCR

**Status**: Accepted
**Date**: 2025-01-15

**Context**: Need reliable OCR for Catalan invoices with structured data extraction.

**Decision**: Use OpenAI GPT-4o Vision API instead of traditional OCR (Tesseract, Google Vision).

**Rationale**:
- Superior understanding of invoice structure
- Native Catalan language support
- Built-in data validation and formatting
- Direct JSON output (no post-processing)
- Cost-effective with optimization (<€1/month)

**Consequences**:
- Dependency on external API (requires internet)
- Rate limiting considerations
- Need fallback for API failures

### ADR-003: Deploy Frontend on Vercel

**Status**: Accepted
**Date**: 2025-01-15

**Context**: Need fast, reliable hosting for React SPA.

**Decision**: Deploy frontend on Vercel instead of Netlify, Railway, or self-hosting.

**Rationale**:
- Zero-configuration deployment for Vite
- Global edge network (low latency)
- Automatic HTTPS and SSL
- Generous free tier
- Excellent developer experience
- Preview deployments for PRs

**Consequences**:
- Vendor lock-in (mitigated by standard static hosting)
- Limited backend capabilities (use Railway for API)

---

## 16. Glossary

**Terms**:
- **OCR**: Optical Character Recognition - technology to extract text from images
- **RLS**: Row-Level Security - database-level access control
- **JWT**: JSON Web Token - stateless authentication token
- **CDN**: Content Delivery Network - distributed cache for static assets
- **SPA**: Single Page Application - client-side rendered web app
- **ORM**: Object-Relational Mapping - database abstraction layer
- **TLS**: Transport Layer Security - encryption protocol for HTTPS

**Acronyms**:
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **CORS**: Cross-Origin Resource Sharing
- **GDPR**: General Data Protection Regulation
- **WCAG**: Web Content Accessibility Guidelines

---

## 17. References

**External Documentation**:
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [OpenAI API](https://platform.openai.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)

**Internal Documentation**:
- `docs/preparation/` - All preparation phase documents
- `docs/architecture/02_database_schema.md` - Database design
- `docs/architecture/03_api_specification.md` - API contracts
- `docs/architecture/04_frontend_architecture.md` - Frontend structure
- `docs/architecture/05_backend_architecture.md` - Backend structure

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | PACT Architect | Initial architecture specification |

---

**Next Steps**: Review this architecture with stakeholders, then proceed to detailed component architecture documents.
