/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/types/index.ts
 *
 * Purpose: Central TypeScript type definitions for the Expense Reimbursement API
 *
 * Dependencies: Express, database schema
 * Used by: All API routes, middleware, and services
 *
 * Key responsibilities:
 * - Define API request/response types
 * - Define error types
 * - Define JWT payload types
 * - Re-export database types
 *
 * Integration notes: These types ensure type safety across the entire API surface
 */

import { Request } from 'express'
import type { Profile, Expense, ExpenseLineItem, AuditLog } from '../db/schema.js'

/**
 * Authentication-related types
 */

export interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'viewer'
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * API Response types
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Error types
 */

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  statusCode: number
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Authentication request/response types
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'viewer'
  }
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface RegisterResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'viewer'
  }
}

/**
 * Expense request/response types
 */

export interface CreateExpenseRequest {
  // Submitter Information
  email: string
  phone: string
  name: string
  surname: string

  // Expense Classification
  event: string
  category: string
  type: 'reimbursable' | 'non_reimbursable' | 'payable'

  // Invoice Details
  invoiceNumber: string
  invoiceDate: string // ISO date string
  vendorName: string
  vendorNif: string

  // Financial Information
  totalAmount: string
  currency?: string

  // Tax Breakdown (optional)
  taxBase?: string
  vat21Base?: string
  vat21Amount?: string
  vat10Base?: string
  vat10Amount?: string
  vat4Base?: string
  vat4Amount?: string
  vat0Base?: string
  vat0Amount?: string

  // Bank Account Information (conditional)
  bankAccount?: string
  accountHolder?: string

  // File Information
  fileUrl: string
  fileName: string

  // Additional Information
  comments?: string
  ocrConfidence?: string

  // Line items
  lineItems?: Array<{
    description: string
    quantity: string
    unitPrice: string
    totalPrice: string
  }>
}

export interface UpdateExpenseStatusRequest {
  status: 'submitted' | 'ready_to_pay' | 'paid' | 'declined' | 'validated' | 'flagged'
  declinedReason?: string
  comments?: string
}

export interface ExpenseResponse extends Omit<Expense, 'createdAt' | 'updatedAt' | 'invoiceDate' | 'approvedAt' | 'paidAt'> {
  createdAt: string
  updatedAt: string
  invoiceDate: string
  approvedAt?: string | null
  paidAt?: string | null
  lineItems?: ExpenseLineItem[]
  approver?: Pick<Profile, 'id' | 'email' | 'name'> | null
}

export interface ExpenseListQuery {
  page?: string
  limit?: string
  status?: string
  event?: string
  category?: string
  type?: string
  search?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Profile request/response types
 */

export interface UpdateProfileRequest {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export interface ProfileResponse extends Omit<Profile, 'passwordHash' | 'createdAt' | 'lastLogin'> {
  createdAt: string
  lastLogin?: string | null
}

/**
 * Admin request/response types
 */

export interface AdminStatsResponse {
  totalExpenses: number
  totalAmount: string
  expensesByStatus: Record<string, number>
  expensesByEvent: Record<string, number>
  expensesByCategory: Record<string, number>
  recentActivity: Array<{
    id: string
    action: string
    expenseId: string
    userId?: string | null
    createdAt: string
  }>
}

/**
 * File upload types
 */

export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
}

/**
 * Database query filters
 */

export interface ExpenseFilters {
  status?: string | string[]
  event?: string | string[]
  category?: string | string[]
  type?: string | string[]
  email?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

/**
 * Audit log types
 */

export interface AuditLogEntry extends Omit<AuditLog, 'createdAt'> {
  createdAt: string
  expense?: Pick<Expense, 'id' | 'referenceNumber' | 'vendorName'>
  user?: Pick<Profile, 'id' | 'email' | 'name'>
}

/**
 * Re-export database types
 */

export type { Profile, Expense, ExpenseLineItem, AuditLog }
export type { NewProfile, NewExpense, NewExpenseLineItem, NewAuditLog } from '../db/schema.js'
