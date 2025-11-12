/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/services/auth.service.ts
 *
 * Purpose: Authentication service handling user registration, login, and JWT operations
 *
 * Dependencies: bcrypt, jsonwebtoken, database
 * Used by: Auth routes, authentication middleware
 *
 * Key responsibilities:
 * - Hash and verify passwords using bcrypt
 * - Generate and verify JWT tokens
 * - User registration and login logic
 * - Token payload creation
 *
 * Integration notes: Uses JWT for stateless authentication with configurable expiry
 */

import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { JWTPayload } from '../types/index.js'
import type { Profile } from '../db/schema.js'

const SALT_ROUNDS = 12

/**
 * Hash a plain text password using bcrypt
 * Uses 12 rounds for security (recommended by OWASP)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a plain text password against a hashed password
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: Profile): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as any,
    issuer: 'expense-management-api',
    audience: 'expense-management-client',
  }

  return jwt.sign(payload, env.jwt.secret, options)
}

/**
 * Verify and decode a JWT token
 * Throws an error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.secret, {
      issuer: 'expense-management-api',
      audience: 'expense-management-client',
    }) as JWTPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw error
  }
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
