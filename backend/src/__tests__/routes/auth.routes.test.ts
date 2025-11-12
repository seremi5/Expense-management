/**
 * Integration Tests for Authentication Routes
 * Tests complete auth flow with mocked database
 */

import request from 'supertest'
import { createApp } from '../../app.js'
import * as dbService from '../../services/database.service.js'
import * as authService from '../../services/auth.service.js'
import { createMockProfile } from '../helpers/test-utils.js'

// Mock the database service
jest.mock('../../services/database.service.js')
// Mock the logger to prevent console noise
jest.mock('../../services/logger.service.js')

const mockDbService = dbService as jest.Mocked<typeof dbService>

describe('Authentication Routes', () => {
  const app = createApp()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const mockUser = createMockProfile()
      mockDbService.findProfileByEmail.mockResolvedValue(undefined)
      mockDbService.createProfile.mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPass123',
          name: 'New User',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user.email).toBe(mockUser.email)
      expect(response.body.message).toBe('Registration successful')

      expect(mockDbService.findProfileByEmail).toHaveBeenCalledWith('newuser@example.com')
      expect(mockDbService.createProfile).toHaveBeenCalled()
    })

    it('should reject registration with existing email', async () => {
      const existingUser = createMockProfile()
      mockDbService.findProfileByEmail.mockResolvedValue(existingUser)

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
      mockDbService.findProfileByEmail.mockResolvedValue(undefined)

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
      mockDbService.findProfileByEmail.mockResolvedValue(undefined)

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

      mockDbService.findProfileByEmail.mockResolvedValue(mockUser)
      mockDbService.updateLastLogin.mockResolvedValue(undefined)

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
      expect(mockDbService.updateLastLogin).toHaveBeenCalledWith(mockUser.id)
    })

    it('should reject login with non-existent email', async () => {
      mockDbService.findProfileByEmail.mockResolvedValue(undefined)

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

      mockDbService.findProfileByEmail.mockResolvedValue(mockUser)

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

      mockDbService.findProfileByEmail.mockResolvedValue(mockUser)
      mockDbService.updateLastLogin.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'User@EXAMPLE.COM',
          password: 'TestPassword123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockDbService.findProfileByEmail).toHaveBeenCalledWith('user@example.com')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const mockUser = createMockProfile()
      const token = authService.generateToken(mockUser)

      mockDbService.findProfileById.mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

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

      mockDbService.findProfileById.mockResolvedValue(mockUser)
      mockDbService.updateProfile.mockResolvedValue(undefined)

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
      expect(mockDbService.updateProfile).toHaveBeenCalled()
    })

    it('should reject password change with incorrect current password', async () => {
      const mockUser = createMockProfile()
      const hashedPassword = await authService.hashPassword('CurrentPassword123')
      mockUser.passwordHash = hashedPassword

      const token = authService.generateToken(mockUser)

      mockDbService.findProfileById.mockResolvedValue(mockUser)

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

      mockDbService.findProfileById.mockResolvedValue(mockUser)

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
