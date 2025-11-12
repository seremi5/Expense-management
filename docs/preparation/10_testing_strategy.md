# Testing Strategy: Unit, Integration, and E2E Testing

## Executive Summary

This document provides a comprehensive testing strategy for the Expense Reimbursement System, covering unit tests, integration tests, and end-to-end tests. The recommended approach uses **Vitest for unit/integration tests** and **Playwright for E2E tests**, providing fast feedback loops and reliable automated testing.

**Testing Pyramid**:
- **70% Unit Tests**: Fast, isolated component/function tests
- **20% Integration Tests**: API endpoints, database operations
- **10% E2E Tests**: Critical user journeys

**Target Coverage**: >80% code coverage for business logic

---

## 1. Testing Stack Overview

### Recommended Tools

| Type | Tool | Why |
|------|------|-----|
| Unit/Integration | **Vitest** | Fast, Vite-native, compatible with Jest |
| Component Testing | **React Testing Library** | User-centric, accessibility-focused |
| E2E Testing | **Playwright** | Multi-browser, fast, reliable |
| Mocking | **MSW** | Network request mocking |
| Coverage | **Vitest** | Built-in coverage with c8/istanbul |

### Installation

```bash
# Frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui @vitest/coverage-v8
npm install -D msw

# E2E
npm install -D @playwright/test
npx playwright install
```

---

## 2. Unit Testing with Vitest

### Vitest Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      threshold: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**src/test/setup.ts**:
```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
vi.mock('@/lib/env', () => ({
  VITE_API_URL: 'http://localhost:3001',
  VITE_SUPABASE_URL: 'http://localhost:54321',
}))
```

### Testing Utilities

```typescript
// utils/calculateVAT.ts
export function calculateVAT(subtotal: number, vatRate: number): number {
  return Math.round(subtotal * (vatRate / 100) * 100) / 100
}

export function calculateTotal(subtotal: number, vatRate: number): number {
  const vat = calculateVAT(subtotal, vatRate)
  return Math.round((subtotal + vat) * 100) / 100
}

// utils/calculateVAT.test.ts
import { describe, it, expect } from 'vitest'
import { calculateVAT, calculateTotal } from './calculateVAT'

describe('calculateVAT', () => {
  it('calculates 21% VAT correctly', () => {
    expect(calculateVAT(100, 21)).toBe(21)
  })

  it('calculates 10% VAT correctly', () => {
    expect(calculateVAT(100, 10)).toBe(10)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateVAT(33.33, 21)).toBe(7.00)
  })

  it('handles zero amounts', () => {
    expect(calculateVAT(0, 21)).toBe(0)
  })
})

describe('calculateTotal', () => {
  it('calculates total with VAT', () => {
    expect(calculateTotal(100, 21)).toBe(121)
  })

  it('handles edge cases', () => {
    expect(calculateTotal(0, 21)).toBe(0)
    expect(calculateTotal(100, 0)).toBe(100)
  })
})
```

### Testing Validation Logic

```typescript
// validation/expense.test.ts
import { describe, it, expect } from 'vitest'
import { createExpenseSchema } from './expense'

describe('Expense Validation', () => {
  it('validates correct expense data', () => {
    const validData = {
      invoiceNumber: 'FAC-2025-001',
      invoiceDate: new Date('2025-01-15'),
      vendorName: 'Proveïdor SL',
      vendorTaxId: 'B12345678',
      amount: 125.50,
    }

    const result = createExpenseSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid invoice number', () => {
    const invalidData = {
      invoiceNumber: '', // Empty
      invoiceDate: new Date(),
      vendorName: 'Vendor',
      amount: 100,
    }

    const result = createExpenseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Invoice number required')
    }
  })

  it('rejects future dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    const result = createExpenseSchema.safeParse({
      invoiceNumber: 'FAC-001',
      invoiceDate: futureDate,
      vendorName: 'Vendor',
      amount: 100,
    })

    expect(result.success).toBe(false)
  })

  it('validates NIF/CIF format', () => {
    const validNIF = createExpenseSchema.safeParse({
      invoiceNumber: 'FAC-001',
      invoiceDate: new Date(),
      vendorName: 'Vendor',
      vendorTaxId: 'B12345678', // Valid
      amount: 100,
    })
    expect(validNIF.success).toBe(true)

    const invalidNIF = createExpenseSchema.safeParse({
      invoiceNumber: 'FAC-001',
      invoiceDate: new Date(),
      vendorName: 'Vendor',
      vendorTaxId: '12345678', // Missing letter
      amount: 100,
    })
    expect(invalidNIF.success).toBe(false)
  })
})
```

---

## 3. Component Testing

### Testing React Components

```typescript
// components/ExpenseRow.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseRow } from './ExpenseRow'

describe('ExpenseRow', () => {
  const mockExpense = {
    id: '123',
    invoice_number: 'FAC-2025-001',
    vendor_name: 'Proveïdor SL',
    total_amount: 125.50,
    status: 'pending_review',
    created_at: new Date('2025-01-15'),
  }

  it('renders expense data correctly', () => {
    render(<ExpenseRow expense={mockExpense} onSelect={() => {}} />)

    expect(screen.getByText('FAC-2025-001')).toBeInTheDocument()
    expect(screen.getByText('Proveïdor SL')).toBeInTheDocument()
    expect(screen.getByText('125.50€')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()

    render(<ExpenseRow expense={mockExpense} onSelect={handleSelect} />)

    await user.click(screen.getByRole('row'))

    expect(handleSelect).toHaveBeenCalledWith('123')
  })

  it('displays status badge', () => {
    render(<ExpenseRow expense={mockExpense} onSelect={() => {}} />)

    expect(screen.getByText('Pendent de revisió')).toBeInTheDocument()
  })
})
```

### Testing Forms

```typescript
// components/ExpenseForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from './ExpenseForm'

describe('ExpenseForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()

    render(<ExpenseForm onSubmit={handleSubmit} />)

    // Fill form
    await user.type(screen.getByLabelText(/número de factura/i), 'FAC-2025-001')
    await user.type(screen.getByLabelText(/proveïdor/i), 'Proveïdor SL')
    await user.type(screen.getByLabelText(/import/i), '125.50')

    // Submit
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        invoiceNumber: 'FAC-2025-001',
        vendorName: 'Proveïdor SL',
        amount: 125.50,
      })
    })
  })

  it('shows validation errors', async () => {
    const user = userEvent.setup()

    render(<ExpenseForm onSubmit={() => {}} />)

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    // Assert errors shown
    await waitFor(() => {
      expect(screen.getByText(/número de factura.*obligatori/i)).toBeInTheDocument()
      expect(screen.getByText(/proveïdor.*obligatori/i)).toBeInTheDocument()
    })
  })

  it('disables submit during submission', async () => {
    const user = userEvent.setup()
    const slowSubmit = () => new Promise(resolve => setTimeout(resolve, 1000))

    render(<ExpenseForm onSubmit={slowSubmit} />)

    // Fill and submit
    await user.type(screen.getByLabelText(/número de factura/i), 'FAC-001')
    await user.type(screen.getByLabelText(/proveïdor/i), 'Vendor')
    await user.type(screen.getByLabelText(/import/i), '100')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    // Assert button disabled during submission
    expect(submitButton).toBeDisabled()
  })
})
```

### Testing Hooks

```typescript
// hooks/useExpenses.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useExpenses } from './useExpenses'

// Mock fetch
global.fetch = vi.fn()

describe('useExpenses', () => {
  it('fetches expenses successfully', async () => {
    const mockExpenses = [
      { id: '1', invoice_number: 'FAC-001', amount: 100 },
      { id: '2', invoice_number: 'FAC-002', amount: 200 },
    ]

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExpenses,
    })

    const { result } = renderHook(() => useExpenses())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.expenses).toEqual(mockExpenses)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch errors', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useExpenses())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.expenses).toEqual([])
  })
})
```

---

## 4. Integration Testing (API)

### Testing API Endpoints

```typescript
// routes/expenses.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { db } from '../db'
import { generateTestToken } from '../test/helpers'

describe('Expense API', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Setup test database
    await db.migrate.latest()
  })

  afterAll(async () => {
    // Cleanup
    await db.migrate.rollback()
    await db.destroy()
  })

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: await hashPassword('password'),
      fullName: 'Test User',
    }).returning()

    userId = user[0].id
    authToken = generateTestToken({ userId, role: 'user' })
  })

  describe('POST /api/expenses', () => {
    it('creates expense successfully', async () => {
      const expenseData = {
        invoiceNumber: 'FAC-2025-001',
        vendorName: 'Proveïdor SL',
        amount: 125.50,
        vatAmount: 26.36,
        totalAmount: 151.86,
      }

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        invoiceNumber: 'FAC-2025-001',
        vendorName: 'Proveïdor SL',
        userId,
      })
    })

    it('requires authentication', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({})

      expect(response.status).toBe(401)
    })

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invoiceNumber: 'FAC-001' }) // Missing required fields

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('validation')
    })
  })

  describe('GET /api/expenses', () => {
    it('returns user expenses', async () => {
      // Create test expenses
      await db.insert(expenses).values([
        { userId, invoiceNumber: 'FAC-001', amount: 100 },
        { userId, invoiceNumber: 'FAC-002', amount: 200 },
      ])

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
    })

    it('does not return other users expenses', async () => {
      // Create expense for another user
      const otherUser = await createTestUser()
      await db.insert(expenses).values({
        userId: otherUser.id,
        invoiceNumber: 'FAC-001',
        amount: 100,
      })

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(0)
    })
  })
})
```

---

## 5. E2E Testing with Playwright

### Playwright Configuration

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```typescript
// e2e/expense-submission.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Expense Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
  })

  test('submits expense successfully', async ({ page }) => {
    // Navigate to new expense
    await page.click('text=Nova despesa')
    await expect(page).toHaveURL('/expenses/new')

    // Fill form
    await page.fill('[name="invoiceNumber"]', 'FAC-2025-001')
    await page.fill('[name="vendorName"]', 'Proveïdor SL')
    await page.fill('[name="amount"]', '125.50')

    // Upload receipt
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-data/sample-invoice.pdf')

    // Wait for upload
    await expect(page.locator('text=Fitxer carregat')).toBeVisible()

    // Submit
    await page.click('button:has-text("Enviar despesa")')

    // Verify success
    await expect(page.locator('text=Despesa enviada correctament')).toBeVisible()
    await expect(page).toHaveURL(/\/expenses\/\w+/)
  })

  test('validates required fields', async ({ page }) => {
    await page.click('text=Nova despesa')

    // Submit empty form
    await page.click('button:has-text("Enviar despesa")')

    // Check validation errors
    await expect(page.locator('text=número de factura.*obligatori')).toBeVisible()
    await expect(page.locator('text=proveïdor.*obligatori')).toBeVisible()
  })

  test('OCR auto-fills data from receipt', async ({ page }) => {
    await page.click('text=Nova despesa')

    // Upload receipt
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./test-data/sample-invoice.pdf')

    // Wait for OCR processing
    await expect(page.locator('text=Processant factura...')).toBeVisible()
    await expect(page.locator('text=Dades extretes')).toBeVisible({ timeout: 10000 })

    // Check auto-filled fields
    await expect(page.locator('[name="invoiceNumber"]')).toHaveValue(/FAC-/)
    await expect(page.locator('[name="vendorName"]')).not.toBeEmpty()
    await expect(page.locator('[name="amount"]')).not.toBeEmpty()
  })
})

test.describe('Admin Review Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'adminpass')
    await page.click('button[type="submit"]')
  })

  test('approves expense', async ({ page }) => {
    // Navigate to pending expenses
    await page.click('text=Despeses pendents')

    // Click first expense
    await page.click('table tr:has-text("Pendent") >> nth=0')

    // Review and approve
    await page.click('button:has-text("Aprovar")')
    await page.fill('[name="notes"]', 'Aprovat correctament')
    await page.click('button:has-text("Confirmar")')

    // Verify approval
    await expect(page.locator('text=Despesa aprovada')).toBeVisible()
  })

  test('declines expense with reason', async ({ page }) => {
    await page.click('text=Despeses pendents')
    await page.click('table tr:has-text("Pendent") >> nth=0')

    await page.click('button:has-text("Denegar")')
    await page.fill('[name="reason"]', 'Factura incompleta')
    await page.click('button:has-text("Confirmar")')

    await expect(page.locator('text=Despesa denegada')).toBeVisible()
  })
})
```

---

## 6. Mocking with MSW

### MSW Setup

```typescript
// test/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/expenses', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', invoice_number: 'FAC-001', amount: 100 },
        { id: '2', invoice_number: 'FAC-002', amount: 200 },
      ])
    )
  }),

  rest.post('/api/expenses', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...req.body,
        created_at: new Date().toISOString(),
      })
    )
  }),

  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any

    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          token: 'mock-jwt-token',
          user: { id: '1', email, name: 'Test User' },
        })
      )
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    )
  }),
]

// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## 7. Test Coverage and Reporting

### Running Tests

**package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### CI/CD Integration

**.github/workflows/test.yml**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. Testing Best Practices

### DO

- ✅ Test user behavior, not implementation details
- ✅ Use descriptive test names
- ✅ Arrange-Act-Assert pattern
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Test edge cases and error states
- ✅ Use data-testid sparingly, prefer accessible queries

### DON'T

- ❌ Test private functions
- ❌ Rely on brittle selectors (class names)
- ❌ Share state between tests
- ❌ Test third-party libraries
- ❌ Overcomplicate test setup
- ❌ Ignore flaky tests

---

## 9. Official Resources

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/
- **MSW**: https://mswjs.io/

---

## 10. Next Steps for Architecture

The architecture team should design:
1. Test data factories and fixtures
2. CI/CD pipeline integration
3. Test coverage enforcement rules
4. E2E test scenarios for critical paths
5. Performance testing strategy
6. Accessibility testing automation
7. Visual regression testing
8. Test environment setup documentation
