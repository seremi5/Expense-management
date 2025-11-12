# Expense Management - Frontend

React + TypeScript frontend for the Expense Reimbursement System.

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Backend API running on http://localhost:3000

### Installation
```bash
npm install
```

### Environment Setup
Create `.env.local`:
```bash
VITE_API_URL=http://localhost:3000/api
```

### Development
```bash
npm run dev
```
Starts dev server on http://localhost:5173

### Production Build
```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** + TypeScript
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **React Router v6** - Routing
- **TanStack Query v5** - Server state
- **Zustand** - Client state
- **React Hook Form + Zod** - Forms
- **Axios** - HTTP client
- **Radix UI** - Accessible primitives
- **Lucide React** - Icons

## Features

- ✅ User authentication (login/register)
- ✅ Expense submission form
- ✅ Expense list with stats
- ✅ Expense detail view
- ✅ Admin dashboard
- ✅ Profile page
- ✅ Mobile-first responsive design
- ✅ Catalan language UI
- ✅ Protected routes
- ✅ Error boundaries

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI components
│   ├── layout/          # Layout components
│   ├── features/        # Feature components
│   └── shared/          # Shared utilities
├── hooks/               # Custom React hooks
├── lib/                 # Utilities & API client
├── pages/               # Route pages
├── store/               # Zustand stores
├── styles/              # Global styles
└── types/               # TypeScript types
```

## Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Documentation

See `/docs/architecture/05_frontend_implementation_summary.md` for full implementation details.

## Notes

- All UI text is in Catalan
- Design uses sky blue (#0ea5e9) and orange (#f97316) colors
- Mobile-first responsive design
- File upload, OCR, and some admin features are placeholders for Phase 2

## Support

For issues or questions, refer to the implementation summary document or contact the development team.
