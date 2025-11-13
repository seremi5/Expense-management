/**
 * Integration Tests for Authentication Routes
 * Tests complete auth flow with mocked database
 */

import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals'

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
const authService = await import('../../services/auth.service.js')
const { createMockProfile } = await import('../helpers/test-utils.js')
const request = (await import('supertest')).default

// Import the mocked dbService - this should be the same instance used by the routes
const dbService = await import('../../services/database.service.js')

describe('Authentication Routes', () => {
  let app: any

  beforeEach(async () => {
    jest.clearAllMocks()

    // Recreate app to get fresh route instances
    app = createApp()
  })

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const mockUser = createMockProfile()

      ;(dbService.findProfileByEmail as any).mockResolvedValue(undefined)
      ;(dbService.createProfile as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPass123',
          name: 'New User',
        })

      if (response.status !== 201) {
        console.error('Register error:', JSON.stringify(response.body, null, 2))
        console.error('createProfile was called:', (dbService.createProfile as any).mock.calls.length, 'times')
      }

      expect(response.status).toBe(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user.email).toBe(mockUser.email)
      expect(response.body.message).toBe('Registration successful')

      expect(dbService.findProfileByEmail).toHaveBeenCalledWith('newuser@example.com')
      expect(dbService.createProfile).toHaveBeenCalled()
    })

    it('should reject registration with existing email', async () => {
      const existingUser = createMockProfile()
      ;(dbService.findProfileByEmail as any).mockResolvedValue(existingUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: existingUser.email,
          password: 'StrongPass123',
          name: 'New User',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('USER_EXISTS')
    })

    it('should reject registration with weak password', async () => {
      ;(dbService.findProfileByEmail as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak',
          name: 'New User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'StrongPass123',
          name: 'New User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject registration with short name', async () => {
      ;(dbService.findProfileByEmail as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass123',
          name: 'A',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = createMockProfile()
      const hashedPassword = await authService.hashPassword('TestPassword123')
      mockUser.passwordHash = hashedPassword

      ;(dbService.findProfileByEmail as any).mockResolvedValue(mockUser)
      ;(dbService.updateLastLogin as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'TestPassword123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.email).toBe(mockUser.email)
      expect(dbService.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
    })

    it('should reject login with non-existent email', async () => {
      ;(dbService.findProfileByEmail as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with incorrect password', async () => {
      const mockUser = createMockProfile()
      const hashedPassword = await authService.hashPassword('CorrectPassword123')
      mockUser.passwordHash = hashedPassword

      ;(dbService.findProfileByEmail as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'WrongPassword123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should normalize email case during login', async () => {
      const mockUser = createMockProfile({ email: 'user@example.com' })
      const hashedPassword = await authService.hashPassword('TestPassword123')
      mockUser.passwordHash = hashedPassword

      ;(dbService.findProfileByEmail as any).mockResolvedValue(mockUser)
      ;(dbService.updateLastLogin as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'User@EXAMPLE.COM',
          password: 'TestPassword123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(dbService.findProfileByEmail).toHaveBeenCalledWith('user@example.com')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const mockUser = createMockProfile()
      const token = authService.generateToken(mockUser)

      // Mock findProfileById to return the user
      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      if (response.status !== 200) {
        console.log('Error response:', response.status, response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(mockUser.id)
      expect(response.body.data.email).toBe(mockUser.email)
      expect(response.body.data.role).toBe(mockUser.role)
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const mockUser = createMockProfile()
      const currentPassword = 'CurrentPassword123'
      const hashedPassword = await authService.hashPassword(currentPassword)
      mockUser.passwordHash = hashedPassword

      const token = authService.generateToken(mockUser)

      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)
      ;(dbService.updateProfile as any).mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: currentPassword,
          newPassword: 'NewPassword456',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password changed successfully')
      expect(dbService.updateProfile).toHaveBeenCalled()
    })

    it('should reject password change with incorrect current password', async () => {
      const mockUser = createMockProfile()
      const hashedPassword = await authService.hashPassword('CurrentPassword123')
      mockUser.passwordHash = hashedPassword

      const token = authService.generateToken(mockUser)

      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword456',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_PASSWORD')
    })

    it('should reject password change with weak new password', async () => {
      const mockUser = createMockProfile()
      const hashedPassword = await authService.hashPassword('CurrentPassword123')
      mockUser.passwordHash = hashedPassword

      const token = authService.generateToken(mockUser)

      ;(dbService.findProfileById as any).mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'CurrentPassword123',
          newPassword: 'weak',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should reject password change without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'CurrentPassword123',
          newPassword: 'NewPassword456',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})
