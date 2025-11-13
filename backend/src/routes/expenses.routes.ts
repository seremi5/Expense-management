/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/expenses.routes.ts
 *
 * Purpose: Expense management endpoints (CRUD operations)
 *
 * Dependencies: Database service, validation, authentication
 * Used by: Frontend expense submission and viewing
 *
 * Key responsibilities:
 * - Create new expense submissions
 * - List expenses with filtering and pagination
 * - Get individual expense details
 * - Update expense information (limited)
 * - Delete draft expenses
 *
 * Integration notes: Most endpoints require authentication
 */

import { Router, Response } from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import {
  createExpenseSchema,
  listExpensesSchema,
  getExpenseByIdSchema,
} from '../validators/expense.validator.js'
import {
  createExpense,
  findExpenseById,
  findExpenses,
  generateReferenceNumber,
  createAuditLog,
} from '../services/database.service.js'
import { AppError, AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index.js'
import { logEvent } from '../services/logger.service.js'

const router = Router()

/**
 * Create new expense
 * POST /api/expenses
 */
router.post(
  '/',
  validate(createExpenseSchema),
  asyncHandler(async (req, res: Response) => {
    const {
      email,
      phone,
      name,
      surname,
      event,
      category,
      type,
      invoiceNumber,
      invoiceDate,
      vendorName,
      vendorNif,
      totalAmount,
      currency,
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
      ocrConfidence,
      lineItems,
    } = req.body

    // Use invoice number as reference
    const referenceNumber = invoiceNumber

    // Create expense
    const result = await createExpense(
      {
        referenceNumber,
        email,
        phone,
        name,
        surname,
        event,
        category,
        type,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        vendorName,
        vendorNif,
        totalAmount,
        currency: currency || 'EUR',
        taxBase: taxBase || null,
        vat21Base: vat21Base || null,
        vat21Amount: vat21Amount || null,
        vat10Base: vat10Base || null,
        vat10Amount: vat10Amount || null,
        vat4Base: vat4Base || null,
        vat4Amount: vat4Amount || null,
        vat0Base: vat0Base || null,
        vat0Amount: vat0Amount || null,
        bankAccount: bankAccount || null,
        accountHolder: accountHolder || null,
        fileUrl,
        fileName,
        comments: comments || null,
        ocrConfidence: ocrConfidence || null,
        status: 'submitted',
      },
      lineItems?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        expenseId: '', // Will be set by createExpense
      }))
    )

    // Create audit log entry
    await createAuditLog({
      expenseId: result.expense.id,
      userId: null,
      action: 'created',
      oldValue: null,
      newValue: { status: 'submitted' },
    })

    logEvent('Expense created', {
      expenseId: result.expense.id,
      referenceNumber: result.expense.referenceNumber,
      email,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        ...result.expense,
        lineItems: result.lineItems,
        createdAt: result.expense.createdAt.toISOString(),
        updatedAt: result.expense.updatedAt.toISOString(),
        invoiceDate: result.expense.invoiceDate.toISOString(),
      },
      message: 'Expense submitted successfully',
    }

    res.status(201).json(response)
  })
)

/**
 * List expenses with filtering and pagination
 * GET /api/expenses
 */
router.get(
  '/',
  optionalAuth,
  validate(listExpensesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page,
      limit,
      status,
      event,
      category,
      type,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 20

    // Build filters
    const filters: any = {}

    if (status) filters.status = status
    if (event) filters.event = event
    if (category) filters.category = category
    if (type) filters.type = type
    if (search) filters.search = search as string
    if (startDate) filters.startDate = new Date(startDate as string)
    if (endDate) filters.endDate = new Date(endDate as string)

    // If user is authenticated but not admin, filter by their email
    if (req.user && req.user.role !== 'admin') {
      filters.email = req.user.email
      console.log('[EXPENSES] Filtering by user email:', req.user.email)
    } else {
      console.log('[EXPENSES] No filter - showing all expenses (no user or admin)')
    }

    console.log('[EXPENSES] Filters:', JSON.stringify(filters))

    // Get expenses
    const result = await findExpenses(
      filters,
      { page: pageNum, limit: limitNum },
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    )

    console.log('[EXPENSES] Found', result.total, 'expenses, returning', result.data.length, 'items')

    // Format dates
    const formattedData = result.data.map((expense) => ({
      ...expense,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      invoiceDate: expense.invoiceDate.toISOString(),
      approvedAt: expense.approvedAt?.toISOString() || null,
      paidAt: expense.paidAt?.toISOString() || null,
    }))

    const response: ApiResponse = {
      success: true,
      data: {
        data: formattedData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      },
    }

    res.status(200).json(response)
  })
)

/**
 * Get expense by ID
 * GET /api/expenses/:id
 */
router.get(
  '/:id',
  optionalAuth,
  validate(getExpenseByIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    const expense = await findExpenseById(id)
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found')
    }

    // If user is authenticated but not admin, verify they can access this expense
    if (req.user && req.user.role !== 'admin' && expense.email !== req.user.email) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this expense')
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...expense,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
        invoiceDate: expense.invoiceDate.toISOString(),
        approvedAt: expense.approvedAt?.toISOString() || null,
        paidAt: expense.paidAt?.toISOString() || null,
      },
    }

    res.status(200).json(response)
  })
)

export default router
