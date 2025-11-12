/**
 * Test Utilities and Helpers
 * Provides common functionality for tests
 */

import jwt from 'jsonwebtoken'
import type { JWTPayload } from '../../types/index.js'
import type { Profile } from '../../db/schema.js'

/**
 * Generate a test JWT token
 */
export function generateTestToken(payload: Partial<JWTPayload>): string {
  const fullPayload: JWTPayload = {
    userId: payload.userId || 'test-user-id',
    email: payload.email || 'test@example.com',
    role: payload.role || 'viewer',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  }

  return jwt.sign(fullPayload, process.env.JWT_SECRET!, {
    issuer: 'expense-management-api',
    audience: 'expense-management-client',
  })
}

/**
 * Generate an expired JWT token for testing
 */
export function generateExpiredToken(payload: Partial<JWTPayload>): string {
  const fullPayload: JWTPayload = {
    userId: payload.userId || 'test-user-id',
    email: payload.email || 'test@example.com',
    role: payload.role || 'viewer',
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  }

  return jwt.sign(fullPayload, process.env.JWT_SECRET!, {
    issuer: 'expense-management-api',
    audience: 'expense-management-client',
  })
}

/**
 * Generate an invalid JWT token (wrong secret)
 */
export function generateInvalidToken(): string {
  return jwt.sign(
    { userId: 'test', email: 'test@example.com', role: 'viewer' },
    'wrong-secret-key',
    { expiresIn: '1h' }
  )
}

/**
 * Create a mock profile object for testing
 */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'test-profile-id',
    email: 'test@example.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyB0gQPdvSSq', // "password"
    name: 'Test User',
    role: 'viewer',
    createdAt: new Date(),
    lastLogin: null,
    ...overrides,
  }
}

/**
 * Create a mock admin profile
 */
export function createMockAdmin(overrides?: Partial<Profile>): Profile {
  return createMockProfile({
    id: 'admin-profile-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    ...overrides,
  })
}

/**
 * Mock expense data generator
 */
export function createMockExpense(overrides?: any): any {
  return {
    id: 'test-expense-id',
    referenceNumber: 'EXP-20250112-0001',
    email: 'test@example.com',
    phone: '+34123456789',
    name: 'Test',
    surname: 'User',
    event: 'mwc_barcelona',
    category: 'accommodation',
    type: 'reimbursable',
    invoiceNumber: 'INV-001',
    invoiceDate: new Date('2025-01-10'),
    vendorName: 'Hotel Test',
    vendorNif: 'B12345678',
    totalAmount: '150.00',
    status: 'submitted',
    bankAccount: 'ES1234567890123456789012',
    accountHolder: 'Test User',
    fileUrl: 'https://example.com/receipt.pdf',
    fileName: 'receipt.pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Wait for a specified amount of time (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock implementation of database queries for testing
 */
export const mockDbQueries = {
  findProfileByEmail: jest.fn(),
  findProfileById: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  createExpense: jest.fn(),
  findExpenseById: jest.fn(),
  listExpenses: jest.fn(),
  updateExpenseStatus: jest.fn(),
  createAuditLog: jest.fn(),
}

/**
 * Reset all mock functions
 */
export function resetAllMocks(): void {
  Object.values(mockDbQueries).forEach(mock => mock.mockReset())
}
