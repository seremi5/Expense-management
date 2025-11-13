/**
 * Unit Tests for Authentication Validators
 * Tests Zod validation schemas for auth endpoints
 */

import { loginSchema, registerSchema, changePasswordSchema } from '../../validators/auth.validator.js'

describe('Authentication Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        body: {
          email: 'user@example.com',
          password: 'password123',
        },
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should normalize email to lowercase', () => {
      const data = {
        body: {
          email: 'User@Example.COM',
          password: 'password123',
        },
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.email).toBe('user@example.com')
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: '',
        },
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const invalidData = {
        body: {
          password: 'password123',
        },
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        body: {
          email: 'user@example.com',
          password: 'StrongPass123',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject weak password (no uppercase)', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'weakpass123',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.map((issue: any) => issue.message)
        expect(errors.some((e: string) => e.includes('uppercase'))).toBe(true)
      }
    })

    it('should reject weak password (no lowercase)', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'WEAKPASS123',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.map((issue: any) => issue.message)
        expect(errors.some((e: string) => e.includes('lowercase'))).toBe(true)
      }
    })

    it('should reject weak password (no number)', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'WeakPassword',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.map((issue: any) => issue.message)
        expect(errors.some((e: string) => e.includes('number'))).toBe(true)
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'Short1',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.map((issue: any) => issue.message)
        expect(errors.some((e: string) => e.includes('8 characters'))).toBe(true)
      }
    })

    it('should reject short name', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'StrongPass123',
          name: 'A',
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.map((issue: any) => issue.message)
        expect(errors.some((e: string) => e.includes('2 characters'))).toBe(true)
      }
    })

    it('should reject name that is too long', () => {
      const invalidData = {
        body: {
          email: 'user@example.com',
          password: 'StrongPass123',
          name: 'A'.repeat(101),
        },
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept valid complex password', () => {
      const validData = {
        body: {
          email: 'user@example.com',
          password: 'C0mpl3x!Pass@word#2023',
          name: 'Test User',
        },
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        body: {
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword456',
        },
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing current password', () => {
      const invalidData = {
        body: {
          currentPassword: '',
          newPassword: 'NewPassword456',
        },
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject weak new password', () => {
      const invalidData = {
        body: {
          currentPassword: 'OldPassword123',
          newPassword: 'weak',
        },
      }

      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow same format for new password', () => {
      const validData = {
        body: {
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        },
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})
