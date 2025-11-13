/**
 * Integration Tests for Settings Routes
 * Tests admin settings for events and categories
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

// Mock the database
jest.unstable_mockModule('../../db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

// Now import everything
const { createApp } = await import('../../app.js')
const dbService = await import('../../services/database.service.js')
const authService = await import('../../services/auth.service.js')
const { createMockProfile } = await import('../helpers/test-utils.js')
const { db } = await import('../../db/index.js')
const request = (await import('supertest')).default

describe('Settings Routes', () => {
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

  describe('GET /api/settings/events/active', () => {
    it('should get active events for authenticated user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const mockEvents = [
        {
          id: 'evt-1',
          key: 'mwc_barcelona',
          label: 'MWC Barcelona',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'evt-2',
          key: 'tech_summit',
          label: 'Tech Summit',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockEvents),
          }),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .get('/api/settings/events/active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].key).toBe('mwc_barcelona')
      expect(response.body.data[0].label).toBe('MWC Barcelona')
      expect(response.body.data[0].id).toBeUndefined() // Should only return key and label
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/settings/events/active')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/settings/categories/active', () => {
    it('should get active categories for authenticated user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const mockCategories = [
        {
          id: 'cat-1',
          key: 'accommodation',
          label: 'Accommodation',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-2',
          key: 'meals',
          label: 'Meals',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCategories),
          }),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .get('/api/settings/categories/active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].key).toBe('accommodation')
      expect(response.body.data[0].label).toBe('Accommodation')
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/settings/categories/active')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/settings/events', () => {
    it('should get all events for admin', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockEvents = [
        {
          id: 'evt-1',
          key: 'mwc_barcelona',
          label: 'MWC Barcelona',
          isActive: 'true',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'evt-2',
          key: 'old_event',
          label: 'Old Event',
          isActive: 'false',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockEvents),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .get('/api/settings/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].isActive).toBe('true')
      expect(response.body.data[1].isActive).toBe('false')
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/settings/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/settings/events', () => {
    it('should create new event as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const newEvent = {
        id: 'evt-new',
        key: 'new_event',
        label: 'New Event',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing event
          }),
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newEvent]),
        }),
      })

      ;(db.select as any) = mockSelect
      ;(db.insert as any) = mockInsert

      const response = await request(app)
        .post('/api/settings/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'new_event',
          label: 'New Event',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.key).toBe('new_event')
      expect(response.body.data.label).toBe('New Event')
      expect(response.body.message).toBe('Event created successfully')
    })

    it('should reject duplicate event key', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const existingEvent = {
        id: 'evt-1',
        key: 'existing_event',
        label: 'Existing Event',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingEvent]),
          }),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .post('/api/settings/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'existing_event',
          label: 'Duplicate Event',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EVENT_EXISTS')
    })

    it('should reject missing fields', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const response = await request(app)
        .post('/api/settings/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: 'test_event' }) // Missing label
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_FIELDS')
    })

    it('should reject non-admin user', async () => {
      const mockUser = createMockProfile({ role: 'viewer' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/settings/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ key: 'test', label: 'Test' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/settings/events/:id', () => {
    it('should update event as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const updatedEvent = {
        id: 'evt-1',
        key: 'updated_event',
        label: 'Updated Event',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedEvent]),
          }),
        }),
      })

      ;(db.update as any) = mockUpdate

      const response = await request(app)
        .patch('/api/settings/events/evt-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Updated Event' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.label).toBe('Updated Event')
      expect(response.body.message).toBe('Event updated successfully')
    })

    it('should deactivate event', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const deactivatedEvent = {
        id: 'evt-1',
        key: 'event_to_deactivate',
        label: 'Event',
        isActive: 'false',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([deactivatedEvent]),
          }),
        }),
      })

      ;(db.update as any) = mockUpdate

      const response = await request(app)
        .patch('/api/settings/events/evt-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: 'false' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.isActive).toBe('false')
    })

    it('should return 404 for non-existent event', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      ;(db.update as any) = mockUpdate

      const response = await request(app)
        .patch('/api/settings/events/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Updated' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EVENT_NOT_FOUND')
    })
  })

  describe('DELETE /api/settings/events/:id', () => {
    it('should delete event as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const deletedEvent = {
        id: 'evt-1',
        key: 'deleted_event',
        label: 'Deleted Event',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedEvent]),
        }),
      })

      ;(db.delete as any) = mockDelete

      const response = await request(app)
        .delete('/api/settings/events/evt-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Event deleted successfully')
    })

    it('should return 404 for non-existent event', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      })

      ;(db.delete as any) = mockDelete

      const response = await request(app)
        .delete('/api/settings/events/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('EVENT_NOT_FOUND')
    })
  })

  describe('GET /api/settings/categories', () => {
    it('should get all categories for admin', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const mockCategories = [
        {
          id: 'cat-1',
          key: 'accommodation',
          label: 'Accommodation',
          isActive: 'true',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-2',
          key: 'old_category',
          label: 'Old Category',
          isActive: 'false',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockCategories),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .get('/api/settings/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
    })
  })

  describe('POST /api/settings/categories', () => {
    it('should create new category as admin', async () => {
      const mockAdmin = createMockProfile({ id: 'admin-1', role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const newCategory = {
        id: 'cat-new',
        key: 'new_category',
        label: 'New Category',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newCategory]),
        }),
      })

      ;(db.select as any) = mockSelect
      ;(db.insert as any) = mockInsert

      const response = await request(app)
        .post('/api/settings/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'new_category',
          label: 'New Category',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.key).toBe('new_category')
      expect(response.body.message).toBe('Category created successfully')
    })

    it('should reject duplicate category key', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const existingCategory = {
        id: 'cat-1',
        key: 'existing',
        label: 'Existing',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingCategory]),
          }),
        }),
      })

      ;(db.select as any) = mockSelect

      const response = await request(app)
        .post('/api/settings/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: 'existing', label: 'Duplicate' })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('CATEGORY_EXISTS')
    })
  })

  describe('PATCH /api/settings/categories/:id', () => {
    it('should update category as admin', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const updatedCategory = {
        id: 'cat-1',
        key: 'category',
        label: 'Updated Category',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedCategory]),
          }),
        }),
      })

      ;(db.update as any) = mockUpdate

      const response = await request(app)
        .patch('/api/settings/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Updated Category' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.label).toBe('Updated Category')
    })
  })

  describe('DELETE /api/settings/categories/:id', () => {
    it('should delete category as admin', async () => {
      const mockAdmin = createMockProfile({ role: 'admin' })
      ;(dbService.findProfileById as any).mockResolvedValue(mockAdmin)

      const deletedCategory = {
        id: 'cat-1',
        key: 'deleted',
        label: 'Deleted',
        isActive: 'true',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedCategory]),
        }),
      })

      ;(db.delete as any) = mockDelete

      const response = await request(app)
        .delete('/api/settings/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Category deleted successfully')
    })
  })
})
