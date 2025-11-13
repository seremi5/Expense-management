/**
 * Integration Tests for Expense Routes
 * Tests complete expense CRUD operations with mocked database
 */

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

// Now import everything
const { createApp } = await import('../../app.js')
const dbService = await import('../../services/database.service.js')
const authService = await import('../../services/auth.service.js')
const { createMockProfile, createMockExpense, generateTestToken } = await import('../helpers/test-utils.js')
const request = (await import('supertest')).default

describe('Expense Routes', () => {
  let app: any
  let userToken: string
  let adminToken: string

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()

    // Create tokens
    const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })
    const mockAdmin = createMockProfile({ id: 'admin-1', email: 'admin@example.com', role: 'admin' })

    userToken = authService.generateToken(mockUser)
    adminToken = authService.generateToken(mockAdmin)
  })

  describe('POST /api/expenses', () => {
    it('should create reimbursable expense successfully', async () => {
      const mockExpense = createMockExpense({
        type: 'reimbursable',
        bankAccount: 'ES1234567890123456789012',
        accountHolder: 'Test User',
      })

      ;(dbService.createExpense as any).mockResolvedValue({
        expense: mockExpense,
        lineItems: [],
      })
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'accommodation',
          type: 'reimbursable',
          invoiceNumber: 'INV-001',
          invoiceDate: '2025-01-10',
          vendorName: 'Hotel Test',
          vendorNif: 'B12345678',
          totalAmount: 150.00,
          currency: 'EUR',
          bankAccount: 'ES1234567890123456789012',
          accountHolder: 'Test User',
          fileUrl: 'https://example.com/receipt.pdf',
          fileName: 'receipt.pdf',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('reimbursable')
      expect(response.body.data.bankAccount).toBe('ES1234567890123456789012')
      expect(response.body.message).toBe('Expense submitted successfully')
      expect(dbService.createExpense).toHaveBeenCalled()
      expect(dbService.createAuditLog).toHaveBeenCalled()
    })

    it('should create non-reimbursable expense successfully', async () => {
      const mockExpense = createMockExpense({
        type: 'non_reimbursable',
        bankAccount: null,
        accountHolder: null,
      })

      ;(dbService.createExpense as any).mockResolvedValue({
        expense: mockExpense,
        lineItems: [],
      })
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'meals',
          type: 'non_reimbursable',
          invoiceNumber: 'INV-002',
          invoiceDate: '2025-01-11',
          vendorName: 'Restaurant Test',
          vendorNif: 'B87654321',
          totalAmount: 50.00,
          currency: 'EUR',
          fileUrl: 'https://example.com/receipt2.pdf',
          fileName: 'receipt2.pdf',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('non_reimbursable')
      expect(response.body.data.bankAccount).toBeNull()
    })

    it('should create payable expense successfully', async () => {
      const mockExpense = createMockExpense({
        type: 'payable',
        bankAccount: null,
        accountHolder: null,
      })

      ;(dbService.createExpense as any).mockResolvedValue({
        expense: mockExpense,
        lineItems: [],
      })
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'services',
          type: 'payable',
          invoiceNumber: 'INV-003',
          invoiceDate: '2025-01-12',
          vendorName: 'Service Provider',
          vendorNif: 'B11111111',
          totalAmount: 500.00,
          currency: 'EUR',
          fileUrl: 'https://example.com/invoice.pdf',
          fileName: 'invoice.pdf',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('payable')
    })

    it('should create expense with VAT breakdown', async () => {
      const mockExpense = createMockExpense({
        totalAmount: '121.00',
        taxBase: '100.00',
        vat21Base: '100.00',
        vat21Amount: '21.00',
      })

      ;(dbService.createExpense as any).mockResolvedValue({
        expense: mockExpense,
        lineItems: [],
      })
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'accommodation',
          type: 'reimbursable',
          invoiceNumber: 'INV-004',
          invoiceDate: '2025-01-13',
          vendorName: 'Hotel VAT',
          vendorNif: 'B22222222',
          totalAmount: 121.00,
          taxBase: 100.00,
          vat21Base: 100.00,
          vat21Amount: 21.00,
          currency: 'EUR',
          bankAccount: 'ES1234567890123456789012',
          accountHolder: 'Test User',
          fileUrl: 'https://example.com/receipt-vat.pdf',
          fileName: 'receipt-vat.pdf',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.taxBase).toBe('100.00')
      expect(response.body.data.vat21Base).toBe('100.00')
      expect(response.body.data.vat21Amount).toBe('21.00')
    })

    it('should create expense with line items', async () => {
      const mockLineItems = [
        {
          id: 'line-1',
          expenseId: 'test-expense-id',
          description: 'Item 1',
          quantity: '2',
          unitPrice: '25.00',
          totalPrice: '50.00',
        },
        {
          id: 'line-2',
          expenseId: 'test-expense-id',
          description: 'Item 2',
          quantity: '1',
          unitPrice: '100.00',
          totalPrice: '100.00',
        },
      ]

      const mockExpense = createMockExpense({ totalAmount: '150.00' })

      ;(dbService.createExpense as any).mockResolvedValue({
        expense: mockExpense,
        lineItems: mockLineItems,
      })
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'supplies',
          type: 'reimbursable',
          invoiceNumber: 'INV-005',
          invoiceDate: '2025-01-14',
          vendorName: 'Supplies Co',
          vendorNif: 'B33333333',
          totalAmount: 150.00,
          currency: 'EUR',
          bankAccount: 'ES1234567890123456789012',
          accountHolder: 'Test User',
          fileUrl: 'https://example.com/invoice-items.pdf',
          fileName: 'invoice-items.pdf',
          lineItems: [
            { description: 'Item 1', quantity: 2, unitPrice: 25.00, totalPrice: 50.00 },
            { description: 'Item 2', quantity: 1, unitPrice: 100.00, totalPrice: 100.00 },
          ],
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.lineItems).toHaveLength(2)
    })

    it('should reject expense with missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          // Missing many required fields
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject expense with invalid email', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'invalid-email',
          phone: '+34123456789',
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'accommodation',
          type: 'reimbursable',
          invoiceNumber: 'INV-006',
          invoiceDate: '2025-01-15',
          vendorName: 'Hotel',
          vendorNif: 'B44444444',
          totalAmount: 150.00,
          fileUrl: 'https://example.com/receipt.pdf',
          fileName: 'receipt.pdf',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject expense with invalid phone', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          email: 'test@example.com',
          phone: '123', // Too short
          name: 'Test',
          surname: 'User',
          event: 'mwc_barcelona',
          category: 'accommodation',
          type: 'reimbursable',
          invoiceNumber: 'INV-007',
          invoiceDate: '2025-01-16',
          vendorName: 'Hotel',
          vendorNif: 'B55555555',
          totalAmount: 150.00,
          fileUrl: 'https://example.com/receipt.pdf',
          fileName: 'receipt.pdf',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/expenses', () => {
    it('should list all expenses when not authenticated', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', email: 'user1@example.com' }),
        createMockExpense({ id: 'exp-2', email: 'user2@example.com' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 2,
      })

      const response = await request(app)
        .get('/api/expenses')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(response.body.data.pagination.total).toBe(2)
    })

    it('should filter expenses by user email when authenticated as viewer', async () => {
      const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const mockExpenses = [
        createMockExpense({ id: 'exp-1', email: 'user@example.com' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(1)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should list all expenses when authenticated as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', email: 'admin@example.com', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpenses = [
        createMockExpense({ id: 'exp-1', email: 'user1@example.com' }),
        createMockExpense({ id: 'exp-2', email: 'user2@example.com' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 2,
      })

      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
    })

    it('should filter expenses by status', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', status: 'submitted' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?status=submitted')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'submitted' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should filter expenses by event', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', event: 'mwc_barcelona' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?event=mwc_barcelona')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'mwc_barcelona' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should filter expenses by category', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', category: 'accommodation' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?category=accommodation')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'accommodation' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should filter expenses by type', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', type: 'reimbursable' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?type=reimbursable')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'reimbursable' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should filter expenses by date range', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', invoiceDate: new Date('2025-01-15') }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?startDate=2025-01-01&endDate=2025-01-31')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should search expenses by text', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', vendorName: 'Hotel Barcelona' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 1,
      })

      const response = await request(app)
        .get('/api/expenses?search=Barcelona')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Barcelona' }),
        expect.any(Object),
        undefined,
        undefined
      )
    })

    it('should support pagination', async () => {
      const mockExpenses = Array(10).fill(null).map((_, i) =>
        createMockExpense({ id: `exp-${i}` })
      )

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses.slice(0, 5),
        total: 10,
      })

      const response = await request(app)
        .get('/api/expenses?page=1&limit=5')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(5)
      expect(response.body.data.pagination.total).toBe(10)
      expect(response.body.data.pagination.totalPages).toBe(2)
    })

    it('should support sorting', async () => {
      const mockExpenses = [
        createMockExpense({ id: 'exp-1', totalAmount: '100.00' }),
        createMockExpense({ id: 'exp-2', totalAmount: '200.00' }),
      ]

      ;(dbService.findExpenses as any).mockResolvedValue({
        data: mockExpenses,
        total: 2,
      })

      const response = await request(app)
        .get('/api/expenses?sortBy=totalAmount&sortOrder=desc')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findExpenses).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'totalAmount',
        'desc'
      )
    })
  })

  describe('GET /api/expenses/:id', () => {
    it('should get expense by id when not authenticated', async () => {
      const mockExpense = createMockExpense({ id: 'exp-1' })
      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)

      const response = await request(app)
        .get('/api/expenses/exp-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('exp-1')
    })

    it('should get expense by id when authenticated as owner', async () => {
      const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const mockExpense = createMockExpense({ id: 'exp-1', email: 'user@example.com' })
      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)

      const response = await request(app)
        .get('/api/expenses/exp-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('exp-1')
    })

    it('should get expense by id when authenticated as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', email: 'admin@example.com', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ id: 'exp-1', email: 'other@example.com' })
      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)

      const response = await request(app)
        .get('/api/expenses/exp-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('exp-1')
    })

    it('should reject access to other users expense when authenticated as viewer', async () => {
      const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const mockExpense = createMockExpense({ id: 'exp-1', email: 'other@example.com' })
      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)

      const response = await request(app)
        .get('/api/expenses/exp-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('should return 404 for non-existent expense', async () => {
      ;(dbService.findExpenseById as any).mockResolvedValue(undefined)

      const response = await request(app)
        .get('/api/expenses/non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EXPENSE_NOT_FOUND')
    })
  })
})
