# Jest ES Module Mocking Fix Guide

## Problem
With ES modules and Jest's experimental VM modules (`NODE_OPTIONS=--experimental-vm-modules`), the traditional `jest.mock()` function doesn't work properly because:
1. ES module exports are read-only and cannot be modified with `jest.spyOn()`
2. `jest.mock()` hoisting doesn't work correctly with ES modules
3. Tests were calling real services instead of mocks

## Solution
Use `jest.unstable_mockModule()` to mock modules BEFORE importing them, then use dynamic `await import()` statements.

## Working Example

See `src/__tests__/routes/auth.routes.test.ts` for the complete working implementation.

### Step 1: Add mock setup at the top (before any imports)

```typescript
import { jest, beforeEach, describe, it, expect } from '@jest/globals'

// Mock the services BEFORE importing anything else
jest.unstable_mockModule('../../services/database.service.js', () => ({
  createProfile: jest.fn(),
  findProfileByEmail: jest.fn(),
  findProfileById: jest.fn(),
  updateProfile: jest.fn(),
  updateLastLogin: jest.fn(),
  getAllProfiles: jest.fn(),
  createExpense: jest.fn(),
  findExpenseById: jest.fn(),
  findExpenseByReferenceNumber: jest.fn(),
  findExpenses: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  createLineItems: jest.fn(),
  deleteLineItemsByExpenseId: jest.fn(),
  createAuditLog: jest.fn(),
  getAuditLogsByExpenseId: jest.fn(),
  getRecentAuditLogs: jest.fn(),
  getExpenseStats: jest.fn(),
  generateReferenceNumber: jest.fn(),
}))

jest.unstable_mockModule('../../services/logger.service.js', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  logEvent: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))
```

### Step 2: Use dynamic imports

```typescript
// Now import everything using await import()
const { createApp } = await import('../../app.js')
const dbService = await import('../../services/database.service.js')
const authService = await import('../../services/auth.service.js')
const { createMockProfile } = await import('../helpers/test-utils.js')
const request = (await import('supertest')).default
```

### Step 3: Update test structure

```typescript
describe('Route Tests', () => {
  let app: any

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()  // Create app fresh for each test
  })

  it('should work with mocked services', async () => {
    // Cast to 'any' to avoid TypeScript errors
    ;(dbService.findProfileByEmail as any).mockResolvedValue(undefined)
    ;(dbService.createProfile as any).mockResolvedValue(mockUser)

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test123', name: 'Test' })

    expect(response.status).toBe(201)
    expect(dbService.createProfile).toHaveBeenCalled()
  })
})
```

### Step 4: Remove old patterns

Remove these old patterns:
```typescript
// DON'T USE:
jest.mock('../../services/database.service.js')
const mockDbService = dbService as jest.Mocked<typeof dbService>
mockDbService.findProfileByEmail.mockResolvedValue(...)

jest.spyOn(dbService, 'findProfileByEmail').mockResolvedValue(...)
```

## Key Changes Required

1. **Replace `jest.mock()`** with `jest.unstable_mockModule()` before all imports
2. **Replace regular imports** with `await import()` statements
3. **Replace `mockDbService.`** with `dbService.` throughout tests
4. **Cast to `any`** instead of `jest.Mock` for type safety: `(dbService.fn as any).mockResolvedValue()`
5. **Create app in `beforeEach`** instead of at module level
6. **Mock ALL functions** exported by the service module

## Files to Fix

- [x] `src/__tests__/routes/auth.routes.test.ts` - FIXED (12/19 tests passing)
- [ ] `src/__tests__/routes/expenses.routes.test.ts`
- [ ] `src/__tests__/routes/admin.routes.test.ts`
- [ ] `src/__tests__/routes/settings.routes.test.ts`
- [ ] `src/__tests__/routes/ocr.routes.test.ts`

## Test Results

**Before Fix**: 105 passing, 54 failing
**After Auth Fix**: 110 passing, 49 failing
**Goal**: 159 passing, 0 failing

## Additional Notes

- The `jest.unstable_mockModule` API may change in future Jest versions
- TypeScript may show errors - use `as any` casting for mock functions
- Some tests may fail for reasons other than mocking (e.g., wrong expected values, missing route implementations)
- Always call `jest.clearAllMocks()` in `beforeEach` to reset mock state

## For Settings and OCR Tests

Settings tests also need to mock the database (`db`) object:

```typescript
jest.unstable_mockModule('../../db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))
```

OCR tests need to mock the OCRService class:

```typescript
jest.unstable_mockModule('../../services/ocr.service.js', () => ({
  OCRService: jest.fn().mockImplementation(() => ({
    extractDocument: jest.fn(),
    extractInvoice: jest.fn(),
    extractReceipt: jest.fn(),
  })),
}))
```

## Verification

Run tests after each fix:
```bash
npm test -- src/__tests__/routes/auth.routes.test.ts  # Check specific file
npm test                                                # Check all tests
```
