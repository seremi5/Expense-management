/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/settings.routes.ts
 *
 * Purpose: Admin settings endpoints for managing events and categories
 *
 * Dependencies: Database service, authentication, validation
 * Used by: Admin settings page
 *
 * Key responsibilities:
 * - List all events and categories
 * - Create new events and categories
 * - Update existing events and categories
 * - Delete/deactivate events and categories
 *
 * Integration notes: All endpoints require admin authentication
 */

import { Router, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware.js'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'
import { db } from '../db/index.js'
import { events, categories } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { AppError, AuthenticatedRequest, ApiResponse } from '../types/index.js'
import { logEvent } from '../services/logger.service.js'

const router = Router()

// ========================================
// PUBLIC ROUTES (Authenticated users)
// ========================================

/**
 * Get active events only (for dropdowns)
 * GET /api/settings/events/active
 */
router.get(
  '/events/active',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const activeEvents = await db
      .select()
      .from(events)
      .where(eq(events.isActive, 'true'))
      .orderBy(events.label)

    const response: ApiResponse = {
      success: true,
      data: activeEvents.map((event) => ({
        key: event.key,
        label: event.label,
      })),
    }

    res.status(200).json(response)
  })
)

/**
 * Get active categories only (for dropdowns)
 * GET /api/settings/categories/active
 */
router.get(
  '/categories/active',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const activeCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, 'true'))
      .orderBy(categories.label)

    const response: ApiResponse = {
      success: true,
      data: activeCategories.map((category) => ({
        key: category.key,
        label: category.label,
      })),
    }

    res.status(200).json(response)
  })
)

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * Get all events (admin view - includes inactive)
 * GET /api/settings/events
 */
router.get(
  '/events',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const allEvents = await db.select().from(events).orderBy(events.label)

    const response: ApiResponse = {
      success: true,
      data: allEvents.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      })),
    }

    res.status(200).json(response)
  })
)

/**
 * Create new event
 * POST /api/settings/events
 */
router.post(
  '/events',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key, label } = req.body

    if (!key || !label) {
      throw new AppError(400, 'MISSING_FIELDS', 'Key and label are required')
    }

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Check if key already exists
    const existing = await db.select().from(events).where(eq(events.key, key)).limit(1)
    if (existing.length > 0) {
      throw new AppError(409, 'EVENT_EXISTS', 'Event with this key already exists')
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        key,
        label,
        isActive: 'true',
      })
      .returning()

    logEvent('Event created', { eventKey: key, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      data: {
        ...newEvent,
        createdAt: newEvent.createdAt.toISOString(),
        updatedAt: newEvent.updatedAt.toISOString(),
      },
      message: 'Event created successfully',
    }

    res.status(201).json(response)
  })
)

/**
 * Update event
 * PATCH /api/settings/events/:id
 */
router.patch(
  '/events/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const { key, label, isActive } = req.body

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const updateData: any = { updatedAt: new Date() }
    if (key !== undefined) updateData.key = key
    if (label !== undefined) updateData.label = label
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db.update(events).set(updateData).where(eq(events.id, id)).returning()

    if (!updated) {
      throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found')
    }

    logEvent('Event updated', { eventId: id, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: 'Event updated successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Delete event
 * DELETE /api/settings/events/:id
 */
router.delete(
  '/events/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning()

    if (!deleted) {
      throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found')
    }

    logEvent('Event deleted', { eventId: id, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      message: 'Event deleted successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Get all categories
 * GET /api/settings/categories
 */
router.get(
  '/categories',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const allCategories = await db.select().from(categories).orderBy(categories.label)

    const response: ApiResponse = {
      success: true,
      data: allCategories.map((category) => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
    }

    res.status(200).json(response)
  })
)

/**
 * Create new category
 * POST /api/settings/categories
 */
router.post(
  '/categories',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key, label } = req.body

    if (!key || !label) {
      throw new AppError(400, 'MISSING_FIELDS', 'Key and label are required')
    }

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Check if key already exists
    const existing = await db.select().from(categories).where(eq(categories.key, key)).limit(1)
    if (existing.length > 0) {
      throw new AppError(409, 'CATEGORY_EXISTS', 'Category with this key already exists')
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        key,
        label,
        isActive: 'true',
      })
      .returning()

    logEvent('Category created', { categoryKey: key, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      data: {
        ...newCategory,
        createdAt: newCategory.createdAt.toISOString(),
        updatedAt: newCategory.updatedAt.toISOString(),
      },
      message: 'Category created successfully',
    }

    res.status(201).json(response)
  })
)

/**
 * Update category
 * PATCH /api/settings/categories/:id
 */
router.patch(
  '/categories/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const { key, label, isActive } = req.body

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const updateData: any = { updatedAt: new Date() }
    if (key !== undefined) updateData.key = key
    if (label !== undefined) updateData.label = label
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()

    if (!updated) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found')
    }

    logEvent('Category updated', { categoryId: id, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: 'Category updated successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Delete category
 * DELETE /api/settings/categories/:id
 */
router.delete(
  '/categories/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning()

    if (!deleted) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found')
    }

    logEvent('Category deleted', { categoryId: id, adminId: req.user.userId })

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    }

    res.status(200).json(response)
  })
)

export default router
