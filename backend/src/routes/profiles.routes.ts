/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/profiles.routes.ts
 *
 * Purpose: User profile management endpoints
 *
 * Dependencies: Database service, validation, authentication
 * Used by: Frontend user settings
 *
 * Key responsibilities:
 * - Get current user profile
 * - Update user profile information
 * - List all profiles (admin only)
 *
 * Integration notes: All endpoints require authentication
 */

import { Router, Response } from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { updateProfileSchema } from '../validators/profile.validator.js'
import {
  findProfileById,
  updateProfile,
  getAllProfiles,
} from '../services/database.service.js'
import { hashPassword, validateEmail } from '../services/auth.service.js'
import { AppError, AuthenticatedRequest, ApiResponse } from '../types/index.js'
import { logEvent } from '../services/logger.service.js'

const router = Router()

/**
 * Get current user profile
 * GET /api/profiles/me
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const profile = await findProfileById(req.user.userId)
    if (!profile) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found')
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        phone: profile.phone || null,
        bankAccount: profile.bankAccount || null,
        bankName: profile.bankName || null,
        accountHolder: profile.accountHolder || null,
        createdAt: profile.createdAt.toISOString(),
        lastLogin: profile.lastLogin?.toISOString() || null,
      },
    }

    res.status(200).json(response)
  })
)

/**
 * Update current user profile
 * PATCH /api/profiles/me
 */
router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const { name, email, phone, bankAccount, bankName, accountHolder } = req.body

    // Check if email is being changed
    if (email && email !== req.user.email) {
      // Validate email format
      if (!validateEmail(email)) {
        throw new AppError(400, 'INVALID_EMAIL', 'Invalid email format')
      }

      // Check if email is already in use
      const existingProfile = await findProfileById(req.user.userId)
      if (existingProfile && existingProfile.email !== email) {
        // Check no other user has this email
        // This requires a more complex query - simplified for now
      }
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder

    const updated = await updateProfile(req.user.userId, updateData)
    if (!updated) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found')
    }

    logEvent('Profile updated', { userId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone || null,
        bankAccount: updated.bankAccount || null,
        bankName: updated.bankName || null,
        accountHolder: updated.accountHolder || null,
        createdAt: updated.createdAt.toISOString(),
        lastLogin: updated.lastLogin?.toISOString() || null,
      },
      message: 'Profile updated successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Get all profiles (admin only)
 * GET /api/profiles
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profiles = await getAllProfiles()

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      createdAt: profile.createdAt.toISOString(),
      lastLogin: profile.lastLogin?.toISOString() || null,
    }))

    const response: ApiResponse = {
      success: true,
      data: formattedProfiles,
    }

    res.status(200).json(response)
  })
)

export default router
