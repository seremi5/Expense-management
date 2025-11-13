/**
 * Integration Tests for Admin Routes
 * Tests admin-only expense management and statistics endpoints
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
const { createMockProfile, createMockExpense } = await import('../helpers/test-utils.js')
const request = (await import('supertest')).default

describe('Admin Routes', () => {
  let app: any
  let adminToken: string
  let userToken: string

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()

    // Create tokens
    const mockAdmin = createMockProfile({ id: 'admin-1', email: 'admin@example.com', role: 'admin' })
    const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })

    adminToken = authService.generateToken(mockAdmin)
    userToken = authService.generateToken(mockUser)
  })

  describe('GET /api/admin/stats', () => {
    it('should get expense statistics as admin', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockStats = {
        totalExpenses: 100,
        totalAmount: '10000.00',
        pendingCount: 20,
        pendingAmount: '2000.00',
        approvedCount: 30,
        approvedAmount: '3000.00',
        paidCount: 20,
        paidAmount: '2000.00',
        declinedCount: 5,
        declinedAmount: '500.00',
        expensesByStatus: { submitted: 20, ready_to_pay: 30, paid: 20, declined: 5 },
        expensesByEvent: { general: 50, bartimeu: 30, emunah: 20 },
        expensesByCategory: { menjar: 40, transport: 30, material_activitats: 30 },
      }

      const mockActivity = [
        {
          id: 'audit-1',
          action: 'created',
          expenseId: 'exp-1',
          userId: null,
          createdAt: new Date(),
          expense: createMockExpense(),
          user: null,
        },
      ]

      ;(dbService.getExpenseStats as any).mockResolvedValue(mockStats)
      ;(dbService.getRecentAuditLogs as any).mockResolvedValue(mockActivity)

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalExpenses).toBe(100)
      expect(response.body.data.recentActivity).toHaveLength(1)
      expect(dbService.getExpenseStats).toHaveBeenCalled()
      expect(dbService.getRecentAuditLogs).toHaveBeenCalledWith(10)
    })

    it('should reject non-admin access', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('should reject unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('PATCH /api/admin/expenses/:id/status', () => {
    it('should approve expense (set to ready_to_pay)', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'submitted' })
      const updatedExpense = createMockExpense({
        status: 'ready_to_pay',
        approvedBy: 'admin-1',
        approvedAt: new Date(),
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ready_to_pay' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('ready_to_pay')
      expect(response.body.message).toBe('Expense status updated successfully')
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          status: 'ready_to_pay',
          approvedBy: 'admin-1',
          approvedAt: expect.any(Date),
        })
      )
      expect(dbService.createAuditLog).toHaveBeenCalled()
    })

    it('should validate expense', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'submitted' })
      const updatedExpense = createMockExpense({
        status: 'validated',
        approvedBy: 'admin-1',
        approvedAt: new Date(),
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'validated' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('validated')
    })

    it('should decline expense with reason', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'submitted' })
      const updatedExpense = createMockExpense({
        status: 'declined',
        declinedReason: 'Missing required documentation',
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'declined',
          declinedReason: 'Missing required documentation',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('declined')
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          status: 'declined',
          declinedReason: 'Missing required documentation',
        })
      )
    })

    it('should reject decline without reason', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'submitted' })
      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'declined' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('DECLINED_REASON_REQUIRED')
    })

    it('should mark expense as paid', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'ready_to_pay' })
      const updatedExpense = createMockExpense({
        status: 'paid',
        paidAt: new Date(),
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('paid')
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          status: 'paid',
          paidAt: expect.any(Date),
        })
      )
    })

    it('should update status with comments', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({ status: 'submitted' })
      const updatedExpense = createMockExpense({
        status: 'validated',
        comments: 'Approved with notes',
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'validated',
          comments: 'Approved with notes',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          comments: 'Approved with notes',
        })
      )
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'validated' })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('should return 404 for non-existent expense', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)
      ;(dbService.findExpenseById as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/non-existent/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'validated' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EXPENSE_NOT_FOUND')
    })
  })

  describe('GET /api/admin/expenses/:id/audit', () => {
    it('should get audit logs for an expense', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense()
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'created',
          oldValues: null,
          newValues: { status: 'submitted' },
          createdAt: new Date(),
          user: null,
        },
        {
          id: 'audit-2',
          action: 'status_changed_to_validated',
          oldValues: { status: 'submitted' },
          newValues: { status: 'validated' },
          createdAt: new Date(),
          user: createMockProfile({ role: 'admin' }),
        },
      ]

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.getAuditLogsByExpenseId as any).mockResolvedValue(mockAuditLogs)

      const response = await request(app)
        .get('/api/admin/expenses/test-expense-id/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].action).toBe('created')
      expect(response.body.data[1].action).toBe('status_changed_to_validated')
      expect(dbService.getAuditLogsByExpenseId).toHaveBeenCalledWith('test-expense-id')
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/admin/expenses/test-expense-id/audit')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent expense', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)
      ;(dbService.findExpenseById as any).mockResolvedValue(undefined)

      const response = await request(app)
        .get('/api/admin/expenses/non-existent/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EXPENSE_NOT_FOUND')
    })
  })

  describe('PATCH /api/admin/expenses/:id', () => {
    it('should update expense data as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense({
        vendorName: 'Old Vendor',
        totalAmount: '100.00',
      })

      const updatedExpense = createMockExpense({
        vendorName: 'New Vendor',
        totalAmount: '150.00',
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vendorName: 'New Vendor',
          totalAmount: 150.00,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vendorName).toBe('New Vendor')
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          vendorName: 'New Vendor',
          totalAmount: 150.00,
        })
      )
      expect(dbService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'expense_updated',
          userId: 'admin-1',
        })
      )
    })

    it('should update VAT breakdown', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockExpense = createMockExpense()
      const updatedExpense = createMockExpense({
        vat21Base: '100.00',
        vat21Amount: '21.00',
      })

      ;(dbService.findExpenseById as any).mockResolvedValue(mockExpense)
      ;(dbService.updateExpense as any).mockResolvedValue(updatedExpense)
      ;(dbService.createAuditLog as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vat21Base: 100.00,
          vat21Amount: 21.00,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.updateExpense).toHaveBeenCalledWith(
        'test-expense-id',
        expect.objectContaining({
          vat21Base: 100.00,
          vat21Amount: 21.00,
        })
      )
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .patch('/api/admin/expenses/test-expense-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ vendorName: 'New Vendor' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent expense', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)
      ;(dbService.findExpenseById as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/expenses/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ vendorName: 'New Vendor' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EXPENSE_NOT_FOUND')
    })
  })

  describe('PATCH /api/admin/profiles/:id/role', () => {
    it('should update user role as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const updatedUser = createMockProfile({
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
      })

      ;(dbService.updateProfile as any).mockResolvedValue(updatedUser)

      const response = await request(app)
        .patch('/api/admin/profiles/user-1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.role).toBe('admin')
      expect(response.body.message).toBe('User role updated successfully')
      expect(dbService.updateProfile).toHaveBeenCalledWith('user-1', { role: 'admin' })
    })

    it('should reject changing own role', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const response = await request(app)
        .patch('/api/admin/profiles/admin-1/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE')
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .patch('/api/admin/profiles/user-2/role')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent user', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)
      ;(dbService.updateProfile as any).mockResolvedValue(undefined)

      const response = await request(app)
        .patch('/api/admin/profiles/non-existent/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PROFILE_NOT_FOUND')
    })
  })
})
