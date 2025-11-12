# Tech Stack Research: React 18 + Vite 5 + Tailwind CSS + shadcn/ui

## Executive Summary

This document provides comprehensive research on the frontend technology stack for the Expense Reimbursement System. The recommended stack combines React 18 with Vite 5 for blazing-fast development, Tailwind CSS 3 for utility-first styling, and shadcn/ui for accessible, customizable components. This modern stack offers excellent developer experience, optimal performance, and is production-ready for a Catalan-language youth ministry application handling 40-200 monthly submissions.

**Key Recommendations:**
- Use Vite 5 as the build tool (Create React App is deprecated)
- Implement React Hook Form + Zod for type-safe form validation
- Leverage shadcn/ui components for consistent, accessible UI
- Follow React 18 concurrent features for optimal performance

---

## 1. React 18 + Vite 5 Setup

### Why Vite Over Create React App

As of 2025, **Vite has firmly established itself as the go-to build tool** for modern React applications. Create React App (CRA) is officially deprecated, and Vite offers:

- **Instant Server Start**: Native ES modules mean no bundling during development
- **Lightning-Fast HMR**: Hot Module Replacement under 50ms
- **Optimized Production Builds**: Uses Rollup for highly optimized bundles
- **Zero Configuration**: Works out-of-the-box with TypeScript, JSX, and CSS
- **Superior Performance**: Uses esbuild (written in Go) for 10-100x faster builds than JavaScript-based bundlers

### Quick Start Command

```bash
npm create vite@latest expense-reimbursement -- --template react-ts
cd expense-reimbursement
npm install
npm run dev
```

### Project Structure Recommendation

```
expense-reimbursement/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Vite Configuration Best Practices

**vite.config.ts:**
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
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
  },
})
```

### React 18 Key Features to Leverage

1. **Concurrent Features**
   - Use `useTransition` for non-urgent state updates
   - Implement `useDeferredValue` for expensive computations

2. **Automatic Batching**
   - Multiple state updates are automatically batched (even in async functions)
   - Reduces unnecessary re-renders

3. **Suspense Improvements**
   - Better support for data fetching
   - Use with React.lazy for code splitting

**Example: Using Concurrent Features**
```typescript
import { useState, useTransition } from 'react'

function ExpenseList({ expenses }) {
  const [filter, setFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (value: string) => {
    // Mark filter updates as non-urgent
    startTransition(() => {
      setFilter(value)
    })
  }

  return (
    <div>
      <input
        onChange={(e) => handleFilterChange(e.target.value)}
        placeholder="Filter expenses..."
      />
      {isPending && <div>Updating...</div>}
      {/* Filtered expense list */}
    </div>
  )
}
```

---

## 2. Tailwind CSS 3 Integration

### Installation and Setup

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Tailwind Configuration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... other CSS variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Tailwind Best Practices

1. **Use Utility Classes Consistently**
   - Prefer utilities over custom CSS
   - Use `@apply` sparingly (only for component classes)

2. **Responsive Design**
   ```tsx
   <div className="w-full md:w-1/2 lg:w-1/3">
     {/* Mobile-first responsive design */}
   </div>
   ```

3. **Custom Components with CVA**
   ```typescript
   import { cva, type VariantProps } from "class-variance-authority"

   const buttonVariants = cva(
     "inline-flex items-center justify-center rounded-md font-medium",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           destructive: "bg-destructive text-destructive-foreground",
           outline: "border border-input hover:bg-accent",
         },
         size: {
           default: "h-10 px-4 py-2",
           sm: "h-9 rounded-md px-3",
           lg: "h-11 rounded-md px-8",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     }
   )
   ```

---

## 3. shadcn/ui Component Library

### What is shadcn/ui?

**Not a traditional component library** - shadcn/ui provides **copy-paste components** built on:
- **Radix UI** primitives (accessible, unstyled components)
- **Tailwind CSS** for styling
- **Full code ownership** (components copied into your project)

### Installation

```bash
npx shadcn-ui@latest init
```

This prompts for:
- Style preference (Default, New York)
- Base color
- CSS variables usage
- Tailwind config path
- Component directory location

### Adding Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add card
```

### Key Components for Expense System

**1. Form Component**
```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  amount: z.number().positive("L'import ha de ser positiu"),
  vendor: z.string().min(2, "El proveïdor és obligatori"),
})

export function ExpenseForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveïdor</FormLabel>
              <FormControl>
                <Input placeholder="Nom del proveïdor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  )
}
```

**2. Data Table Component**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ExpenseTable({ expenses }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Proveïdor</TableHead>
          <TableHead>Import</TableHead>
          <TableHead>Estat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{expense.date}</TableCell>
            <TableCell>{expense.vendor}</TableCell>
            <TableCell>{expense.amount}€</TableCell>
            <TableCell>{expense.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Customization Benefits

- **Full Control**: Modify components directly in your codebase
- **No Bundle Bloat**: Only include components you use
- **Type Safety**: Full TypeScript support
- **Accessibility**: Built on Radix UI primitives (WCAG compliant)

---

## 4. React Hook Form + Zod Validation

### Why This Combination?

- **React Hook Form**: Minimal re-renders, excellent performance
- **Zod**: Type-safe schema validation with TypeScript inference
- **Perfect Integration**: `@hookform/resolvers/zod` provides seamless connection

### Installation

```bash
npm install react-hook-form zod @hookform/resolvers/zod
```

### Advanced Validation Patterns

**1. Nested Object Validation**
```typescript
import { z } from "zod"

const expenseSchema = z.object({
  invoice: z.object({
    number: z.string().min(1, "Número de factura obligatori"),
    date: z.date(),
    vendor: z.object({
      name: z.string().min(2),
      nif: z.string().regex(/^[A-Z]\d{8}$/, "Format NIF invàlid"),
    }),
  }),
  amounts: z.object({
    subtotal: z.number().positive(),
    vat: z.number().min(0),
    total: z.number().positive(),
  }).refine((data) => data.total === data.subtotal + data.vat, {
    message: "El total no coincideix amb subtotal + IVA",
    path: ["total"],
  }),
  receipts: z.array(z.instanceof(File))
    .min(1, "Almenys una factura requerida")
    .max(5, "Màxim 5 fitxers"),
})

type ExpenseFormData = z.infer<typeof expenseSchema>
```

**2. Custom Validation Rules**
```typescript
const conditionalSchema = z.object({
  expenseType: z.enum(["transport", "accommodation", "meals"]),
  kilometers: z.number().optional(),
  nights: z.number().optional(),
}).refine((data) => {
  if (data.expenseType === "transport" && !data.kilometers) {
    return false
  }
  if (data.expenseType === "accommodation" && !data.nights) {
    return false
  }
  return true
}, {
  message: "Camp obligatori segons el tipus de despesa",
})
```

**3. File Upload Validation**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]

const fileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "Mida màxima: 5MB")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Només s'accepten .jpg, .jpeg, .png, .webp i .pdf"
  )
```

### Performance Best Practices

1. **Use Mode: "onBlur" for Better UX**
   ```typescript
   const form = useForm({
     resolver: zodResolver(schema),
     mode: "onBlur", // Validate on blur, not on every keystroke
   })
   ```

2. **Optimize Re-renders with Controller**
   ```typescript
   import { Controller } from "react-hook-form"

   <Controller
     control={form.control}
     name="date"
     render={({ field }) => (
       <DatePicker {...field} />
     )}
   />
   ```

3. **Watch Specific Fields Only**
   ```typescript
   // Bad - watches entire form
   const formValues = form.watch()

   // Good - watches specific field
   const expenseType = form.watch("expenseType")
   ```

---

## 5. Node.js 20 + Express 4 Backend Considerations

### Express 4 Setup with TypeScript

```bash
npm install express
npm install -D @types/express typescript ts-node
```

**Basic Express Server with Best Practices:**
```typescript
import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

const app: Express = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/expenses', expenseRoutes)
app.use('/api/auth', authRoutes)

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

---

## 6. Drizzle ORM Best Practices

### Why Drizzle Over Prisma?

- **Lightweight**: ~7.4kb minified+gzipped (vs Prisma's larger footprint)
- **SQL-First**: Write SQL-like queries with TypeScript
- **Serverless-Ready**: Works in Cloudflare Workers, Vercel Edge
- **Zero Dependencies**: No runtime dependencies
- **Better Performance**: Direct SQL generation, no query engine

### Installation

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### Schema Definition

**src/db/schema.ts:**
```typescript
import { pgTable, serial, text, timestamp, decimal, uuid, pgEnum } from 'drizzle-orm/pg-core'

export const expenseStatusEnum = pgEnum('expense_status', [
  'pending',
  'approved',
  'declined',
  'paid'
])

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  vendor: text('vendor').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal('vat_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: expenseStatusEnum('status').default('pending'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('user'), // 'user' or 'admin'
  createdAt: timestamp('created_at').defaultNow(),
})
```

### Database Connection with Supabase

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

export const sql = postgres(connectionString, { max: 10 })
export const db = drizzle(sql)
```

### Query Examples

```typescript
import { db } from './db'
import { expenses, users } from './schema'
import { eq, and, desc } from 'drizzle-orm'

// Insert expense
await db.insert(expenses).values({
  userId: '...',
  invoiceNumber: 'INV-001',
  vendor: 'Acme Corp',
  amount: '100.00',
  vatAmount: '21.00',
  totalAmount: '121.00',
})

// Get user expenses with status filter
const userExpenses = await db
  .select()
  .from(expenses)
  .where(
    and(
      eq(expenses.userId, userId),
      eq(expenses.status, 'pending')
    )
  )
  .orderBy(desc(expenses.createdAt))

// Join query
const expensesWithUsers = await db
  .select({
    expense: expenses,
    user: users,
  })
  .from(expenses)
  .leftJoin(users, eq(expenses.userId, users.id))
```

### Migrations

```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

---

## 7. JWT Authentication Implementation

### Installation

```bash
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

### Authentication Service

```typescript
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
}
```

### Auth Middleware

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from './auth-service'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)

  try {
    const { userId, role } = verifyToken(token)
    req.userId = userId
    req.userRole = role
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
```

---

## 8. Cost Considerations

### Development Tools (Free)
- ✅ Vite: Free and open-source
- ✅ React: Free and open-source
- ✅ Tailwind CSS: Free and open-source
- ✅ shadcn/ui: Free (copy-paste components)
- ✅ React Hook Form: Free and open-source
- ✅ Zod: Free and open-source

### Estimated Monthly Costs
- **Total Frontend Stack**: €0/month (all free tools)
- **Backend Development**: €0/month (Node.js, Express, Drizzle ORM all free)

---

## 9. Potential Pitfalls and Solutions

### 1. Vite Environment Variables
**Problem**: Vite only exposes variables prefixed with `VITE_`

**Solution:**
```typescript
// ❌ Won't work
const apiUrl = import.meta.env.API_URL

// ✅ Correct
const apiUrl = import.meta.env.VITE_API_URL
```

### 2. shadcn/ui Component Conflicts
**Problem**: Tailwind class conflicts when customizing components

**Solution**: Use `cn()` utility properly
```typescript
import { cn } from "@/lib/utils"

<Button className={cn("custom-class", props.className)} />
```

### 3. Form Re-render Issues
**Problem**: Entire form re-renders on every input change

**Solution**: Use `useFormContext` and split into smaller components
```typescript
const FormField = () => {
  const { register } = useFormContext()
  return <input {...register("field")} />
}
```

### 4. Drizzle Type Inference
**Problem**: TypeScript can't infer query result types

**Solution**: Use `InferModel` or `InferSelectModel`
```typescript
import { InferSelectModel } from 'drizzle-orm'
type Expense = InferSelectModel<typeof expenses>
```

---

## 10. Official Documentation Links

- **Vite**: https://vite.dev/guide/
- **React 18**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Express**: https://expressjs.com/

---

## 11. Next Steps for Architecture Phase

The architecture team should consider:
1. Component hierarchy and folder structure
2. State management strategy (Context API vs Zustand)
3. Routing structure with React Router
4. API client architecture (Axios vs Fetch)
5. Error boundary implementation
6. Loading and skeleton states
7. Form workflow (draft saving, multi-step forms)
8. Real-time updates strategy (polling vs WebSockets)
