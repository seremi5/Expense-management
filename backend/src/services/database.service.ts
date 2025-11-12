/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/services/database.service.ts
 *
 * Purpose: Database service providing CRUD operations for all entities
 *
 * Dependencies: Drizzle ORM, database schema
 * Used by: All API routes
 *
 * Key responsibilities:
 * - Provide type-safe database queries
 * - Handle pagination and filtering
 * - Manage relationships between entities
 * - Create audit log entries
 *
 * Integration notes: All database operations go through this service for consistency
 */

import { eq, and, or, desc, asc, sql, count, like, gte, lte, inArray } from 'drizzle-orm'
import { db, profiles, expenses, expenseLineItems, auditLog } from '../db/index.js'
import type {
  NewProfile,
  NewExpense,
  NewExpenseLineItem,
  NewAuditLog,
  Profile,
  Expense,
} from '../db/schema.js'
import type { ExpenseFilters } from '../types/index.js'

/**
 * Profile operations
 */

export async function createProfile(data: NewProfile): Promise<Profile> {
  const [profile] = await db.insert(profiles).values(data).returning()
  return profile
}

export async function findProfileByEmail(email: string): Promise<Profile | undefined> {
  return db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  })
}

export async function findProfileById(id: string): Promise<Profile | undefined> {
  return db.query.profiles.findFirst({
    where: eq(profiles.id, id),
  })
}

export async function updateProfile(
  id: string,
  data: Partial<Omit<NewProfile, 'id'>>
): Promise<Profile | undefined> {
  const [updated] = await db
    .update(profiles)
    .set(data)
    .where(eq(profiles.id, id))
    .returning()
  return updated
}

export async function updateLastLogin(id: string): Promise<void> {
  await db
    .update(profiles)
    .set({ lastLogin: new Date() })
    .where(eq(profiles.id, id))
}

export async function getAllProfiles(): Promise<Profile[]> {
  return db.select().from(profiles).orderBy(desc(profiles.createdAt))
}

/**
 * Expense operations
 */

export async function createExpense(
  data: NewExpense,
  lineItems?: NewExpenseLineItem[]
): Promise<{ expense: Expense; lineItems: any[] }> {
  const [expense] = await db.insert(expenses).values(data).returning()

  let insertedLineItems: any[] = []
  if (lineItems && lineItems.length > 0) {
    const lineItemsWithExpenseId = lineItems.map((item) => ({
      ...item,
      expenseId: expense.id,
    }))
    insertedLineItems = await db
      .insert(expenseLineItems)
      .values(lineItemsWithExpenseId)
      .returning()
  }

  return { expense, lineItems: insertedLineItems }
}

export async function findExpenseById(id: string): Promise<any | undefined> {
  return db.query.expenses.findFirst({
    where: eq(expenses.id, id),
    with: {
      lineItems: true,
      approver: {
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  })
}

export async function findExpenseByReferenceNumber(
  referenceNumber: string
): Promise<Expense | undefined> {
  return db.query.expenses.findFirst({
    where: eq(expenses.referenceNumber, referenceNumber),
  })
}

export async function findExpenses(
  filters: ExpenseFilters = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ data: any[]; total: number }> {
  const conditions: any[] = []

  // Build filter conditions
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(inArray(expenses.status, filters.status as any[]))
    } else {
      conditions.push(eq(expenses.status, filters.status as any))
    }
  }

  if (filters.event) {
    if (Array.isArray(filters.event)) {
      conditions.push(inArray(expenses.event, filters.event as any[]))
    } else {
      conditions.push(eq(expenses.event, filters.event as any))
    }
  }

  if (filters.category) {
    if (Array.isArray(filters.category)) {
      conditions.push(inArray(expenses.category, filters.category as any[]))
    } else {
      conditions.push(eq(expenses.category, filters.category as any))
    }
  }

  if (filters.type) {
    if (Array.isArray(filters.type)) {
      conditions.push(inArray(expenses.type, filters.type as any[]))
    } else {
      conditions.push(eq(expenses.type, filters.type as any))
    }
  }

  if (filters.email) {
    conditions.push(eq(expenses.email, filters.email))
  }

  if (filters.startDate) {
    conditions.push(gte(expenses.createdAt, filters.startDate))
  }

  if (filters.endDate) {
    conditions.push(lte(expenses.createdAt, filters.endDate))
  }

  if (filters.search) {
    conditions.push(
      or(
        like(expenses.vendorName, `%${filters.search}%`),
        like(expenses.invoiceNumber, `%${filters.search}%`),
        like(expenses.referenceNumber, `%${filters.search}%`)
      )
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(expenses)
    .where(whereClause)

  // Determine sort column
  const sortColumn =
    sortBy === 'createdAt'
      ? expenses.createdAt
      : sortBy === 'totalAmount'
      ? expenses.totalAmount
      : sortBy === 'invoiceDate'
      ? expenses.invoiceDate
      : expenses.createdAt

  const sortFn = sortOrder === 'asc' ? asc : desc

  // Get paginated data
  const data = await db.query.expenses.findMany({
    where: whereClause,
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit,
    orderBy: sortFn(sortColumn),
    with: {
      lineItems: true,
      approver: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  return { data, total: Number(total) }
}

export async function updateExpense(
  id: string,
  data: Partial<NewExpense>
): Promise<Expense | undefined> {
  const [updated] = await db
    .update(expenses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning()
  return updated
}

export async function deleteExpense(id: string): Promise<void> {
  await db.delete(expenses).where(eq(expenses.id, id))
}

/**
 * Line item operations
 */

export async function createLineItems(
  lineItems: NewExpenseLineItem[]
): Promise<any[]> {
  return db.insert(expenseLineItems).values(lineItems).returning()
}

export async function deleteLineItemsByExpenseId(expenseId: string): Promise<void> {
  await db.delete(expenseLineItems).where(eq(expenseLineItems.expenseId, expenseId))
}

/**
 * Audit log operations
 */

export async function createAuditLog(data: NewAuditLog): Promise<void> {
  await db.insert(auditLog).values(data)
}

export async function getAuditLogsByExpenseId(expenseId: string): Promise<any[]> {
  return db.query.auditLog.findMany({
    where: eq(auditLog.expenseId, expenseId),
    orderBy: desc(auditLog.createdAt),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })
}

export async function getRecentAuditLogs(limit: number = 20): Promise<any[]> {
  return db.query.auditLog.findMany({
    limit,
    orderBy: desc(auditLog.createdAt),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
      expense: {
        columns: {
          id: true,
          referenceNumber: true,
          vendorName: true,
        },
      },
    },
  })
}

/**
 * Statistics operations
 */

export async function getExpenseStats(): Promise<{
  totalExpenses: number
  totalAmount: string
  pendingCount: number
  pendingAmount: string
  approvedCount: number
  approvedAmount: string
  paidCount: number
  paidAmount: string
  declinedCount: number
  declinedAmount: string
  expensesByStatus: Record<string, number>
  expensesByEvent: Record<string, number>
  expensesByCategory: Record<string, number>
}> {
  // Total expenses count
  const [{ total }] = await db.select({ total: count() }).from(expenses)

  // Total amount
  const [{ sum: totalAmount }] = await db
    .select({ sum: sql<string>`COALESCE(SUM(${expenses.totalAmount}::numeric), 0)` })
    .from(expenses)

  // Group by status with counts and amounts
  const statusCounts = await db
    .select({
      status: expenses.status,
      count: count(),
      amount: sql<string>`COALESCE(SUM(${expenses.totalAmount}::numeric), 0)`,
    })
    .from(expenses)
    .groupBy(expenses.status)

  // Group by event
  const eventCounts = await db
    .select({
      event: expenses.event,
      count: count(),
    })
    .from(expenses)
    .groupBy(expenses.event)

  // Group by category
  const categoryCounts = await db
    .select({
      category: expenses.category,
      count: count(),
    })
    .from(expenses)
    .groupBy(expenses.category)

  // Extract counts and amounts by status
  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, { count: Number(s.count), amount: s.amount }])
  )

  return {
    totalExpenses: Number(total),
    totalAmount: totalAmount || '0',
    pendingCount: statusMap['submitted']?.count || 0,
    pendingAmount: statusMap['submitted']?.amount || '0',
    approvedCount: statusMap['ready_to_pay']?.count || 0,
    approvedAmount: statusMap['ready_to_pay']?.amount || '0',
    paidCount: statusMap['paid']?.count || 0,
    paidAmount: statusMap['paid']?.amount || '0',
    declinedCount: statusMap['declined']?.count || 0,
    declinedAmount: statusMap['declined']?.amount || '0',
    expensesByStatus: Object.fromEntries(
      statusCounts.map((s) => [s.status, Number(s.count)])
    ),
    expensesByEvent: Object.fromEntries(
      eventCounts.map((e) => [e.event, Number(e.count)])
    ),
    expensesByCategory: Object.fromEntries(
      categoryCounts.map((c) => [c.category, Number(c.count)])
    ),
  }
}

/**
 * Generate unique reference number
 * Format: EXP-YYYYMMDD-XXXX
 */
export async function generateReferenceNumber(): Promise<string> {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')

  // Find the last reference number for today
  const lastRef = await db
    .select({ referenceNumber: expenses.referenceNumber })
    .from(expenses)
    .where(like(expenses.referenceNumber, `EXP-${dateStr}-%`))
    .orderBy(desc(expenses.referenceNumber))
    .limit(1)

  let sequence = 1
  if (lastRef.length > 0) {
    const lastSequence = parseInt(lastRef[0].referenceNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `EXP-${dateStr}-${sequence.toString().padStart(4, '0')}`
}
