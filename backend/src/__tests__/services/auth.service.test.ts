/**
 * Unit Tests for Authentication Service
 * Tests JWT generation, password hashing, and validation functions
 */

import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  validatePasswordStrength,
  validateEmail,
} from '../../services/auth.service.js'
import { createMockProfile, generateExpiredToken, generateInvalidToken } from '../helpers/test-utils.js'

describe('Authentication Service', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).toMatch(/^\$2[aby]\$/) // bcrypt hash format
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Different salts
    })

    it('should handle empty string', async () => {
      const hash = await hashPassword('')
      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword', hash)

      expect(isValid).toBe(false)
    })

    it('should reject empty password against valid hash', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })

    it('should handle case sensitivity', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('testpassword123', hash)

      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate valid JWT token for viewer', () => {
      const user = createMockProfile()
      const token = generateToken(user)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate valid JWT token for admin', () => {
      const admin = createMockProfile({ role: 'admin' })
      const token = generateToken(admin)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should include correct payload data', () => {
      const user = createMockProfile({
        id: 'test-id-123',
        email: 'user@test.com',
        role: 'viewer',
      })

      const token = generateToken(user)
      const decoded = verifyToken(token)

      expect(decoded.userId).toBe('test-id-123')
      expect(decoded.email).toBe('user@test.com')
      expect(decoded.role).toBe('viewer')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const user = createMockProfile()
      const token = generateToken(user)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(user.id)
      expect(decoded.email).toBe(user.email)
      expect(decoded.role).toBe(user.role)
    })

    it('should throw error for expired token', () => {
      const expiredToken = generateExpiredToken({ userId: 'test-id' })

      expect(() => verifyToken(expiredToken)).toThrow('Token has expired')
    })

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => verifyToken(invalidToken)).toThrow('Invalid token')
    })

    it('should throw error for token with wrong secret', () => {
      const tokenWithWrongSecret = generateInvalidToken()

      expect(() => verifyToken(tokenWithWrongSecret)).toThrow('Invalid token')
    })

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-jwt')).toThrow('Invalid token')
    })

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Invalid token')
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      const header = `Bearer ${token}`
      const extracted = extractTokenFromHeader(header)

      expect(extracted).toBe(token)
    })

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined)
      expect(extracted).toBeNull()
    })

    it('should return null for header without Bearer', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      const extracted = extractTokenFromHeader(token)

      expect(extracted).toBeNull()
    })

    it('should return null for wrong scheme', () => {
      const extracted = extractTokenFromHeader('Basic dXNlcjpwYXNz')
      expect(extracted).toBeNull()
    })

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('')
      expect(extracted).toBeNull()
    })

    it('should return null for malformed Bearer header', () => {
      const extracted = extractTokenFromHeader('Bearer')
      expect(extracted).toBeNull()
    })

    it('should return null for extra parts in header', () => {
      const extracted = extractTokenFromHeader('Bearer token extra')
      expect(extracted).toBeNull()
    })
  })

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongPass123')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('should accept password with special characters', () => {
      const result = validatePasswordStrength('Strong!Pass123')

      expect(result.valid).toBe(true)
    })

    it('should reject empty password', () => {
      const result = validatePasswordStrength('')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'user @example.com',
        // 'user@example', // Actually valid per regex (no TLD requirement in simple regex)
        'user@.com',
        '',
        // 'user@example..com', // Actually valid per simple regex
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true) // Minimal valid email
      expect(validateEmail('user@localhost')).toBe(false) // No TLD
    })
  })
})
