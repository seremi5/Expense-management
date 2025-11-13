/**
 * Shared test mocks for route integration tests
 * This file sets up jest.unstable_mockModule for ES modules
 */

import { jest } from '@jest/globals'

// Mock all database service functions
export const mockDatabase = () => {
  jest.unstable_mockModule('../../services/database.service.js', () => ({
    createProfile: jest.fn(),
    findProfileByEmail: jest.fn(),
    findProfileById: jest.fn(),
    updateProfile: jest.fn(),
    updateLastLogin: jest.fn(),
    getAllProfiles: jest.fn(),
    createExpense: jest.fn(),
    findExpenseById: jest.fn(),
    findExpenseByReferenceNumber: jest.fn(),
    findExpenses: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    createLineItems: jest.fn(),
    deleteLineItemsByExpenseId: jest.fn(),
    createAuditLog: jest.fn(),
    getAuditLogsByExpenseId: jest.fn(),
    getRecentAuditLogs: jest.fn(),
    getExpenseStats: jest.fn(),
    generateReferenceNumber: jest.fn(),
  }))
}

// Mock all logger functions
export const mockLogger = () => {
  jest.unstable_mockModule('../../services/logger.service.js', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarn: jest.fn(),
    logDebug: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    logEvent: jest.fn(),
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  }))
}

// Mock the database (drizzle)
export const mockDb = () => {
  jest.unstable_mockModule('../../db/index.js', () => ({
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }))
}

// Mock OCR service
export const mockOCR = () => {
  jest.unstable_mockModule('../../services/ocr.service.js', () => ({
    OCRService: jest.fn().mockImplementation(() => ({
      extractDocument: jest.fn(),
      extractInvoice: jest.fn(),
      extractReceipt: jest.fn(),
    })),
  }))
}
