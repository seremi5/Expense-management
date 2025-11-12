# Component Library Research: shadcn/ui + Radix UI + React Hook Form

## Executive Summary

This document provides a comprehensive guide for setting up and using the component library stack for the Expense Reimbursement System. The recommended stack combines **shadcn/ui** (accessible, customizable components), **Radix UI** primitives (unstyled, accessible foundations), **Lucide React** (icon library), and **React Hook Form + Zod** (form management and validation).

**Key Benefits:**
- **Full Code Ownership**: Copy-paste components into your codebase (not an npm dependency)
- **Built-in Accessibility**: WCAG 2.1 AA compliant via Radix UI primitives
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Lightweight**: Tree-shakable, only bundle what you use
- **Customizable**: Modify components directly in your project
- **Production Ready**: Used by thousands of production apps in 2025

**Total Bundle Impact**: ~15-20KB minified+gzipped (for typical usage)

---

## 1. shadcn/ui Overview

### 1.1 What Makes shadcn/ui Different

**NOT a Traditional Component Library**
- You don't install it as an npm package
- Components are **copied into your project**
- You own the code and can modify freely
- No version lock-in or breaking changes from updates

**Built on Top of:**
- **Radix UI**: Unstyled, accessible primitives
- **Tailwind CSS**: Utility-first styling
- **class-variance-authority (CVA)**: Type-safe component variants
- **tailwind-merge**: Intelligent class merging

**Philosophy:**
> "The idea behind this is to give you ownership and control over the code, allowing you to decide how the components are built and styled."

### 1.2 Prerequisites

**Required Dependencies** (must be installed first):
```bash
npm install react react-dom typescript
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom
```

**Verify React 18+ and TypeScript 5+**

### 1.3 Installation Process

**Step 1: Initialize shadcn/ui**
```bash
npx shadcn-ui@latest init
```

**Interactive Prompts:**
```
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Do you want to use CSS variables for colors? › yes
✔ Are you using a custom tailwind prefix eg. tw-? (Leave blank if not) ›
✔ Where is your global CSS file? › src/index.css
✔ Would you like to use CSS variables for colors? › yes
✔ Are you using a custom tailwind prefix? › No
✔ Where is your tailwind.config.js located? › tailwind.config.js
✔ Configure the import alias for components? › @/components
✔ Configure the import alias for utils? › @/lib/utils
✔ Are you using React Server Components? › no
```

**What This Does:**
- Creates `components.json` config file
- Sets up path aliases in `tsconfig.json`
- Configures Tailwind with shadcn/ui theme
- Creates utility functions in `lib/utils.ts`

**Step 2: Install Additional Dependencies**
```bash
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-slot
```

### 1.4 Adding Components

**Add Individual Components:**
```bash
# Core components for expense system
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add separator
```

**Add All Components at Once:**
```bash
npx shadcn-ui@latest add --all
```

**What Happens:**
- Component source code is copied to `src/components/ui/`
- You can immediately modify the code
- No need to upgrade or manage versions

---

## 2. Core Components for Expense System

### 2.1 Button Component

**Location:** `src/components/ui/button.tsx`

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Text Only</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🗑️</Button>

// With icon
import { Camera } from "lucide-react"
<Button>
  <Camera className="mr-2 h-4 w-4" />
  Fer foto
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Enviant...
</Button>
```

**Customization Example:**
```tsx
// Modify src/components/ui/button.tsx to add custom variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        // ... existing variants
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        success: "bg-green-600 text-white hover:bg-green-700",
      }
    }
  }
)
```

### 2.2 Form Components (Critical for Expense System)

**Installation:**
```bash
npx shadcn-ui@latest add form
```

**What You Get:**
- `Form` wrapper component
- `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- Integration with React Hook Form + Zod

**Basic Form Example:**
```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Número de factura obligatori"),
  vendor: z.string().min(2, "Nom del proveïdor obligatori"),
  amount: z.number().positive("L'import ha de ser positiu"),
})

export function ExpenseForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: "",
      vendor: "",
      amount: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveïdor</FormLabel>
              <FormControl>
                <Input placeholder="Nom del proveïdor" {...field} />
              </FormControl>
              <FormDescription>
                El nom que apareix a la factura
              </FormDescription>
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

### 2.3 Input Component

**Variants:**
```tsx
import { Input } from "@/components/ui/input"

// Text input
<Input type="text" placeholder="Número de factura" />

// Number input
<Input type="number" min="0" step="0.01" />

// Email input
<Input type="email" placeholder="email@example.cat" />

// Date input
<Input type="date" />

// File input
<Input type="file" accept="image/*" />

// Disabled state
<Input disabled value="Auto-calculat" />

// Error state (with FormMessage)
<Input className="border-red-500" />
```

### 2.4 Select Component

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Selecciona categoria" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="transport">Transport</SelectItem>
    <SelectItem value="food">Menjar</SelectItem>
    <SelectItem value="accommodation">Allotjament</SelectItem>
    <SelectItem value="materials">Materials</SelectItem>
    <SelectItem value="other">Altres</SelectItem>
  </SelectContent>
</Select>
```

**With Form:**
```tsx
<FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Categoria</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona categoria" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="transport">Transport</SelectItem>
          {/* ... */}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2.5 Card Component

**Perfect for Expense List Items:**
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>€45.50</CardTitle>
    <CardDescription>Esplai Materials SL</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-600">15 de gener, 2025</p>
  </CardContent>
  <CardFooter>
    <Badge variant="warning">Pendent</Badge>
  </CardFooter>
</Card>
```

### 2.6 Dialog (Modal) Component

**For Confirmations and Detail Views:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Veure detalls</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Detalls de la Despesa</DialogTitle>
      <DialogDescription>
        Factura #FAC-2025-001
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Tancar</Button>
      <Button>Aprovar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.7 Toast (Notifications)

**Installation:**
```bash
npx shadcn-ui@latest add toast
```

**Setup in Layout:**
```tsx
// App.tsx or Layout.tsx
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster />
    </>
  )
}
```

**Usage:**
```tsx
import { useToast } from "@/components/ui/use-toast"

function ExpenseForm() {
  const { toast } = useToast()

  function onSubmit() {
    // ... submit logic
    toast({
      title: "Despesa enviada!",
      description: "Rebràs un email quan sigui revisada",
    })
  }

  // Error toast
  toast({
    variant: "destructive",
    title: "Error",
    description: "No s'ha pogut enviar la despesa",
  })

  // Success toast
  toast({
    title: "Èxit!",
    description: "Despesa aprovada correctament",
    variant: "success", // If you add this variant
  })
}
```

### 2.8 Badge Component

**For Status Indicators:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Pendent</Badge>
<Badge variant="secondary">Esborrany</Badge>
<Badge variant="destructive">Denegada</Badge>
<Badge variant="outline">Pagada</Badge>

// Custom colors (modify badge.tsx)
<Badge className="bg-green-500">Aprovada</Badge>
<Badge className="bg-yellow-500">En revisió</Badge>
```

### 2.9 Table Component

**For Admin Dashboard:**
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>Despeses pendents de revisió</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Número</TableHead>
      <TableHead>Usuari</TableHead>
      <TableHead>Import</TableHead>
      <TableHead>Data</TableHead>
      <TableHead>Accions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {expenses.map((expense) => (
      <TableRow key={expense.id}>
        <TableCell>{expense.invoiceNumber}</TableCell>
        <TableCell>{expense.userName}</TableCell>
        <TableCell>{expense.amount}€</TableCell>
        <TableCell>{expense.date}</TableCell>
        <TableCell>
          <Button size="sm">Revisar</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 2.10 Skeleton Component

**Loading States:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

function ExpenseListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-[100px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## 3. Radix UI Primitives Deep Dive

### 3.1 What Radix UI Provides

**Core Philosophy:**
- **Unstyled**: No default styling (you add CSS/Tailwind)
- **Accessible**: Full ARIA support, keyboard navigation, focus management
- **Composable**: Small primitives that work together
- **Customizable**: Complete control over behavior and appearance

**shadcn/ui Components Use These Radix Primitives:**
- `@radix-ui/react-dialog` → Dialog component
- `@radix-ui/react-dropdown-menu` → DropdownMenu component
- `@radix-ui/react-select` → Select component
- `@radix-ui/react-tabs` → Tabs component
- And many more...

### 3.2 Accessibility Features (Built-in)

**Keyboard Navigation**
- Tab/Shift+Tab: Navigate between focusable elements
- Enter/Space: Activate buttons, open dropdowns
- Escape: Close modals, dropdowns
- Arrow keys: Navigate menu items, select options

**ARIA Attributes** (automatically applied)
- `aria-label`, `aria-labelledby`
- `aria-expanded`, `aria-hidden`
- `aria-describedby`
- `role` attributes (dialog, menu, etc.)

**Focus Management**
- Auto-focus first interactive element in modals
- Restore focus when modal closes
- Focus trap inside modals (can't tab outside)

### 3.3 Known Accessibility Issues

**Important Caveats:**
While Radix UI aims for strong accessibility, an audit identified **35 accessibility issues** across various components. Key issues include:

1. **Focus Management**: Some components have focusable elements with `aria-hidden="true"` (violates WCAG 2.2 Level A - 2.1.1)
2. **Color Contrast**: Radix Colors system requires manual verification for WCAG compliance
3. **Screen Reader Compatibility**: Some edge cases with complex interactions

**Mitigation Strategy:**
- Test all forms with NVDA/VoiceOver
- Use axe DevTools during development
- Manual keyboard testing for all interactive flows
- Document any known issues for future fixes

### 3.4 When to Use Radix UI Directly

**Most of the time, use shadcn/ui components** (which wrap Radix UI)

**Use Radix UI directly when:**
- Building a custom component not in shadcn/ui
- Need lower-level control over behavior
- Implementing unique interaction patterns

**Example: Custom Tooltip (not in shadcn/ui by default)**
```bash
npm install @radix-ui/react-tooltip
```

```tsx
import * as Tooltip from '@radix-ui/react-tooltip'

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button>Hover me</button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className="bg-black text-white px-2 py-1 rounded">
        This is a tooltip
        <Tooltip.Arrow className="fill-black" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

---

## 4. Lucide React Icons

### 4.1 Why Lucide Over Other Icon Libraries

**Comparison:**
| Feature | Lucide React | React Icons | Heroicons |
|---------|--------------|-------------|-----------|
| Bundle Size | ~1KB per icon | ~50KB+ | ~2KB per icon |
| Tree-shakable | ✅ Yes | ⚠️ Partial | ✅ Yes |
| TypeScript | ✅ Full support | ⚠️ Limited | ✅ Full support |
| Icon Count | 1000+ | 3000+ (mixed quality) | 200+ |
| Active Development | ✅ Weekly updates | ✅ Active | ✅ Active |
| License | ISC | MIT | MIT |

**Lucide Advantages:**
- Fully tree-shakable (only icons you import are bundled)
- Consistent design language
- Optimized SVGs
- TypeScript-first

### 4.2 Installation & Setup

```bash
npm install lucide-react
```

**No additional configuration needed!**

### 4.3 Basic Usage

**Import Icons:**
```tsx
import { Camera, Upload, Check, X, AlertCircle } from 'lucide-react'

function Example() {
  return (
    <div>
      <Camera />
      <Upload size={24} />
      <Check color="green" />
      <X strokeWidth={3} />
      <AlertCircle className="text-red-500" />
    </div>
  )
}
```

**Available Props:**
- `size`: Number (default 24)
- `color`: String (any CSS color)
- `strokeWidth`: Number (default 2)
- `className`: String (for Tailwind classes)
- All SVG attributes: `width`, `height`, `fill`, etc.

### 4.4 Essential Icons for Expense System

**Navigation & Actions:**
```tsx
import {
  Home,           // Home page
  Receipt,        // Expenses list
  PlusCircle,     // New expense (FAB)
  User,           // Profile
  Settings,       // Settings
  LogOut,         // Logout
  Menu,           // Mobile menu
  ChevronLeft,    // Back navigation
  ChevronRight,   // Forward navigation
} from 'lucide-react'
```

**Form & Input:**
```tsx
import {
  Camera,         // Take photo
  Upload,         // Upload file
  Calendar,       // Date picker
  Search,         // Search input
  Filter,         // Filter dropdown
  X,              // Close/clear
  Check,          // Success/confirm
  Eye,            // Show/preview
  EyeOff,         // Hide
} from 'lucide-react'
```

**Status & Feedback:**
```tsx
import {
  Clock,          // Pending status
  CheckCircle,    // Approved status
  XCircle,        // Declined status
  AlertCircle,    // Warning/info
  Info,           // Information
  Loader2,        // Loading spinner
  TrendingUp,     // Increase
  TrendingDown,   // Decrease
} from 'lucide-react'
```

**Admin Actions:**
```tsx
import {
  FileText,       // Expense detail
  Download,       // Export data
  Trash2,         // Delete
  Edit,           // Edit
  MoreVertical,   // More options menu
  Users,          // User management
  BarChart,       // Analytics
} from 'lucide-react'
```

### 4.5 Icon Button Pattern

**Accessible Icon-Only Button:**
```tsx
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

<Button
  size="icon"
  variant="ghost"
  aria-label="Eliminar despesa"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

**Icon + Text Button:**
```tsx
import { Camera } from 'lucide-react'

<Button>
  <Camera className="mr-2 h-4 w-4" />
  Fer foto
</Button>
```

### 4.6 Animated Icons

**Loading Spinner:**
```tsx
import { Loader2 } from 'lucide-react'

<Loader2 className="h-4 w-4 animate-spin" />
```

**Custom Animation:**
```tsx
import { TrendingUp } from 'lucide-react'

<TrendingUp className="h-5 w-5 animate-bounce text-green-500" />
```

### 4.7 Dynamic Icon Loading (Advanced)

**For performance optimization:**
```tsx
// Import dynamically only when needed
const DynamicIcon = dynamic(() => import('lucide-react').then(mod => mod.Camera))
```

---

## 5. React Hook Form + Zod Integration

### 5.1 Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

### 5.2 Why This Combination?

**React Hook Form Benefits:**
- Minimal re-renders (better performance than Formik)
- Uncontrolled inputs (less React state updates)
- Small bundle size (~8KB)
- Easy integration with UI libraries
- Built-in validation support

**Zod Benefits:**
- TypeScript-native (type inference)
- Runtime validation
- Composable schemas
- Excellent error messages
- Reusable across client and server

### 5.3 Basic Schema Definition

**Expense Form Schema:**
```tsx
import { z } from "zod"

export const expenseFormSchema = z.object({
  invoiceNumber: z.string()
    .min(1, "El número de factura és obligatori")
    .max(50, "Màxim 50 caràcters"),

  vendor: z.string()
    .min(2, "El nom del proveïdor és obligatori")
    .max(100, "Màxim 100 caràcters"),

  invoiceDate: z.date({
    required_error: "La data és obligatòria",
  }),

  category: z.enum([
    "transport",
    "food",
    "accommodation",
    "materials",
    "other"
  ], {
    errorMap: () => ({ message: "Selecciona una categoria" })
  }),

  subtotal: z.number({
    invalid_type_error: "Ha de ser un número",
  }).positive("L'import ha de ser positiu"),

  vatRate: z.number()
    .min(0, "L'IVA no pot ser negatiu")
    .max(100, "L'IVA no pot ser superior al 100%")
    .default(21),

  description: z.string()
    .max(500, "Màxim 500 caràcters")
    .optional(),

  receipt: z.instanceof(File, { message: "La factura és obligatòria" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "Màxim 5MB")
    .refine(
      (file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      "Només JPG, PNG o PDF"
    ),
})

// Auto-calculate total
.transform((data) => ({
  ...data,
  vatAmount: data.subtotal * (data.vatRate / 100),
  totalAmount: data.subtotal * (1 + data.vatRate / 100),
}))

// Type inference
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
```

### 5.4 Advanced Validation Patterns

**Conditional Validation:**
```tsx
const schema = z.object({
  expenseType: z.enum(["transport", "accommodation", "other"]),
  kilometers: z.number().optional(),
  nights: z.number().optional(),
}).superRefine((data, ctx) => {
  // Transport requires kilometers
  if (data.expenseType === "transport" && !data.kilometers) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Els quilòmetres són obligatoris per transport",
      path: ["kilometers"],
    })
  }

  // Accommodation requires nights
  if (data.expenseType === "accommodation" && !data.nights) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Les nits són obligatòries per allotjament",
      path: ["nights"],
    })
  }
})
```

**Cross-Field Validation:**
```tsx
const schema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "La data final no pot ser anterior a la data inicial",
  path: ["endDate"],
})
```

**NIF/CIF Validation (Spain):**
```tsx
const nifRegex = /^[A-Z]\d{8}$/
const cifRegex = /^[A-Z]\d{7}[A-Z0-9]$/

const taxIdSchema = z.string()
  .refine((val) => nifRegex.test(val) || cifRegex.test(val), {
    message: "Format NIF/CIF invàlid (exemple: A12345678)",
  })
```

### 5.5 Form Hook Setup

**Complete Form Setup:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { expenseFormSchema, ExpenseFormValues } from "./schemas"

function ExpenseForm() {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    mode: "onBlur", // Validate on blur (better UX than onChange)
    defaultValues: {
      invoiceNumber: "",
      vendor: "",
      category: "other",
      vatRate: 21,
      description: "",
    },
  })

  async function onSubmit(values: ExpenseFormValues) {
    try {
      // API call
      await submitExpense(values)

      // Success feedback
      toast({
        title: "Despesa enviada!",
        description: "Rebràs un email quan sigui revisada",
      })

      // Reset form
      form.reset()
    } catch (error) {
      // Error handling
      toast({
        variant: "destructive",
        title: "Error",
        description: "No s'ha pogut enviar la despesa",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### 5.6 Performance Optimization

**Watch Specific Fields Only:**
```tsx
// ❌ Bad: Watches entire form (re-renders on every change)
const formValues = form.watch()

// ✅ Good: Watch only what you need
const expenseType = form.watch("expenseType")
const subtotal = form.watch("subtotal")
```

**Conditional Rendering Based on Field Values:**
```tsx
const expenseType = form.watch("expenseType")

return (
  <>
    <FormField name="expenseType" {...} />

    {expenseType === "transport" && (
      <FormField name="kilometers" {...} />
    )}

    {expenseType === "accommodation" && (
      <FormField name="nights" {...} />
    )}
  </>
)
```

### 5.7 File Upload with React Hook Form

**File Input Pattern:**
```tsx
<FormField
  control={form.control}
  name="receipt"
  render={({ field: { value, onChange, ...fieldProps } }) => (
    <FormItem>
      <FormLabel>Factura</FormLabel>
      <FormControl>
        <Input
          {...fieldProps}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            onChange(file)
          }}
        />
      </FormControl>
      <FormDescription>
        Màxim 5MB. Formats: JPG, PNG, PDF
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**File Preview:**
```tsx
const receiptFile = form.watch("receipt")

{receiptFile && (
  <div className="mt-2">
    <img
      src={URL.createObjectURL(receiptFile)}
      alt="Preview"
      className="max-w-xs rounded-lg border"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => form.setValue("receipt", undefined)}
    >
      Eliminar
    </Button>
  </div>
)}
```

---

## 6. Utility Functions & Helpers

### 6.1 cn() Function (Class Name Utility)

**Location:** `src/lib/utils.ts`

**Purpose:** Intelligently merge Tailwind classes

```tsx
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:**
```tsx
// Merge classes without conflicts
<div className={cn(
  "px-4 py-2",
  isActive && "bg-blue-500",
  isPending && "opacity-50",
  className // Allow prop overrides
)} />

// Conditionals
<Button className={cn(
  "text-white",
  variant === "primary" && "bg-blue-600",
  variant === "secondary" && "bg-gray-600",
)} />
```

**Why Not Just String Concatenation?**
```tsx
// ❌ Problem: px-4 and px-6 both apply (last one wins randomly)
className="px-4 " + "px-6" // → "px-4 px-6"

// ✅ Solution: twMerge removes conflicts
cn("px-4", "px-6") // → "px-6"
```

### 6.2 Format Utilities for Catalan

**Create:** `src/lib/formatters.ts`

```tsx
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ca-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Ara mateix"
  if (diffInSeconds < 3600) return `Fa ${Math.floor(diffInSeconds / 60)} minuts`
  if (diffInSeconds < 86400) return `Fa ${Math.floor(diffInSeconds / 3600)} hores`
  if (diffInSeconds < 604800) return `Fa ${Math.floor(diffInSeconds / 86400)} dies`

  return formatShortDate(date)
}
```

**Usage:**
```tsx
import { formatCurrency, formatDate } from "@/lib/formatters"

<p>{formatCurrency(45.50)}</p> // → "45,50 €"
<p>{formatDate(new Date())}</p> // → "15 de gener de 2025"
```

---

## 7. Styling & Theming

### 7.1 CSS Variables Approach

**Location:** `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%; /* Blue */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%; /* Red */
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode colors */
  }
}
```

**Benefits:**
- Change entire color scheme by updating CSS variables
- Easy to implement dark mode
- Semantic color names (primary, destructive, etc.)

### 7.2 Custom Color Palette for Youth Ministry

**Modify CSS variables for warmer, youth-friendly palette:**

```css
:root {
  /* Primary: Warm blue (trust + friendly) */
  --primary: 205 100% 50%; /* #0099ff */

  /* Secondary: Warm orange (energy) */
  --secondary: 25 95% 53%; /* #f97316 */

  /* Success: Bright green */
  --success: 142 76% 36%; /* #059669 */

  /* Destructive: Vibrant red */
  --destructive: 0 84% 60%; /* #dc2626 */

  /* Background: Warm white */
  --background: 40 33% 99%; /* #fafaf9 */
}
```

### 7.3 Dark Mode (Future Enhancement)

**Add dark mode toggle:**
```tsx
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <Moon /> : <Sun />}
    </Button>
  )
}
```

---

## 8. Testing Strategy for Components

### 8.1 Unit Testing Forms

```tsx
import { render, screen, userEvent } from '@testing-library/react'
import { ExpenseForm } from './ExpenseForm'

describe('ExpenseForm', () => {
  it('shows validation errors for empty required fields', async () => {
    render(<ExpenseForm />)

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await userEvent.click(submitButton)

    expect(screen.getByText(/número de factura obligatori/i)).toBeInTheDocument()
  })

  it('calculates VAT and total automatically', async () => {
    render(<ExpenseForm />)

    const subtotalInput = screen.getByLabelText(/subtotal/i)
    await userEvent.type(subtotalInput, '100')

    // Assuming auto-calculation happens
    expect(screen.getByLabelText(/iva/i)).toHaveValue('21.00')
    expect(screen.getByLabelText(/total/i)).toHaveValue('121.00')
  })
})
```

### 8.2 Accessibility Testing

```bash
npm install -D @axe-core/react vitest-axe
```

```tsx
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('ExpenseForm has no accessibility violations', async () => {
  const { container } = render(<ExpenseForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 9. Bundle Size Optimization

### 9.1 Tree-Shaking Verification

**Check what's being bundled:**
```bash
npm run build
npx vite-bundle-visualizer
```

### 9.2 Code Splitting

**Lazy load admin routes:**
```tsx
import { lazy, Suspense } from 'react'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  )
}
```

### 9.3 Expected Bundle Sizes

**Production Build Estimates:**
```
React + React DOM: ~45KB
Tailwind CSS (purged): ~10KB
shadcn/ui components (10 components): ~15KB
Lucide icons (20 icons): ~5KB
React Hook Form + Zod: ~15KB
Other dependencies: ~10KB

Total: ~100KB (minified + gzipped)
```

---

## 10. Migration Path & Best Practices

### 10.1 Component Development Workflow

1. **Add shadcn/ui component:** `npx shadcn-ui@latest add [component]`
2. **Use as-is initially:** Don't customize until you know what you need
3. **Customize when needed:** Modify the component file directly
4. **Document customizations:** Add comments explaining changes
5. **Consider extracting:** If used in multiple places, create a wrapper

### 10.2 Customization Example

**Create custom wrapper for frequently used components:**

```tsx
// components/expense/StatusBadge.tsx
import { Badge } from "@/components/ui/badge"
import { Check, Clock, X, DollarSign } from "lucide-react"

type Status = "draft" | "pending" | "approved" | "declined" | "paid"

const statusConfig = {
  draft: { label: "Esborrany", variant: "secondary", icon: Clock },
  pending: { label: "Pendent", variant: "warning", icon: Clock },
  approved: { label: "Aprovada", variant: "success", icon: Check },
  declined: { label: "Denegada", variant: "destructive", icon: X },
  paid: { label: "Pagada", variant: "default", icon: DollarSign },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant as any}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
```

### 10.3 Folder Structure Recommendation

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── expense/               # Domain-specific components
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ReceiptUpload.tsx
│   ├── admin/                 # Admin-only components
│   │   ├── ApprovalQueue.tsx
│   │   └── ExpenseTable.tsx
│   └── layout/                # Layout components
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── lib/
│   ├── utils.ts               # cn() function
│   ├── formatters.ts          # Date, currency formatters
│   └── validators.ts          # Zod schemas
└── ...
```

---

## 11. Official Documentation Links

- **shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/primitives
- **Lucide React**: https://lucide.dev/guide/packages/lucide-react
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **class-variance-authority**: https://cva.style/docs

---

## 12. Next Steps for Architecture Phase

The architecture team should:

1. **Finalize Component List**: Determine all components needed for MVP
2. **Create Component API Documentation**: Props, variants, usage examples
3. **Define Form Schemas**: All Zod schemas for the application
4. **Design Component Composition**: How components work together
5. **Setup Storybook** (optional): Component playground and documentation
6. **Create Design Tokens**: Finalize colors, spacing, typography
7. **Build Prototype**: Interactive prototype of key user flows

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: PACT Preparer
**Status**: Ready for Architecture Review
