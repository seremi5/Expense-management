/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/auth.routes.ts
 *
 * Purpose: Authentication endpoints (login, register, user info)
 *
 * Dependencies: Auth service, database service, validation
 * Used by: Frontend authentication flows
 *
 * Key responsibilities:
 * - User registration with password hashing
 * - User login with JWT token generation
 * - Current user information retrieval
 * - Password change functionality
 *
 * Integration notes: Public endpoints for login/register, protected for user info
 */

import { Router, Response } from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validatePasswordStrength,
  validateEmail,
} from '../services/auth.service.js'
import {
  createProfile,
  findProfileByEmail,
  findProfileById,
  updateProfile,
  updateLastLogin,
} from '../services/database.service.js'
import { AppError, AuthenticatedRequest, ApiResponse } from '../types/index.js'
import { logEvent } from '../services/logger.service.js'

const router = Router()

/**
 * Register new user
 * POST /api/auth/register
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res: Response) => {
    const { email, password, name } = req.body

    // Validate email format
    if (!validateEmail(email)) {
      throw new AppError(400, 'INVALID_EMAIL', 'Invalid email format')
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      throw new AppError(400, 'WEAK_PASSWORD', 'Password does not meet requirements', {
        errors: passwordValidation.errors,
      })
    }

    // Check if user already exists
    const existingUser = await findProfileByEmail(email)
    if (existingUser) {
      throw new AppError(409, 'USER_EXISTS', 'User with this email already exists')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user (default role is viewer)
    const user = await createProfile({
      email,
      passwordHash,
      name,
      role: 'viewer',
    })

    // Generate JWT token
    const token = generateToken(user)

    logEvent('User registered', { userId: user.id, email: user.email })

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone || null,
          bankAccount: user.bankAccount || null,
          bankName: user.bankName || null,
          accountHolder: user.accountHolder || null,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLogin?.toISOString() || null,
        },
      },
      message: 'Registration successful',
    }

    res.status(201).json(response)
  })
)

/**
 * Login user
 * POST /api/auth/login
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res: Response) => {
    const { email, password } = req.body

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase()

    // Find user by email
    const user = await findProfileByEmail(normalizedEmail)
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    // Update last login timestamp
    await updateLastLogin(user.id)

    // Generate JWT token
    const token = generateToken(user)

    logEvent('User logged in', { userId: user.id, email: user.email })

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone || null,
          bankAccount: user.bankAccount || null,
          bankName: user.bankName || null,
          accountHolder: user.accountHolder || null,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLogin?.toISOString() || null,
        },
      },
      message: 'Login successful',
    }

    res.status(200).json(response)
  })
)

/**
 * Get current user information
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const user = await findProfileById(req.user.userId)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        bankAccount: user.bankAccount || null,
        bankName: user.bankName || null,
        accountHolder: user.accountHolder || null,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
      },
    }

    res.status(200).json(response)
  })
)

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const { currentPassword, newPassword } = req.body

    // Get user
    const user = await findProfileById(req.user.userId)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    )
    if (!isCurrentPasswordValid) {
      throw new AppError(401, 'INVALID_PASSWORD', 'Current password is incorrect')
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      throw new AppError(400, 'WEAK_PASSWORD', 'New password does not meet requirements', {
        errors: passwordValidation.errors,
      })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await updateProfile(user.id, { passwordHash: newPasswordHash })

    logEvent('Password changed', { userId: user.id })

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    }

    res.status(200).json(response)
  })
)

export default router
