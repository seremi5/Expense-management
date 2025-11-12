# Frontend Architecture: Expense Reimbursement System

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: PACT Architect
**Status**: Ready for Implementation

---

## Executive Summary

This document defines the complete frontend architecture for the Expense Reimbursement System, a React-based single-page application optimized for mobile-first usage by youth ministry volunteers in Catalonia. The architecture emphasizes performance, accessibility, and developer experience while delivering a <3 second expense submission workflow.

**Key Architectural Decisions**:
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite 5 for fast development and optimized production builds
- **UI Library**: shadcn/ui (copy-paste components) + Radix UI primitives
- **State Management**: Zustand (global) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS 3 with custom design system
- **Routing**: React Router v6 with protected routes
- **Language**: Catalan-first with i18next

**Performance Targets**:
- Initial page load: <1 second
- Route transitions: <300ms
- Expense submission: <3 seconds (including OCR)
- Lighthouse score: 90+ (Performance, Accessibility, Best Practices)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Component Architecture](#2-component-architecture)
3. [State Management](#3-state-management)
4. [Routing & Navigation](#4-routing--navigation)
5. [API Integration](#5-api-integration)
6. [Authentication Flow](#6-authentication-flow)
7. [Page Layouts](#7-page-layouts)
8. [Form Architecture](#8-form-architecture)
9. [File Upload & OCR](#9-file-upload--ocr)
10. [Error Handling](#10-error-handling)
11. [Accessibility](#11-accessibility)
12. [Internationalization](#12-internationalization)
13. [Performance Optimization](#13-performance-optimization)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment)

---

## 1. Project Structure

### 1.1 Folder Organization

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── locales/              # i18next translation files
│       ├── ca/
│       │   └── common.json
│       └── es/
│           └── common.json
├── src/
│   ├── assets/               # Static assets (images, fonts)
│   │   ├── images/
│   │   └── fonts/
│   ├── components/           # All React components
│   │   ├── ui/              # shadcn/ui components (generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   │   ├── AppShell.tsx         # Main app container
│   │   │   ├── Header.tsx           # Top navigation
│   │   │   ├── MobileNav.tsx        # Bottom tab navigation
│   │   │   ├── Sidebar.tsx          # Desktop sidebar
│   │   │   ├── ProtectedRoute.tsx   # Auth wrapper
│   │   │   └── ErrorBoundary.tsx    # Error catching
│   │   ├── features/        # Feature-specific components
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── PasswordChangeForm.tsx
│   │   │   ├── expenses/
│   │   │   │   ├── ExpenseCard.tsx
│   │   │   │   ├── ExpenseList.tsx
│   │   │   │   ├── ExpenseDetail.tsx
│   │   │   │   ├── ExpenseForm.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── ReceiptUpload.tsx
│   │   │   │   └── LineItemEditor.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   ├── ExpenseTable.tsx
│   │   │   │   ├── StatCards.tsx
│   │   │   │   └── AuditLogViewer.tsx
│   │   │   └── profile/
│   │   │       ├── ProfileCard.tsx
│   │   │       ├── ProfileEditForm.tsx
│   │   │       └── SettingsPanel.tsx
│   │   └── shared/          # Shared/common components
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── SearchInput.tsx
│   │       ├── FilterBar.tsx
│   │       ├── DateRangePicker.tsx
│   │       └── ConfirmDialog.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts              # Authentication state
│   │   ├── useExpenses.ts          # Expense data fetching
│   │   ├── useExpenseMutation.ts   # Expense mutations
│   │   ├── useProfile.ts           # User profile
│   │   ├── useFileUpload.ts        # File upload logic
│   │   ├── useOCR.ts               # OCR processing
│   │   ├── useDebounce.ts          # Debounce utility
│   │   ├── useMediaQuery.ts        # Responsive breakpoints
│   │   └── useToast.ts             # Toast notifications
│   ├── lib/                 # Utility libraries
│   │   ├── api.ts                  # API client (Axios)
│   │   ├── queryClient.ts          # TanStack Query setup
│   │   ├── supabase.ts             # Supabase client
│   │   ├── utils.ts                # Generic utilities
│   │   ├── formatters.ts           # Date/currency formatters
│   │   ├── validators.ts           # Custom validators
│   │   └── constants.ts            # App constants
│   ├── pages/               # Route components
│   │   ├── HomePage.tsx            # Landing/dashboard
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx       # User expense list
│   │   ├── NewExpensePage.tsx      # Submission form
│   │   ├── ExpenseDetailPage.tsx   # Single expense view
│   │   ├── AdminPage.tsx           # Admin dashboard
│   │   ├── ProfilePage.tsx         # User settings
│   │   └── NotFoundPage.tsx
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts            # Auth state
│   │   ├── uiStore.ts              # UI state (modals, toasts)
│   │   └── filterStore.ts          # Filter preferences
│   ├── types/               # TypeScript types
│   │   ├── api.types.ts            # API response types
│   │   ├── expense.types.ts        # Expense domain types
│   │   ├── user.types.ts           # User domain types
│   │   └── form.types.ts           # Form data types
│   ├── styles/              # Global styles
│   │   ├── index.css               # Main styles + Tailwind
│   │   └── themes.css              # Color themes
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite types
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── components.json          # shadcn/ui config
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### 1.2 File Naming Conventions

**Components**: PascalCase with `.tsx` extension
- `ExpenseCard.tsx`
- `ProfileEditForm.tsx`
- `AdminDashboard.tsx`

**Hooks**: camelCase starting with `use`, `.ts` extension
- `useAuth.ts`
- `useExpenses.ts`
- `useFileUpload.ts`

**Types**: PascalCase with `.types.ts` suffix
- `api.types.ts`
- `expense.types.ts`

**Utilities**: camelCase with `.ts` extension
- `formatters.ts`
- `validators.ts`
- `constants.ts`

**Pages**: PascalCase with `Page` suffix
- `DashboardPage.tsx`
- `NewExpensePage.tsx`

### 1.3 Import Aliases

**Configured in `tsconfig.json` and `vite.config.ts`**:
```typescript
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

**Usage**:
```typescript
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/formatters'
import { ExpenseCard } from '@/components/features/expenses/ExpenseCard'
```

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
App
├── Router
│   ├── PublicLayout
│   │   ├── Header (public)
│   │   └── Routes
│   │       ├── LoginPage
│   │       └── RegisterPage
│   └── ProtectedLayout
│       ├── AppShell
│       │   ├── Header (authenticated)
│       │   ├── Sidebar (desktop)
│       │   ├── MobileNav (mobile)
│       │   └── Main Content Area
│       └── Routes
│           ├── DashboardPage
│           │   ├── StatCards
│           │   ├── FilterBar
│           │   └── ExpenseList
│           │       └── ExpenseCard[]
│           ├── NewExpensePage
│           │   ├── ExpenseForm
│           │   │   ├── ReceiptUpload
│           │   │   ├── Form Fields
│           │   │   └── LineItemEditor
│           │   └── FormActions
│           ├── ExpenseDetailPage
│           │   ├── ExpenseDetail
│           │   │   ├── ReceiptViewer
│           │   │   ├── DetailFields
│           │   │   └── StatusBadge
│           │   └── AuditLogViewer
│           ├── AdminPage (admin only)
│           │   ├── AdminDashboard
│           │   │   ├── StatCards
│           │   │   ├── ApprovalQueue
│           │   │   └── ExpenseTable
│           │   └── ActionButtons
│           └── ProfilePage
│               ├── ProfileCard
│               ├── ProfileEditForm
│               └── SettingsPanel
```

### 2.2 Component Categories

#### UI Components (`components/ui/`)
**Purpose**: Reusable, low-level UI primitives from shadcn/ui
**Characteristics**:
- Highly customizable via props
- Accessible by default (Radix UI)
- Styled with Tailwind CSS
- No business logic

**Key Components**:
- `Button`: All button variants
- `Input`, `Select`, `Textarea`: Form inputs
- `Card`: Container component
- `Badge`: Status indicators
- `Dialog`: Modals and alerts
- `Toast`: Notifications
- `Table`: Data tables
- `Skeleton`: Loading states

#### Layout Components (`components/layout/`)
**Purpose**: Structure and navigation
**Characteristics**:
- Define page structure
- Handle responsive behavior
- Manage navigation state

**Components**:

**AppShell.tsx**:
```typescript
interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="flex">
        {!isMobile && <Sidebar />}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  )
}
```

**MobileNav.tsx** (Bottom Tab Navigation):
```typescript
export function MobileNav() {
  const location = useLocation()
  const { user } = useAuth()

  const tabs = [
    { icon: Home, label: 'Inici', path: '/dashboard' },
    { icon: Receipt, label: 'Despeses', path: '/expenses' },
    { icon: PlusCircle, label: 'Nova', path: '/expenses/new' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ]

  if (user.role === 'admin') {
    tabs.splice(3, 0, { icon: Shield, label: 'Admin', path: '/admin' })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex flex-col items-center py-2 px-3 flex-1",
              location.pathname === tab.path
                ? "text-primary-600"
                : "text-gray-500"
            )}
          >
            <tab.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

**ProtectedRoute.tsx**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
```

**ErrorBoundary.tsx**:
```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Alguna cosa ha fallat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ho sentim, s'ha produït un error inesperat. Si us plau, refresca la pàgina.
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Refrescar pàgina
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Feature Components (`components/features/`)
**Purpose**: Domain-specific, business logic components
**Characteristics**:
- Contain business logic
- Connect to API/state
- Composed of UI components

**Key Feature Components**:

**ExpenseCard.tsx**:
```typescript
interface ExpenseCardProps {
  expense: Expense
  onClick?: () => void
}

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">
            {formatCurrency(expense.totalAmount)}
          </CardTitle>
          <CardDescription>{expense.vendorName}</CardDescription>
        </div>
        <StatusBadge status={expense.status} />
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(expense.invoiceDate)}
          </div>
          <div className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            {expense.referenceNumber}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**StatusBadge.tsx**:
```typescript
type ExpenseStatus = 'submitted' | 'ready_to_pay' | 'paid' | 'declined'

interface StatusBadgeProps {
  status: ExpenseStatus
}

const statusConfig = {
  submitted: {
    label: 'Pendent',
    variant: 'warning' as const,
    icon: Clock,
  },
  ready_to_pay: {
    label: 'Llest per pagar',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  paid: {
    label: 'Pagada',
    variant: 'success' as const,
    icon: DollarSign,
  },
  declined: {
    label: 'Denegada',
    variant: 'destructive' as const,
    icon: XCircle,
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
```

**ReceiptUpload.tsx**:
```typescript
interface ReceiptUploadProps {
  onUpload: (file: File) => void
  value?: string // File URL
  isLoading?: boolean
}

export function ReceiptUpload({ onUpload, value, isLoading }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Factura / Rebut</Label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment" // Mobile camera
        onChange={handleFileChange}
        className="hidden"
      />

      {!value && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Fer foto de la factura
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG o PDF (màxim 5MB)
          </p>
        </div>
      )}

      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full rounded-lg border border-gray-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white shadow-md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center text-sm text-gray-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processant factura...
        </div>
      )}
    </div>
  )
}
```

#### Shared Components (`components/shared/`)
**Purpose**: Reusable components used across features
**Characteristics**:
- Generic, not tied to specific domain
- Parameterized via props
- No direct API calls

**Components**:

**LoadingSpinner.tsx**:
```typescript
export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size])} />
    </div>
  )
}
```

**EmptyState.tsx**:
```typescript
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && <Icon className="h-16 w-16 text-gray-400 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

### 2.3 Component Design Patterns

**Compound Components** (for complex UI):
```typescript
// Usage
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Detalls</TabsTrigger>
    <TabsTrigger value="audit">Historial</TabsTrigger>
  </TabsList>
  <TabsContent value="details">
    <ExpenseDetails />
  </TabsContent>
  <TabsContent value="audit">
    <AuditLog />
  </TabsContent>
</Tabs>
```

**Render Props** (for flexible rendering):
```typescript
<ExpenseList
  renderItem={(expense) => (
    <ExpenseCard expense={expense} onClick={() => navigate(`/expenses/${expense.id}`)} />
  )}
  renderEmpty={() => (
    <EmptyState
      title="No tens despeses"
      action={<Button>Nova despesa</Button>}
    />
  )}
/>
```

**HOC Pattern** (for cross-cutting concerns):
```typescript
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { user, isLoading } = useAuth()

    if (isLoading) return <LoadingSpinner />
    if (!user) return <Navigate to="/login" />

    return <Component {...props} />
  }
}

// Usage
const ProtectedDashboard = withAuth(DashboardPage)
```

---

## 3. State Management

### 3.1 State Architecture

**Three-Layer State Management**:

1. **Server State** (TanStack Query)
   - API data (expenses, profiles)
   - Caching and synchronization
   - Background refetching

2. **Global Client State** (Zustand)
   - Authentication state
   - UI state (modals, toasts)
   - User preferences

3. **Local Component State** (React useState/useReducer)
   - Form state (React Hook Form)
   - UI interaction state
   - Temporary values

### 3.2 Zustand Stores

**authStore.ts**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'viewer'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

**uiStore.ts**:
```typescript
interface UIState {
  isSidebarOpen: boolean
  activeModal: string | null
  toast: {
    message: string
    type: 'success' | 'error' | 'info'
  } | null

  // Actions
  toggleSidebar: () => void
  openModal: (modalId: string) => void
  closeModal: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  toast: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),

  showToast: (message, type) => set({ toast: { message, type } }),

  hideToast: () => set({ toast: null }),
}))
```

**filterStore.ts** (Persist user filter preferences):
```typescript
interface FilterState {
  status: ExpenseStatus[]
  event: string[]
  category: string[]
  dateRange: { from?: Date; to?: Date }

  // Actions
  setStatusFilter: (status: ExpenseStatus[]) => void
  setEventFilter: (event: string[]) => void
  setCategoryFilter: (category: string[]) => void
  setDateRange: (range: { from?: Date; to?: Date }) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      status: [],
      event: [],
      category: [],
      dateRange: {},

      setStatusFilter: (status) => set({ status }),
      setEventFilter: (event) => set({ event }),
      setCategoryFilter: (category) => set({ category }),
      setDateRange: (dateRange) => set({ dateRange }),
      resetFilters: () => set({ status: [], event: [], category: [], dateRange: {} }),
    }),
    { name: 'filter-storage' }
  )
)
```

### 3.3 TanStack Query Setup

**lib/queryClient.ts**:
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

**Query Keys** (organized by feature):
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
    audit: (id: string) => ['expenses', 'audit', id] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
}
```

### 3.4 Custom Hooks for Data Fetching

**hooks/useExpenses.ts**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

interface UseExpensesOptions {
  status?: ExpenseStatus[]
  event?: string[]
  category?: string[]
  page?: number
  limit?: number
}

export function useExpenses(options: UseExpensesOptions = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.list(options),
    queryFn: async () => {
      const response = await api.get('/expenses', { params: options })
      return response.data
    },
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: async () => {
      const response = await api.get(`/expenses/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}
```

**hooks/useExpenseMutation.ts**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'

export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const response = await api.post('/expenses', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      toast({
        title: 'Despesa enviada!',
        description: 'Rebràs un email quan sigui revisada',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error?.message || 'No s\'ha pogut enviar la despesa',
      })
    },
  })
}

export function useUpdateExpenseStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status, reason }: UpdateStatusInput) => {
      const response = await api.patch(`/admin/expenses/${id}/status`, { status, reason })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats })
      toast({
        title: 'Estat actualitzat',
        description: 'L\'estat de la despesa s\'ha actualitzat correctament',
      })
    },
  })
}
```

---

## 4. Routing & Navigation

### 4.1 Route Configuration

**App.tsx**:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NewExpensePage } from '@/pages/NewExpensePage'
import { ExpenseDetailPage } from '@/pages/ExpenseDetailPage'
import { AdminPage } from '@/pages/AdminPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Navigate to="/dashboard" replace />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses/new"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <NewExpensePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ExpenseDetailPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ProfilePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AppShell>
                    <AdminPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>

        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

### 4.2 Route Structure

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | Redirect to `/dashboard` | Authenticated | Root redirect |
| `/login` | LoginPage | Public | User login |
| `/register` | RegisterPage | Public | User registration |
| `/dashboard` | DashboardPage | Authenticated | User expense list |
| `/expenses/new` | NewExpensePage | Authenticated | Create new expense |
| `/expenses/:id` | ExpenseDetailPage | Authenticated | View expense details |
| `/profile` | ProfilePage | Authenticated | User profile settings |
| `/admin` | AdminPage | Admin only | Admin dashboard |
| `*` | NotFoundPage | Public | 404 page |

### 4.3 Navigation Patterns

**Programmatic Navigation**:
```typescript
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/dashboard')
  }

  const handleBack = () => {
    navigate(-1) // Go back
  }

  const handleExpenseClick = (id: string) => {
    navigate(`/expenses/${id}`)
  }
}
```

**Link Navigation**:
```typescript
import { Link } from 'react-router-dom'

<Link to="/expenses/new" className="...">
  Nova despesa
</Link>

// With state
<Link
  to="/login"
  state={{ from: location }}
>
  Inicia sessió
</Link>
```

**Protected Route Navigation**:
```typescript
// If user not authenticated, redirect to login with return URL
<Navigate to="/login" state={{ from: location }} replace />

// After login, redirect back to original destination
const location = useLocation()
const from = location.state?.from?.pathname || '/dashboard'
navigate(from, { replace: true })
```

---

## 5. API Integration

### 5.1 API Client Setup

**lib/api.ts**:
```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    // Extract error message
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected error occurred'

    return Promise.reject({
      ...error,
      message,
    })
  }
)
```

### 5.2 API Endpoints Mapping

**Authentication**:
```typescript
// POST /api/auth/register
export async function register(data: RegisterInput) {
  const response = await api.post('/auth/register', data)
  return response.data
}

// POST /api/auth/login
export async function login(data: LoginInput) {
  const response = await api.post('/auth/login', data)
  return response.data
}

// GET /api/auth/me
export async function getMe() {
  const response = await api.get('/auth/me')
  return response.data
}

// POST /api/auth/change-password
export async function changePassword(data: ChangePasswordInput) {
  const response = await api.post('/auth/change-password', data)
  return response.data
}
```

**Expenses**:
```typescript
// GET /api/expenses
export async function getExpenses(params: ExpenseQueryParams) {
  const response = await api.get('/expenses', { params })
  return response.data
}

// POST /api/expenses
export async function createExpense(data: CreateExpenseInput) {
  const response = await api.post('/expenses', data)
  return response.data
}

// GET /api/expenses/:id
export async function getExpense(id: string) {
  const response = await api.get(`/expenses/${id}`)
  return response.data
}
```

**Admin**:
```typescript
// GET /api/admin/stats
export async function getAdminStats() {
  const response = await api.get('/admin/stats')
  return response.data
}

// PATCH /api/admin/expenses/:id/status
export async function updateExpenseStatus(id: string, data: UpdateStatusInput) {
  const response = await api.patch(`/admin/expenses/${id}/status`, data)
  return response.data
}

// GET /api/admin/expenses/:id/audit
export async function getExpenseAudit(id: string) {
  const response = await api.get(`/admin/expenses/${id}/audit`)
  return response.data
}
```

### 5.3 Error Handling

**Error Types**:
```typescript
interface APIError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, any>
}

interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
}
```

**Error Handling Pattern**:
```typescript
try {
  const { data } = await api.post('/expenses', expenseData)
  toast({ title: 'Success!' })
  return data
} catch (error: any) {
  if (error.response?.status === 400) {
    // Validation error
    toast({
      variant: 'destructive',
      title: 'Dades invàlides',
      description: error.message,
    })
  } else if (error.response?.status === 401) {
    // Already handled by interceptor
  } else {
    // Generic error
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'No s\'ha pogut completar la petició',
    })
  }
  throw error
}
```

### 5.4 React Query Integration

**Queries**:
```typescript
// Fetch with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['expenses', filters],
  queryFn: () => getExpenses(filters),
})

// Dependent query (only fetch if ID exists)
const { data: expense } = useQuery({
  queryKey: ['expenses', id],
  queryFn: () => getExpense(id),
  enabled: !!id,
})
```

**Mutations**:
```typescript
const mutation = useMutation({
  mutationFn: createExpense,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  },
})

// Usage
mutation.mutate(expenseData)
```

**Optimistic Updates**:
```typescript
const mutation = useMutation({
  mutationFn: updateExpenseStatus,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['expenses', variables.id] })

    // Snapshot current value
    const previous = queryClient.getQueryData(['expenses', variables.id])

    // Optimistically update
    queryClient.setQueryData(['expenses', variables.id], (old: any) => ({
      ...old,
      status: variables.status,
    }))

    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['expenses', variables.id], context.previous)
  },
  onSettled: (data, error, variables) => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] })
  },
})
```

---

## 6. Authentication Flow

### 6.1 Authentication State Management

**hooks/useAuth.ts**:
```typescript
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getMe, login, logout as logoutAPI } from '@/lib/api'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore()

  // Verify token on mount
  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: !!token && !user,
    retry: false,
    onSuccess: (data) => {
      if (data.user) {
        setAuth(data.user, token!)
      }
    },
    onError: () => {
      clearAuth()
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutAPI,
    onSettled: () => {
      clearAuth()
    },
  })

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  }
}
```

### 6.2 Login Flow

**pages/LoginPage.tsx**:
```typescript
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => {
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inicia sessió</CardTitle>
          <CardDescription>
            Accedeix al teu compte de despeses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correu electrònic</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.cat"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrasenya</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Inicia sessió
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            No tens compte?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Registra't
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
```

### 6.3 Protected Route Pattern

**Automatic Redirection**:
- Unauthenticated user tries to access protected route → Redirect to `/login` with return URL
- After successful login → Redirect back to original destination
- Token expires during session → Automatic logout and redirect to `/login`

**Admin-Only Routes**:
- Check `user.role === 'admin'`
- Non-admin users redirected to `/dashboard`
- Admin routes: `/admin/*`

---

## 7. Page Layouts

### 7.1 Dashboard Page

**DashboardPage.tsx**:
```typescript
export function DashboardPage() {
  const { user } = useAuth()
  const { status, event, category } = useFilterStore()
  const navigate = useNavigate()

  const { data, isLoading, error } = useExpenses({
    status,
    event,
    category,
    page: 1,
    limit: 20,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al carregar les despeses"
        description="Si us plau, torna-ho a provar"
        action={<Button onClick={() => window.location.reload()}>Tornar a carregar</Button>}
      />
    )
  }

  const expenses = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {user?.name} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Les teves despeses de projecte
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={formatCurrency(data?.totalAmount || 0)}
          icon={DollarSign}
        />
        <StatCard
          label="Pendents"
          value={data?.statusCounts?.submitted || 0}
          icon={Clock}
        />
        <StatCard
          label="Aprovades"
          value={data?.statusCounts?.ready_to_pay || 0}
          icon={CheckCircle}
        />
        <StatCard
          label="Pagades"
          value={data?.statusCounts?.paid || 0}
          icon={Check}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Expense List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No tens despeses"
          description="Envia la teva primera despesa en menys de 3 segons!"
          action={
            <Button onClick={() => navigate('/expenses/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova despesa
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onClick={() => navigate(`/expenses/${expense.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB: New Expense */}
      <button
        onClick={() => navigate('/expenses/new')}
        className="fixed bottom-20 md:bottom-8 right-4 w-14 h-14 bg-primary-600 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
        aria-label="Nova despesa"
      >
        <Camera className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}
```

### 7.2 New Expense Page

**NewExpensePage.tsx** (Simplified - full version in section 8):
```typescript
export function NewExpensePage() {
  const navigate = useNavigate()
  const { mutate: createExpense, isLoading } = useCreateExpense()

  const handleSubmit = (data: ExpenseFormData) => {
    createExpense(data, {
      onSuccess: (response) => {
        navigate(`/expenses/${response.data.id}`)
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nova despesa</h1>
        <p className="text-gray-600 mt-1">
          Omple els detalls de la teva despesa
        </p>
      </div>

      <ExpenseForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
```

### 7.3 Expense Detail Page

**ExpenseDetailPage.tsx**:
```typescript
export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, isLoading } = useExpense(id!)
  const { data: auditData } = useQuery({
    queryKey: queryKeys.expenses.audit(id!),
    queryFn: () => api.get(`/admin/expenses/${id}/audit`).then((res) => res.data),
    enabled: user.role === 'admin',
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!data) {
    return (
      <EmptyState
        icon={FileX}
        title="Despesa no trobada"
        action={<Button onClick={() => navigate('/dashboard')}>Tornar al tauler</Button>}
      />
    )
  }

  const expense = data.data

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Tornar
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {expense.referenceNumber}
          </h1>
          <p className="text-gray-600 mt-1">{expense.vendorName}</p>
        </div>
        <StatusBadge status={expense.status} />
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Receipt Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Factura</CardTitle>
          </CardHeader>
          <CardContent>
            {expense.fileUrl ? (
              <img
                src={expense.fileUrl}
                alt="Receipt"
                className="w-full rounded-lg border border-gray-200"
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Número de factura" value={expense.invoiceNumber} />
            <DetailRow label="Data" value={formatDate(expense.invoiceDate)} />
            <DetailRow label="Proveïdor" value={expense.vendorName} />
            <DetailRow label="NIF" value={expense.vendorNif} />
            <DetailRow
              label="Import total"
              value={formatCurrency(expense.totalAmount)}
            />
            <DetailRow label="Categoria" value={categoryLabels[expense.category]} />
            <DetailRow label="Esdeveniment" value={eventLabels[expense.event]} />

            {expense.description && (
              <div>
                <Label>Descripció</Label>
                <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {expense.lineItems && expense.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Línies de la factura</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripció</TableHead>
                  <TableHead className="text-right">Quantitat</TableHead>
                  <TableHead className="text-right">Preu unitari</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expense.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">{item.vatRate}%</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Log (Admin Only) */}
      {user.role === 'admin' && auditData && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de canvis</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogViewer logs={auditData.data} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 7.4 Admin Page

**AdminPage.tsx**:
```typescript
export function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => api.get('/admin/stats').then((res) => res.data),
  })

  const { data: expenses, isLoading: expensesLoading } = useExpenses({
    status: ['submitted'],
    limit: 50,
  })

  if (statsLoading || expensesLoading) {
    return <LoadingSpinner />
  }

  const pendingExpenses = expenses?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Gestiona les despeses pendents i revisa l'activitat recent
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pendents"
          value={stats?.statusCounts?.submitted || 0}
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Llestes per pagar"
          value={stats?.statusCounts?.ready_to_pay || 0}
          icon={CheckCircle}
          color="primary"
        />
        <StatCard
          label="Pagades"
          value={stats?.statusCounts?.paid || 0}
          icon={Check}
          color="success"
        />
        <StatCard
          label="Import total"
          value={formatCurrency(stats?.totalAmount || 0)}
          icon={DollarSign}
        />
      </div>

      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Despeses pendents de revisió</CardTitle>
          <CardDescription>
            {pendingExpenses.length} despeses esperen la teva aprovació
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingExpenses.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No hi ha despeses pendents"
              description="Totes les despeses han estat revisades"
            />
          ) : (
            <ApprovalQueue expenses={pendingExpenses} />
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activitat recent</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity?.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 7.5 Profile Page

**ProfilePage.tsx**:
```typescript
export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona la teva informació personal
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informació personal</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel·lar
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <ProfileEditForm onSuccess={() => setIsEditing(false)} />
          ) : (
            <div className="space-y-4">
              <DetailRow label="Nom" value={user.name} />
              <DetailRow label="Correu" value={user.email} />
              <DetailRow label="Rol" value={user.role === 'admin' ? 'Administrador' : 'Usuari'} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuració</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsPanel />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Canviar contrasenya</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive-600">Zona de perill</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            Eliminar compte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 8. Form Architecture

### 8.1 Form Setup with React Hook Form + Zod

**validators/expenseSchema.ts**:
```typescript
import { z } from 'zod'

export const expenseSchema = z.object({
  // Personal Info
  email: z.string().email('Email invàlid'),
  phone: z.string().regex(/^\+?[0-9\s-]+$/, 'Telèfon invàlid'),
  name: z.string().min(2, 'Nom massa curt'),
  surname: z.string().min(2, 'Cognom massa curt'),

  // Expense Details
  event: z.enum(['mwc_barcelona', 'sonar', 'primavera_sound', 'other']),
  category: z.enum(['transport', 'food', 'accommodation', 'materials', 'other']),
  type: z.enum(['reimbursable', 'non_reimbursable', 'payable']),

  // Invoice Info
  invoiceNumber: z.string().min(1, 'Número de factura obligatori'),
  invoiceDate: z.date({ required_error: 'Data obligatòria' }),
  vendorName: z.string().min(2, 'Nom del proveïdor obligatori'),
  vendorNif: z.string()
    .regex(/^[A-Z]\d{7}[A-Z0-9]$/, 'Format NIF/CIF invàlid')
    .optional(),

  // Financial
  totalAmount: z.number().positive('L\'import ha de ser positiu'),

  // Bank Account (conditional)
  bankAccount: z.string()
    .regex(/^ES\d{22}$/, 'IBAN invàlid')
    .optional(),
  accountHolder: z.string().optional(),

  // File
  fileUrl: z.string().url('URL invàlida').optional(),
  fileName: z.string().optional(),

  // Optional
  description: z.string().max(500, 'Màxim 500 caràcters').optional(),
  ocrConfidence: z.number().min(0).max(1).optional(),

  // Line Items
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    vatRate: z.number().min(0).max(100),
    totalAmount: z.number().positive(),
  })).optional(),
}).refine((data) => {
  // Bank account required if type is reimbursable
  if (data.type === 'reimbursable') {
    return !!data.bankAccount && !!data.accountHolder
  }
  return true
}, {
  message: 'Compte bancari obligatori per despeses reemborsables',
  path: ['bankAccount'],
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
```

### 8.2 Expense Form Component

**components/features/expenses/ExpenseForm.tsx** (excerpt):
```typescript
interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void
  isLoading?: boolean
  initialData?: Partial<ExpenseFormData>
}

export function ExpenseForm({ onSubmit, isLoading, initialData }: ExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      email: '',
      phone: '',
      name: '',
      surname: '',
      event: 'other',
      category: 'other',
      type: 'reimbursable',
      invoiceNumber: '',
      invoiceDate: new Date(),
      vendorName: '',
      totalAmount: 0,
      description: '',
    },
  })

  const watchType = form.watch('type')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Receipt Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Factura</CardTitle>
            <CardDescription>
              Fes una foto de la factura o puja un arxiu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ReceiptUpload
                      value={field.value}
                      onUpload={(url) => field.onChange(url)}
                      isLoading={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Personal Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. Dades personals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognoms</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ... more fields ... */}
          </CardContent>
        </Card>

        {/* Invoice Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>3. Detalls de la factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ... invoice fields ... */}
          </CardContent>
        </Card>

        {/* Bank Account Section (Conditional) */}
        {watchType === 'reimbursable' && (
          <Card>
            <CardHeader>
              <CardTitle>4. Compte bancari</CardTitle>
              <CardDescription>
                On vols rebre el reemborsament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                      <Input placeholder="ES00 0000 0000 0000 0000 0000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: ES + 22 dígits
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ... account holder ... */}
            </CardContent>
          </Card>
        )}

        {/* Line Items Section (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>5. Línies de la factura (opcional)</CardTitle>
            <CardDescription>
              Afegeix el desglossament de la factura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineItemEditor
              value={form.watch('lineItems') || []}
              onChange={(items) => form.setValue('lineItems', items)}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel·lar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar despesa
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### 8.3 Line Item Editor

**components/features/expenses/LineItemEditor.tsx**:
```typescript
interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  totalAmount: number
}

interface LineItemEditorProps {
  value: LineItem[]
  onChange: (items: LineItem[]) => void
}

export function LineItemEditor({ value, onChange }: LineItemEditorProps) {
  const [items, setItems] = useState<LineItem[]>(value)

  const addItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 21,
      totalAmount: 0,
    }
    const updated = [...items, newItem]
    setItems(updated)
    onChange(updated)
  }

  const updateItem = (index: number, updates: Partial<LineItem>) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item

      const newItem = { ...item, ...updates }
      // Auto-calculate total
      newItem.totalAmount =
        newItem.quantity * newItem.unitPrice * (1 + newItem.vatRate / 100)

      return newItem
    })

    setItems(updated)
    onChange(updated)
  }

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Línia {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Label>Descripció</Label>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Concepte"
              />
            </div>

            <div>
              <Label>Quantitat</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, { quantity: parseFloat(e.target.value) || 0 })
                }
                min="1"
                step="1"
              />
            </div>

            <div>
              <Label>Preu unitari</Label>
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                }
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>IVA (%)</Label>
              <Select
                value={item.vatRate.toString()}
                onValueChange={(value) =>
                  updateItem(index, { vatRate: parseFloat(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="4">4%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-semibold">
              Total: {formatCurrency(item.totalAmount)}
            </span>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addItem} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Afegir línia
      </Button>

      {items.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between text-lg font-bold">
            <span>Total general:</span>
            <span>
              {formatCurrency(items.reduce((sum, item) => sum + item.totalAmount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 9. File Upload & OCR

### 9.1 File Upload Flow

**hooks/useFileUpload.ts**:
```typescript
import { useState } from 'react'
import { api } from '@/lib/api'

interface UploadResult {
  fileUrl: string
  fileName: string
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<UploadResult | null> => {
    try {
      setIsUploading(true)
      setError(null)
      setProgress(0)

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El fitxer és massa gran (màxim 5MB)')
      }

      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        throw new Error('Format de fitxer no vàlid. Usa JPG, PNG o PDF')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          )
          setProgress(percent)
        },
      })

      return {
        fileUrl: response.data.data.url,
        fileName: file.name,
      }
    } catch (err: any) {
      setError(err.message || 'Error al pujar el fitxer')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    upload,
    isUploading,
    progress,
    error,
  }
}
```

### 9.2 OCR Processing

**hooks/useOCR.ts**:
```typescript
import { useState } from 'react'
import { api } from '@/lib/api'

interface OCRResult {
  invoiceNumber?: string
  invoiceDate?: string
  vendorName?: string
  vendorNif?: string
  totalAmount?: number
  lineItems?: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    totalAmount: number
  }>
  confidence: number
}

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processReceipt = async (fileUrl: string): Promise<OCRResult | null> => {
    try {
      setIsProcessing(true)
      setError(null)

      const response = await api.post('/ocr/process', { fileUrl })

      return response.data.data
    } catch (err: any) {
      setError(err.message || 'Error al processar la factura')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processReceipt,
    isProcessing,
    error,
  }
}
```

### 9.3 Combined Upload + OCR Flow

**Enhanced ReceiptUpload Component**:
```typescript
export function ReceiptUpload({ onUpload, value, isLoading }: ReceiptUploadProps) {
  const { upload, isUploading, progress } = useFileUpload()
  const { processReceipt, isProcessing } = useOCR()
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload file
    const uploadResult = await upload(file)
    if (!uploadResult) return

    // Process with OCR
    const ocrResult = await processReceipt(uploadResult.fileUrl)

    // Callback with results
    onUpload({
      fileUrl: uploadResult.fileUrl,
      fileName: uploadResult.fileName,
      ocrData: ocrResult,
    })
  }

  const isLoading = isUploading || isProcessing

  return (
    <div className="space-y-4">
      {/* ... upload UI ... */}

      {isLoading && (
        <div className="space-y-2">
          <Progress value={isUploading ? progress : 50} />
          <p className="text-sm text-gray-600 text-center">
            {isUploading && `Pujant fitxer... ${progress}%`}
            {isProcessing && 'Processant factura amb OCR...'}
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## 10. Error Handling

### 10.1 Error Boundary

**Implemented in section 2.1 - layout/ErrorBoundary.tsx**

### 10.2 API Error Handling

**Centralized in api.ts interceptors** (section 5.1)

### 10.3 Toast Notifications

**hooks/useToast.ts** (wrapper around shadcn/ui toast):
```typescript
import { toast as shadcnToast } from '@/components/ui/use-toast'

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
  }: {
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
  }) => {
    shadcnToast({
      title,
      description,
      variant: variant === 'success' ? 'default' : variant,
      className: variant === 'success' ? 'bg-success-50 border-success-200' : '',
    })
  }

  return { toast }
}
```

### 10.4 Form Error Display

**Handled automatically by React Hook Form + Zod**:
- Field-level errors shown via `<FormMessage />`
- General form errors via form.setError()
- API errors mapped to form fields

---

## 11. Accessibility

### 11.1 WCAG 2.1 AA Compliance

**Focus Management**:
```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

**Skip Links**:
```typescript
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
>
  Saltar al contingut principal
</a>
```

**ARIA Labels**:
- All icon-only buttons have `aria-label`
- Form inputs linked to labels via `htmlFor`/`id`
- Status badges have `aria-label` for screen readers
- Loading states announced via `aria-live="polite"`

**Keyboard Navigation**:
- All interactive elements focusable via Tab
- Escape closes modals/dropdowns
- Arrow keys navigate lists/menus
- Enter/Space activate buttons

### 11.2 Screen Reader Support

**Semantic HTML**:
```typescript
<main id="main-content">
  <article>
    <header>
      <h1>Dashboard</h1>
    </header>
    <section aria-labelledby="expenses-heading">
      <h2 id="expenses-heading">Les teves despeses</h2>
      {/* ... */}
    </section>
  </article>
</main>
```

**ARIA Live Regions**:
```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && 'Carregant despeses...'}
  {error && 'Error al carregar les despeses'}
</div>
```

### 11.3 Color Contrast

**All colors meet WCAG AA (4.5:1) contrast requirements**:
- Text: gray-600 on white (7.9:1)
- Links: primary-600 on white (4.7:1)
- Buttons: white text on primary-600 (4.7:1)
- Status badges: contrasting background + text + icon

---

## 12. Internationalization

### 12.1 i18next Setup

**lib/i18n.ts**:
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ca: {
        common: require('../public/locales/ca/common.json'),
      },
      es: {
        common: require('../public/locales/es/common.json'),
      },
    },
    fallbackLng: 'ca',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

### 12.2 Translation Files

**public/locales/ca/common.json** (excerpt):
```json
{
  "nav": {
    "dashboard": "Tauler",
    "expenses": "Despeses",
    "newExpense": "Nova despesa",
    "profile": "Perfil",
    "admin": "Admin"
  },
  "auth": {
    "login": "Inicia sessió",
    "register": "Registra't",
    "logout": "Tanca sessió",
    "email": "Correu electrònic",
    "password": "Contrasenya"
  },
  "expenses": {
    "title": "Les teves despeses",
    "new": "Nova despesa",
    "status": {
      "submitted": "Pendent",
      "ready_to_pay": "Llest per pagar",
      "paid": "Pagada",
      "declined": "Denegada"
    }
  }
}
```

### 12.3 Usage in Components

```typescript
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('expenses.title')}</h1>
      <Button>{t('expenses.new')}</Button>
    </div>
  )
}
```

---

## 13. Performance Optimization

### 13.1 Code Splitting

**Route-based splitting**:
```typescript
import { lazy, Suspense } from 'react'

const AdminPage = lazy(() => import('@/pages/AdminPage'))

<Route
  path="/admin"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <AdminPage />
    </Suspense>
  }
/>
```

### 13.2 Image Optimization

**Lazy loading**:
```typescript
<img src={receiptUrl} alt="Receipt" loading="lazy" />
```

**Responsive images**:
```typescript
<img
  src={receiptUrl}
  srcSet={`${thumbnailUrl} 400w, ${fullUrl} 800w`}
  sizes="(max-width: 768px) 400px, 800px"
  alt="Receipt"
/>
```

### 13.3 Memoization

**React.memo for expensive components**:
```typescript
export const ExpenseCard = React.memo(({ expense }: ExpenseCardProps) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.expense.id === nextProps.expense.id &&
         prevProps.expense.status === nextProps.expense.status
})
```

**useMemo for expensive calculations**:
```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter(/* ... */)
}, [expenses, filters])
```

### 13.4 Bundle Size Optimization

**Tree-shaking**:
- Only import used components from shadcn/ui
- Use named imports from Lucide icons
- Avoid large dependencies

**Expected bundle sizes**:
- Initial load: ~100KB (gzipped)
- Admin chunk: ~20KB (lazy loaded)
- Total JS: ~120KB

---

## 14. Testing Strategy

### 14.1 Unit Tests (Vitest + Testing Library)

**Example: StatusBadge.test.tsx**:
```typescript
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/features/expenses/StatusBadge'

describe('StatusBadge', () => {
  it('renders submitted status correctly', () => {
    render(<StatusBadge status="submitted" />)
    expect(screen.getByText('Pendent')).toBeInTheDocument()
  })

  it('renders correct icon', () => {
    const { container } = render(<StatusBadge status="submitted" />)
    expect(container.querySelector('.lucide-clock')).toBeInTheDocument()
  })
})
```

### 14.2 Integration Tests

**Example: ExpenseForm.test.tsx**:
```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { ExpenseForm } from '@/components/features/expenses/ExpenseForm'

describe('ExpenseForm', () => {
  it('validates required fields', async () => {
    const onSubmit = vi.fn()
    render(<ExpenseForm onSubmit={onSubmit} />)

    const submitButton = screen.getByText('Enviar despesa')
    await userEvent.click(submitButton)

    expect(screen.getByText(/nom massa curt/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows bank account fields for reimbursable expenses', async () => {
    render(<ExpenseForm onSubmit={vi.fn()} />)

    const typeSelect = screen.getByLabelText(/tipus/i)
    await userEvent.selectOptions(typeSelect, 'reimbursable')

    expect(screen.getByLabelText(/IBAN/i)).toBeInTheDocument()
  })
})
```

### 14.3 E2E Tests (Playwright)

**Example: expense-submission.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test('user can submit an expense', async ({ page }) => {
  await page.goto('/login')

  // Login
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to new expense
  await page.click('text=Nova despesa')

  // Fill form
  await page.fill('input[name="name"]', 'Test')
  await page.fill('input[name="surname"]', 'User')
  await page.fill('input[name="invoiceNumber"]', 'INV-001')
  await page.fill('input[name="vendorName"]', 'Test Vendor')
  await page.fill('input[name="totalAmount"]', '100')

  // Submit
  await page.click('text=Enviar despesa')

  // Verify redirect
  await expect(page).toHaveURL(/\/expenses\/[a-f0-9-]+/)
})
```

### 14.4 Accessibility Tests

**axe-core integration**:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('ExpenseCard has no accessibility violations', async () => {
  const { container } = render(<ExpenseCard expense={mockExpense} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 15. Deployment

### 15.1 Environment Variables

**`.env.example`**:
```bash
# API
VITE_API_BASE_URL=http://localhost:3000/api

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
VITE_ENABLE_OCR=true
VITE_ENABLE_ANALYTICS=false
```

### 15.2 Build Configuration

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
})
```

### 15.3 Vercel Deployment

**vercel.json**:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Deploy command**:
```bash
npm run build
vercel --prod
```

---

## Conclusion

This frontend architecture provides a complete, production-ready specification for implementing the Expense Reimbursement System. The architecture prioritizes:

1. **Developer Experience**: Clear structure, type safety, modern tooling
2. **User Experience**: Mobile-first, fast, accessible, Catalan-first
3. **Maintainability**: Component isolation, clear patterns, comprehensive testing
4. **Performance**: Code splitting, lazy loading, optimistic updates
5. **Security**: Protected routes, secure API communication, input validation

**Next Steps for Implementation**:
1. Set up project with Vite + React + TypeScript
2. Initialize shadcn/ui and install core components
3. Implement authentication flow and routing
4. Build layout components (AppShell, MobileNav, Header)
5. Implement expense list and detail pages
6. Build expense submission form with OCR integration
7. Implement admin dashboard
8. Add comprehensive tests
9. Deploy to Vercel

**Estimated Implementation Time**: 3-4 weeks for full MVP with testing.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: PACT Architect
**Status**: Ready for Code Phase
