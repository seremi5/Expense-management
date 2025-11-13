/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/admin.routes.ts
 *
 * Purpose: Admin-only endpoints for expense management and statistics
 *
 * Dependencies: Database service, authentication, validation
 * Used by: Admin dashboard
 *
 * Key responsibilities:
 * - Get expense statistics and metrics
 * - Update expense status (approve, decline, mark paid)
 * - Get audit logs
 * - View recent activity
 * - Manage user roles
 *
 * Integration notes: All endpoints require admin authentication
 */

import { Router, Response } from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { updateExpenseStatusSchema } from '../validators/expense.validator.js'
import { updateProfileRoleSchema } from '../validators/profile.validator.js'
import {
  findExpenseById,
  updateExpense,
  getExpenseStats,
  getRecentAuditLogs,
  getAuditLogsByExpenseId,
  createAuditLog,
  updateProfile,
} from '../services/database.service.js'
import { AppError, AuthenticatedRequest, ApiResponse } from '../types/index.js'
import { logEvent } from '../services/logger.service.js'

const router = Router()

// All routes require admin authentication
router.use(authenticate)
router.use(requireAdmin)

/**
 * Get expense statistics
 * GET /api/admin/stats
 */
router.get(
  '/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await getExpenseStats()
    const recentActivity = await getRecentAuditLogs(10)

    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      expenseId: log.expenseId,
      userId: log.userId || null,
      createdAt: log.createdAt.toISOString(),
      expense: log.expense,
      user: log.user,
    }))

    const response: ApiResponse = {
      success: true,
      data: {
        ...stats,
        recentActivity: formattedActivity,
      },
    }

    res.status(200).json(response)
  })
)

/**
 * Update expense status
 * PATCH /api/admin/expenses/:id/status
 */
router.patch(
  '/expenses/:id/status',
  validate(updateExpenseStatusSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const { status, declinedReason, comments } = req.body

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Get existing expense
    const expense = await findExpenseById(id)
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found')
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    // Handle status-specific fields
    if (status === 'declined') {
      if (!declinedReason) {
        throw new AppError(400, 'DECLINED_REASON_REQUIRED', 'Declined reason is required')
      }
      updateData.declinedReason = declinedReason
    }

    if (status === 'ready_to_pay' || status === 'validated') {
      updateData.approvedBy = req.user.userId
      updateData.approvedAt = new Date()
    }

    if (status === 'paid') {
      updateData.paidAt = new Date()
    }

    if (comments) {
      updateData.comments = comments
    }

    // Update expense
    const updated = await updateExpense(id, updateData)

    // Create audit log
    await createAuditLog({
      expenseId: id,
      userId: req.user.userId,
      action: `status_changed_to_${status}`,
      oldValue: { status: expense.status },
      newValue: { status, declinedReason, comments },
    })

    logEvent('Expense status updated', {
      expenseId: id,
      oldStatus: expense.status,
      newStatus: status,
      adminId: req.user.userId,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        ...updated,
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString(),
        invoiceDate: updated!.invoiceDate.toISOString(),
        approvedAt: updated!.approvedAt?.toISOString() || null,
        paidAt: updated!.paidAt?.toISOString() || null,
      },
      message: 'Expense status updated successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Get audit logs for an expense
 * GET /api/admin/expenses/:id/audit
 */
router.get(
  '/expenses/:id/audit',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    // Verify expense exists
    const expense = await findExpenseById(id)
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found')
    }

    const auditLogs = await getAuditLogsByExpenseId(id)

    const formattedLogs = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      oldValue: log.oldValues,
      newValue: log.newValues,
      createdAt: log.createdAt.toISOString(),
      user: log.user,
    }))

    const response: ApiResponse = {
      success: true,
      data: formattedLogs,
    }

    res.status(200).json(response)
  })
)

/**
 * Update expense data
 * PATCH /api/admin/expenses/:id
 */
router.patch(
  '/expenses/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Get existing expense
    const expense = await findExpenseById(id)
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found')
    }

    // Extract updatable fields from request body
    const {
      name,
      surname,
      email,
      phone,
      event,
      category,
      type,
      invoiceNumber,
      invoiceDate,
      vendorName,
      vendorNif,
      totalAmount,
      taxBase,
      vat21Base,
      vat21Amount,
      vat10Base,
      vat10Amount,
      vat4Base,
      vat4Amount,
      vat0Base,
      vat0Amount,
      bankAccount,
      accountHolder,
      fileUrl,
      fileName,
      comments,
    } = req.body

    // Build update object with only provided fields
    const updateData: any = { updatedAt: new Date() }

    if (name !== undefined) updateData.name = name
    if (surname !== undefined) updateData.surname = surname
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (event !== undefined) updateData.event = event
    if (category !== undefined) updateData.category = category
    if (type !== undefined) updateData.type = type
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber
    if (invoiceDate !== undefined) updateData.invoiceDate = new Date(invoiceDate)
    if (vendorName !== undefined) updateData.vendorName = vendorName
    if (vendorNif !== undefined) updateData.vendorNif = vendorNif
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount
    if (taxBase !== undefined) updateData.taxBase = taxBase
    if (vat21Base !== undefined) updateData.vat21Base = vat21Base
    if (vat21Amount !== undefined) updateData.vat21Amount = vat21Amount
    if (vat10Base !== undefined) updateData.vat10Base = vat10Base
    if (vat10Amount !== undefined) updateData.vat10Amount = vat10Amount
    if (vat4Base !== undefined) updateData.vat4Base = vat4Base
    if (vat4Amount !== undefined) updateData.vat4Amount = vat4Amount
    if (vat0Base !== undefined) updateData.vat0Base = vat0Base
    if (vat0Amount !== undefined) updateData.vat0Amount = vat0Amount
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl
    if (fileName !== undefined) updateData.fileName = fileName
    if (comments !== undefined) updateData.comments = comments

    // Update expense
    const updated = await updateExpense(id, updateData)

    // Create audit log
    await createAuditLog({
      expenseId: id,
      userId: req.user.userId,
      action: 'expense_updated',
      oldValue: expense,
      newValue: updateData,
    })

    logEvent('Expense updated', {
      expenseId: id,
      adminId: req.user.userId,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        ...updated,
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString(),
        invoiceDate: updated!.invoiceDate.toISOString(),
        approvedAt: updated!.approvedAt?.toISOString() || null,
        paidAt: updated!.paidAt?.toISOString() || null,
      },
      message: 'Expense updated successfully',
    }

    res.status(200).json(response)
  })
)

/**
 * Update user role
 * PATCH /api/admin/profiles/:id/role
 */
router.patch(
  '/profiles/:id/role',
  validate(updateProfileRoleSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const { role } = req.body

    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Prevent self-role change
    if (id === req.user.userId) {
      throw new AppError(400, 'CANNOT_CHANGE_OWN_ROLE', 'Cannot change your own role')
    }

    // Update role
    const updated = await updateProfile(id, { role })
    if (!updated) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found')
    }

    logEvent('User role updated', {
      userId: id,
      newRole: role,
      adminId: req.user.userId,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
      message: 'User role updated successfully',
    }

    res.status(200).json(response)
  })
)

export default router
