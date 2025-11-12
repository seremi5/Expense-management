/**
 * Unit Tests for Expense Validators
 * Tests Zod validation schemas for expense endpoints
 */

import {
  createExpenseSchema,
  updateExpenseStatusSchema,
  getExpenseByIdSchema,
  listExpensesSchema,
} from '../../validators/expense.validator.js'

describe('Expense Validators', () => {
  describe('createExpenseSchema', () => {
    const validExpenseData = {
      body: {
        email: 'user@example.com',
        phone: '+34123456789',
        name: 'John',
        surname: 'Doe',
        event: 'mwc_barcelona' as const,
        category: 'accommodation' as const,
        type: 'reimbursable' as const,
        invoiceNumber: 'INV-001',
        invoiceDate: '2025-01-10T10:00:00Z',
        vendorName: 'Hotel Test',
        vendorNif: 'B12345678',
        totalAmount: '150.00',
        currency: 'EUR',
        bankAccount: 'ES1234567890123456789012',
        accountHolder: 'John Doe',
        fileUrl: 'https://example.com/receipt.pdf',
        fileName: 'receipt.pdf',
      },
    }

    it('should validate correct expense data', () => {
      const result = createExpenseSchema.safeParse(validExpenseData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, email: 'invalid-email' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short phone number', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, phone: '12345' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid event type', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, event: 'invalid_event' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid category', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, category: 'invalid_category' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid expense type', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, type: 'invalid_type' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid vendorNif format (lowercase)', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, vendorNif: 'b12345678' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject vendorNif with special characters', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, vendorNif: 'B-1234567' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid totalAmount format', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, totalAmount: '150.999' }, // Too many decimals
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept totalAmount with 2 decimals', () => {
      const data = {
        ...validExpenseData,
        body: { ...validExpenseData.body, totalAmount: '150.99' },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept totalAmount with 1 decimal', () => {
      const data = {
        ...validExpenseData,
        body: { ...validExpenseData.body, totalAmount: '150.5' },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept totalAmount with no decimals', () => {
      const data = {
        ...validExpenseData,
        body: { ...validExpenseData.body, totalAmount: '150' },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require bank account for reimbursable expenses', () => {
      const invalidData = {
        ...validExpenseData,
        body: {
          ...validExpenseData.body,
          type: 'reimbursable' as const,
          bankAccount: undefined,
          accountHolder: undefined,
        },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message)
        expect(errors.some(e => e.includes('Bank account'))).toBe(true)
      }
    })

    it('should require bank account for payable expenses', () => {
      const invalidData = {
        ...validExpenseData,
        body: {
          ...validExpenseData.body,
          type: 'payable' as const,
          bankAccount: undefined,
          accountHolder: undefined,
        },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should not require bank account for non-reimbursable expenses', () => {
      const data = {
        ...validExpenseData,
        body: {
          ...validExpenseData.body,
          type: 'non_reimbursable' as const,
          bankAccount: undefined,
          accountHolder: undefined,
        },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid line items', () => {
      const data = {
        ...validExpenseData,
        body: {
          ...validExpenseData.body,
          lineItems: [
            {
              description: 'Room service',
              quantity: '2',
              unitPrice: '50.00',
              totalPrice: '100.00',
            },
          ],
        },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid file URL', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, fileUrl: 'not-a-url' },
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid invoice date format', () => {
      const invalidData = {
        ...validExpenseData,
        body: { ...validExpenseData.body, invoiceDate: '2025-01-10' }, // Not ISO 8601 datetime
      }

      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should default currency to EUR', () => {
      const data = {
        ...validExpenseData,
        body: { ...validExpenseData.body, currency: undefined },
      }

      const result = createExpenseSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.currency).toBe('EUR')
      }
    })
  })

  describe('updateExpenseStatusSchema', () => {
    it('should validate correct status update', () => {
      const validData = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { status: 'ready_to_pay' as const },
      }

      const result = updateExpenseStatusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept all valid statuses', () => {
      const statuses = ['submitted', 'ready_to_pay', 'paid', 'declined', 'validated', 'flagged']

      statuses.forEach(status => {
        const data = {
          params: { id: '123e4567-e89b-12d3-a456-426614174000' },
          body: { status },
        }

        const result = updateExpenseStatusSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const invalidData = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: { status: 'invalid_status' },
      }

      const result = updateExpenseStatusSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID format', () => {
      const invalidData = {
        params: { id: 'not-a-uuid' },
        body: { status: 'paid' as const },
      }

      const result = updateExpenseStatusSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional declined reason', () => {
      const validData = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        body: {
          status: 'declined' as const,
          declinedReason: 'Invoice is incomplete',
        },
      }

      const result = updateExpenseStatusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('getExpenseByIdSchema', () => {
    it('should validate correct UUID', () => {
      const validData = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      }

      const result = getExpenseByIdSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        params: { id: 'not-a-uuid' },
      }

      const result = getExpenseByIdSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty ID', () => {
      const invalidData = {
        params: { id: '' },
      }

      const result = getExpenseByIdSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('listExpensesSchema', () => {
    it('should validate with default values', () => {
      const data = {
        query: {},
      }

      const result = listExpensesSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.query.page).toBe('1')
        expect(result.data.query.limit).toBe('20')
        expect(result.data.query.sortBy).toBe('createdAt')
        expect(result.data.query.sortOrder).toBe('desc')
      }
    })

    it('should validate with custom page and limit', () => {
      const data = {
        query: {
          page: '2',
          limit: '50',
        },
      }

      const result = listExpensesSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const invalidData = {
        query: {
          page: 'abc',
        },
      }

      const result = listExpensesSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept filter parameters', () => {
      const data = {
        query: {
          status: 'submitted',
          event: 'mwc_barcelona',
          category: 'accommodation',
          type: 'reimbursable',
          search: 'hotel',
        },
      }

      const result = listExpensesSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate date range filters', () => {
      const data = {
        query: {
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
        },
      }

      const result = listExpensesSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid sortBy', () => {
      const invalidData = {
        query: {
          sortBy: 'invalidField',
        },
      }

      const result = listExpensesSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid sortOrder', () => {
      const invalidData = {
        query: {
          sortOrder: 'random',
        },
      }

      const result = listExpensesSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
