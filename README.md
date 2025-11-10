# Youth Ministry Expense Reimbursement System

AI-powered expense management system for Catalan youth ministry organizations.

## Features

- **OCR Extraction**: Automatic invoice data extraction using OpenAI GPT-4o Vision
- **Catalan-First**: Full interface in Catalan language
- **Three Workflow Types**: Reimbursable, Non-reimbursable, and Payable expenses
- **Admin Dashboard**: Manage submissions with inline editing and bulk actions
- **Email Notifications**: Automated confirmations and status updates
- **Bank Reconciliation**: Auto-match expenses with bank transactions (Phase 2)
- **Accounting Export**: Spanish accounting format CSV export

## Project Structure

```
Expense-management/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── .env.example
├── frontend/          # React + Vite web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   └── .env.example
└── docs/              # Documentation
```

## Tech Stack

**Frontend:**
- React 18 + Vite 5
- Tailwind CSS 3
- shadcn/ui components
- React Hook Form + Zod
- Zustand (state management)

**Backend:**
- Node.js 20 LTS
- Express 4
- Drizzle ORM
- PostgreSQL (Supabase)
- JWT authentication

**Infrastructure:**
- Frontend: Vercel
- Backend: Railway
- Database: Supabase
- Storage: Cloudflare R2
- OCR: OpenAI GPT-4o Vision
- Email: Resend

## Setup Instructions

### Prerequisites

- Node.js 20+ installed
- Git installed
- Accounts created: Supabase, Cloudflare, OpenAI, Resend

### 1. Clone Repository

```bash
git clone https://github.com/seremi5/Expense-management.git
cd Expense-management
git checkout development
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your backend URL
npm install
npm run dev
```

## Development Workflow

1. Always work on `development` branch
2. Create feature branches: `feature/task-name`
3. Test locally before pushing
4. Merge to `main` only when ready for production

## Sprint Progress

- [x] Sprint 0: Infrastructure Setup
- [ ] Sprint 1: Backend API Core
- [ ] Sprint 2: OCR Integration
- [ ] Sprint 3: Frontend Submission Form
- [ ] Sprint 4: Admin Dashboard
- [ ] Sprint 5: Email Notifications
- [ ] Sprint 6: Testing & Deployment

## Documentation

- **PRD**: See `/docs/EXPENSE_REIMBURSEMENT_SYSTEM_-_PRD.md`
- **Implementation Plan**: See `/docs/Implementation_Planning.md`
- **API Docs**: Coming soon
- **Architecture**: Coming soon

## Support

For questions or issues, contact: sreinami@gmail.com

## License

Private project - All rights reserved
