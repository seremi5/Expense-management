# Performance Optimization: React, API, and Database

## Executive Summary

This document provides comprehensive performance optimization strategies for the Expense Reimbursement System to achieve the <3 second submission time target. Optimizations cover React frontend, Node.js backend, PostgreSQL database, and network layer.

**Performance Targets**:
- Page Load: <2 seconds (First Contentful Paint)
- Expense Submission: <3 seconds (end-to-end)
- API Response Time: <500ms (p95)
- Database Queries: <100ms (p95)

**Key Strategies**:
- Code splitting and lazy loading
- React memoization and virtualization
- Database indexing and query optimization
- CDN and edge caching
- Image optimization and compression

---

## 1. React Performance Optimization

### Code Splitting with React.lazy

```typescript
// App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submit" element={<ExpenseForm />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### Component-Level Code Splitting

```typescript
// Lazy load heavy components
const PDFViewer = lazy(() => import('./components/PDFViewer'))
const ChartComponent = lazy(() => import('./components/Chart'))

function ExpenseDetails() {
  const [showPDF, setShowPDF] = useState(false)

  return (
    <div>
      <button onClick={() => setShowPDF(true)}>View Receipt</button>

      {showPDF && (
        <Suspense fallback={<div>Loading PDF...</div>}>
          <PDFViewer url={receiptUrl} />
        </Suspense>
      )}
    </div>
  )
}
```

### React.memo for Pure Components

```typescript
import { memo } from 'react'

interface ExpenseRowProps {
  expense: Expense
  onSelect: (id: string) => void
}

// Only re-renders when props change
export const ExpenseRow = memo(({ expense, onSelect }: ExpenseRowProps) => {
  return (
    <tr onClick={() => onSelect(expense.id)}>
      <td>{expense.invoice_number}</td>
      <td>{expense.vendor_name}</td>
      <td>{expense.total_amount}€</td>
    </tr>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.expense.id === nextProps.expense.id &&
         prevProps.expense.updated_at === nextProps.expense.updated_at
})
```

### useMemo for Expensive Calculations

```typescript
import { useMemo } from 'react'

function ExpenseSummary({ expenses }: { expenses: Expense[] }) {
  // Memoize calculation - only recomputes when expenses change
  const statistics = useMemo(() => {
    return {
      total: expenses.reduce((sum, e) => sum + e.total_amount, 0),
      average: expenses.length > 0
        ? expenses.reduce((sum, e) => sum + e.total_amount, 0) / expenses.length
        : 0,
      byStatus: expenses.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }, [expenses]) // Dependency array

  return (
    <div>
      <p>Total: {statistics.total}€</p>
      <p>Average: {statistics.average.toFixed(2)}€</p>
    </div>
  )
}
```

### useCallback for Function Stability

```typescript
import { useCallback, useState } from 'react'

function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  // Function reference stays stable across renders
  const handleDelete = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }, []) // No dependencies

  return (
    <div>
      {expenses.map(expense => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          onDelete={handleDelete} // Stable reference prevents ExpenseRow re-render
        />
      ))}
    </div>
  )
}
```

### Virtual Scrolling for Large Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 5, // Render 5 extra items for smooth scrolling
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ExpenseRow expense={expenses[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Debouncing User Input

```typescript
import { useState, useCallback } from 'react'
import { debounce } from 'lodash-es'

function SearchExpenses() {
  const [results, setResults] = useState<Expense[]>([])

  // Debounce API calls - only execute after 300ms of no typing
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      const response = await fetch(`/api/expenses/search?q=${query}`)
      const data = await response.json()
      setResults(data)
    }, 300),
    []
  )

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search expenses..."
    />
  )
}
```

---

## 2. Bundle Size Optimization

### Analyze Bundle Size

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

### Tree Shaking and Dead Code Elimination

```typescript
// ❌ Imports entire library
import _ from 'lodash'

// ✅ Import only what you need
import debounce from 'lodash-es/debounce'
import groupBy from 'lodash-es/groupBy'
```

### Dynamic Imports for Heavy Libraries

```typescript
// Load date-fns only when needed
async function formatDate(date: Date) {
  const { format } = await import('date-fns')
  return format(date, 'dd/MM/yyyy')
}

// Load chart library only when chart is visible
const [ChartLib, setChartLib] = useState(null)

useEffect(() => {
  if (showChart) {
    import('recharts').then(module => setChartLib(module))
  }
}, [showChart])
```

### Manual Code Splitting

**vite.config.ts**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],

          // Feature chunks
          'admin': ['./src/pages/Admin', './src/components/admin'],
          'charts': ['recharts', './src/components/charts'],
        },
      },
    },
  },
})
```

---

## 3. Image and Asset Optimization

### Image Optimization

```typescript
// components/OptimizedImage.tsx
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
}

export function OptimizedImage({ src, alt, width, height }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div style={{ position: 'relative', width, height }}>
      {!isLoaded && (
        <div className="skeleton" style={{ width, height }} />
      )}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy" // Native lazy loading
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
      />
    </div>
  )
}
```

### Responsive Images

```typescript
<picture>
  <source
    srcSet={`${receiptUrl}?w=400 400w, ${receiptUrl}?w=800 800w`}
    sizes="(max-width: 768px) 400px, 800px"
    type="image/webp"
  />
  <img
    src={receiptUrl}
    alt="Receipt"
    loading="lazy"
  />
</picture>
```

### Image Compression (Backend)

```typescript
import sharp from 'sharp'

async function optimizeReceiptImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer()
}
```

---

## 4. API Performance Optimization

### Response Caching

```typescript
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 }) // 5 minute TTL

router.get('/expenses/stats', authenticate, async (req, res) => {
  const cacheKey = `stats:${req.userId}`

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  // Compute stats
  const stats = await computeExpenseStats(req.userId!)

  // Store in cache
  cache.set(cacheKey, stats)

  res.json(stats)
})
```

### Database Query Optimization

**Add Indexes**:
```sql
-- Index for user's expenses sorted by date
CREATE INDEX idx_expenses_user_date ON expenses(user_id, invoice_date DESC);

-- Index for admin dashboard (status + date)
CREATE INDEX idx_expenses_status_date ON expenses(status, submitted_at DESC);

-- Composite index for common filter combinations
CREATE INDEX idx_expenses_user_status ON expenses(user_id, status);

-- Index for search
CREATE INDEX idx_expenses_vendor_search ON expenses USING gin(to_tsvector('simple', vendor_name));
```

**Optimize Queries**:
```typescript
// ❌ N+1 Query Problem
const expenses = await db.query.expenses.findMany()
for (const expense of expenses) {
  expense.user = await db.query.profiles.findFirst({
    where: eq(profiles.id, expense.userId)
  })
}

// ✅ Single Query with Join
const expenses = await db
  .select()
  .from(expenses)
  .leftJoin(profiles, eq(expenses.userId, profiles.id))
```

**Pagination**:
```typescript
interface PaginationParams {
  page: number
  limit: number
}

async function getExpenses({ page, limit }: PaginationParams) {
  const offset = (page - 1) * limit

  const [expenses, totalCount] = await Promise.all([
    db
      .select()
      .from(expenses)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(expenses.created_at)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(expenses),
  ])

  return {
    data: expenses,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / limit),
    },
  }
}
```

### Connection Pooling

```typescript
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10, // Maximum pool size
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: true, // Use prepared statements
})
```

### Parallel Processing

```typescript
// ❌ Sequential
const user = await getUser(userId)
const expenses = await getExpenses(userId)
const stats = await getStats(userId)

// ✅ Parallel
const [user, expenses, stats] = await Promise.all([
  getUser(userId),
  getExpenses(userId),
  getStats(userId),
])
```

---

## 5. Network Performance

### HTTP/2 Server Push

```typescript
// In your Express server
import spdy from 'spdy'

const server = spdy.createServer(
  {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
  },
  app
)

// Push critical resources
app.get('/', (req, res) => {
  const stream = res.push('/styles.css', {
    status: 200,
    method: 'GET',
    request: { accept: '*/*' },
    response: { 'content-type': 'text/css' },
  })

  stream.end(cssContent)
  res.send(htmlContent)
})
```

### Compression

```typescript
import compression from 'compression'

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
}))
```

### CDN and Edge Caching

**Cloudflare Setup**:
```typescript
// Set cache headers for static assets
router.get('/assets/*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  // ... serve asset
})

// Set cache headers for API responses
router.get('/api/expenses', (req, res) => {
  res.setHeader('Cache-Control', 'private, max-age=60') // 1 minute
  // ... return expenses
})
```

---

## 6. Database Performance

### Query Analysis

```sql
-- Explain query execution
EXPLAIN ANALYZE
SELECT * FROM expenses
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 20;

-- Look for:
-- - Sequential scans (bad, need index)
-- - Index scans (good)
-- - High execution time
```

### Materialized Views for Complex Queries

```sql
-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW expense_stats AS
SELECT
  user_id,
  COUNT(*) as total_expenses,
  SUM(total_amount) as total_amount,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_count
FROM expenses
GROUP BY user_id;

-- Create index on materialized view
CREATE INDEX idx_expense_stats_user ON expense_stats(user_id);

-- Refresh periodically (via cron)
REFRESH MATERIALIZED VIEW expense_stats;
```

### Database Connection Pooling

See Supabase documentation (03_supabase_setup.md) for Supavisor configuration.

---

## 7. Frontend Loading Strategies

### Skeleton Screens

```typescript
function ExpenseTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  )
}

function ExpenseTable() {
  const { data, isLoading } = useQuery('expenses', fetchExpenses)

  if (isLoading) return <ExpenseTableSkeleton />

  return <table>{/* ... */}</table>
}
```

### Progressive Enhancement

```typescript
function ExpenseForm() {
  const [isOCRReady, setIsOCRReady] = useState(false)

  useEffect(() => {
    // Load OCR worker in background
    import('@/lib/ocr-worker').then(() => setIsOCRReady(true))
  }, [])

  return (
    <form>
      {/* Form works without OCR, enhanced when loaded */}
      {isOCRReady && <OCRButton />}
    </form>
  )
}
```

---

## 8. Monitoring and Metrics

### Web Vitals Tracking

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  })
}

onCLS(sendToAnalytics)
onFID(sendToAnalytics)
onLCP(sendToAnalytics)
onFCP(sendToAnalytics)
onTTFB(sendToAnalytics)
```

### Performance Budget

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split into reasonable chunks
        },
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 500, // 500 KB
  },
})
```

---

## 9. Backend Performance

### Async/Await Best Practices

```typescript
// ❌ Unnecessary await
async function processExpense(id: string) {
  const expense = await getExpense(id)
  await sendEmail(expense) // Blocks
  return expense
}

// ✅ Fire and forget
async function processExpense(id: string) {
  const expense = await getExpense(id)
  sendEmail(expense) // Don't await
  return expense
}

// ✅ Or use queue
async function processExpense(id: string) {
  const expense = await getExpense(id)
  emailQueue.add({ expenseId: id })
  return expense
}
```

### Worker Threads for CPU-Intensive Tasks

```typescript
import { Worker } from 'worker_threads'

function processLargeDataset(data: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', {
      workerData: data,
    })

    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}
```

---

## 10. Performance Checklist

### Pre-Launch Optimization Audit

- ✅ Bundle size < 300 KB (gzipped)
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Cumulative Layout Shift < 0.1
- ✅ API responses < 500ms (p95)
- ✅ Database queries indexed
- ✅ Images optimized and lazy loaded
- ✅ Code split by route
- ✅ Critical CSS inlined
- ✅ Fonts optimized
- ✅ Compression enabled
- ✅ CDN configured
- ✅ Caching strategy implemented

---

## 11. Official Resources

- **Web Vitals**: https://web.dev/vitals/
- **React Performance**: https://react.dev/learn/render-and-commit
- **Vite Performance**: https://vitejs.dev/guide/performance.html
- **PostgreSQL Tuning**: https://www.postgresql.org/docs/current/performance-tips.html

---

## 12. Next Steps for Architecture

The architecture team should design:
1. Performance monitoring dashboard
2. Load testing strategy
3. Caching layer architecture
4. CDN configuration
5. Database indexing strategy
6. Bundle splitting strategy
7. API response compression
8. Performance regression testing
