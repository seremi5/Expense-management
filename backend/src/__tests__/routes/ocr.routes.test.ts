/**
 * Integration Tests for OCR Routes
 * Tests document OCR extraction with mocked Gemini API
 */

import { jest, beforeEach, describe, it, expect } from '@jest/globals'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mock the services BEFORE importing anything else
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

// Mock the OCR service
jest.unstable_mockModule('../../services/ocr.service.js', () => ({
  OCRService: jest.fn().mockImplementation(() => ({
    extractDocument: jest.fn(),
    extractInvoice: jest.fn(),
    extractReceipt: jest.fn(),
  })),
}))

// Now import everything
const { createApp } = await import('../../app.js')
const dbService = await import('../../services/database.service.js')
const authService = await import('../../services/auth.service.js')
const { createMockProfile } = await import('../helpers/test-utils.js')
const { OCRService } = await import('../../services/ocr.service.js')
const request = (await import('supertest')).default

describe('OCR Routes', () => {
  let app: any
  let userToken: string
  let mockOCRInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()

    // Create user token
    const mockUser = createMockProfile({ id: 'user-1', email: 'user@example.com', role: 'viewer' })
    ;(dbService.findProfileById as any).mockResolvedValue(mockUser)
    userToken = authService.generateToken(mockUser)

    // Create mock OCR service instance
    mockOCRInstance = {
      extractDocument: jest.fn(),
      extractInvoice: jest.fn(),
      extractReceipt: jest.fn(),
    }

    ;(OCRService as any).mockImplementation(() => mockOCRInstance)
  })

  describe('POST /api/ocr/extract', () => {
    it('should extract data from invoice with VAT breakdown', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Hotel Barcelona SA',
            vat_number: 'B12345678',
          },
          document_number: 'INV-2025-001',
          date: '2025-01-15',
          total_amount: 12100, // cents
          subtotal: 10000, // cents
          tax_breakdown: [
            {
              tax_rate: 21,
              tax_base: 10000, // cents
              tax_amount: 2100, // cents
            },
          ],
          line_items: [
            {
              description: 'Room charges',
              quantity: 1,
              subtotal: 10000,
              tax_rate: 21,
              total: 12100,
            },
          ],
        },
        warnings: [],
        errors: [],
        duration: 1234,
        metadata: {
          model: 'gemini-2.0-flash',
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'invoice.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vendorName).toBe('Hotel Barcelona SA')
      expect(response.body.data.vendorNif).toBe('B12345678')
      expect(response.body.data.invoiceNumber).toBe('INV-2025-001')
      expect(response.body.data.invoiceDate).toBe('2025-01-15')
      expect(response.body.data.totalAmount).toBe(121.00)
      expect(response.body.data.taxBase).toBe(100.00)
      expect(response.body.data.vat21Base).toBe(100.00)
      expect(response.body.data.vat21Amount).toBe(21.00)
      expect(response.body.data.fileUrl).toMatch(/^\/uploads\//)
      expect(response.body.data.fileName).toBe('invoice.pdf')
    })

    it('should extract data with multiple VAT rates', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Restaurant Mix',
            vat_number: 'B87654321',
          },
          document_number: 'REC-2025-002',
          date: '2025-01-16',
          total_amount: 13100, // cents
          subtotal: 11000, // cents
          tax_breakdown: [
            {
              tax_rate: 21,
              tax_base: 5000, // cents
              tax_amount: 1050, // cents
            },
            {
              tax_rate: 10,
              tax_base: 6000, // cents
              tax_amount: 600, // cents
            },
          ],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'receipt.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat21Base).toBe(50.00)
      expect(response.body.data.vat21Amount).toBe(10.50)
      expect(response.body.data.vat10Base).toBe(60.00)
      expect(response.body.data.vat10Amount).toBe(6.00)
    })

    it('should handle 4% VAT rate', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Books Store',
            vat_number: 'B11111111',
          },
          document_number: 'INV-BOOKS-001',
          date: '2025-01-17',
          total_amount: 10400, // cents
          subtotal: 10000, // cents
          tax_breakdown: [
            {
              tax_rate: 4,
              tax_base: 10000, // cents
              tax_amount: 400, // cents
            },
          ],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'books.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat4Base).toBe(100.00)
      expect(response.body.data.vat4Amount).toBe(4.00)
    })

    it('should handle 0% VAT rate', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Export Company',
            vat_number: 'B22222222',
          },
          document_number: 'INV-EXPORT-001',
          date: '2025-01-18',
          total_amount: 10000, // cents
          subtotal: 10000, // cents
          tax_breakdown: [
            {
              tax_rate: 0,
              tax_base: 10000, // cents
              tax_amount: 0, // cents - must be 0 for exempt
            },
          ],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'export.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat0Base).toBe(100.00)
      expect(response.body.data.vat0Amount).toBe(0)
    })

    it('should extract line items with VAT calculation', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Office Supplies Ltd',
            vat_number: 'B33333333',
          },
          document_number: 'INV-2025-003',
          date: '2025-01-19',
          total_amount: 24200, // cents
          subtotal: 20000, // cents
          line_items: [
            {
              description: 'Printer paper',
              quantity: 5,
              subtotal: 5000, // cents (50 EUR)
              tax_rate: 21,
              total: 6050, // cents
            },
            {
              description: 'Pens',
              quantity: 10,
              subtotal: 1000, // cents (10 EUR)
              tax_rate: 21,
              total: 1210, // cents
            },
          ],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'supplies.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.lineItems).toHaveLength(2)
      expect(response.body.data.lineItems[0].description).toBe('Printer paper')
      expect(response.body.data.lineItems[0].quantity).toBe(5)
      expect(response.body.data.lineItems[0].unitPrice).toBe(10.00)
      expect(response.body.data.lineItems[0].subtotal).toBe(50.00)
      expect(response.body.data.lineItems[0].vatRate).toBe(21)
      expect(response.body.data.lineItems[0].total).toBe(60.50)
    })

    it('should clean Spanish NIF format', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Test Company',
            vat_number: 'B123456789999999', // Invalid extra digits
          },
          document_number: 'INV-001',
          date: '2025-01-20',
          total_amount: 10000,
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vendorNif).toBe('B12345678') // Cleaned to valid format
    })

    it('should handle OCR extraction failure', async () => {
      const mockOCRResponse = {
        success: false,
        error: 'Failed to extract document data',
        duration: 500,
        metadata: {
          model: 'gemini-2.0-flash',
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'bad.pdf')
        .expect(422)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Failed to extract document data')
    })

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No file uploaded')
    })

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/ocr/extract')
        .attach('file', Buffer.from('fake pdf content'), 'invoice.pdf')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should handle warnings from OCR service', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Test Company',
          },
          document_number: 'INV-001',
          date: '2025-01-21',
          total_amount: 10000,
        },
        warnings: [
          'VAT number not found',
          'Low confidence on date field',
        ],
        errors: [],
        duration: 1500,
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.warnings).toHaveLength(2)
      expect(response.body.warnings[0]).toBe('VAT number not found')
    })
  })

  describe('POST /api/ocr/extract/invoice', () => {
    it('should extract invoice-specific data', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Invoice Vendor',
            vat_number: 'B44444444',
          },
          document_number: 'INV-SPEC-001',
          date: '2025-01-22',
          total_amount: 50000,
          subtotal: 41322,
        },
      }

      ;(mockOCRInstance.extractInvoice as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract/invoice')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'invoice-specific.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.counterparty.name).toBe('Invoice Vendor')
      expect(mockOCRInstance.extractInvoice).toHaveBeenCalled()
    })

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/ocr/extract/invoice')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No file uploaded')
    })
  })

  describe('POST /api/ocr/extract/receipt', () => {
    it('should extract receipt-specific data', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Receipt Vendor',
            vat_number: 'B55555555',
          },
          document_number: 'REC-SPEC-001',
          date: '2025-01-23',
          total_amount: 2500,
        },
      }

      ;(mockOCRInstance.extractReceipt as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract/receipt')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'receipt-specific.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.counterparty.name).toBe('Receipt Vendor')
      expect(mockOCRInstance.extractReceipt).toHaveBeenCalled()
    })

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/ocr/extract/receipt')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('No file uploaded')
    })
  })

  describe('GET /api/ocr/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/ocr/health')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('OCR service is operational')
      expect(response.body.timestamp).toBeDefined()
    })
  })

  describe('VAT Breakdown Mapping Edge Cases', () => {
    it('should handle missing tax_breakdown array', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Simple Vendor',
          },
          document_number: 'INV-SIMPLE',
          date: '2025-01-24',
          total_amount: 10000,
          // No tax_breakdown
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'simple.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat21Base).toBeUndefined()
      expect(response.body.data.vat21Amount).toBeUndefined()
    })

    it('should handle empty tax_breakdown array', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Empty VAT Vendor',
          },
          document_number: 'INV-EMPTY',
          date: '2025-01-25',
          total_amount: 10000,
          tax_breakdown: [],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'empty.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat21Base).toBeUndefined()
    })

    it('should handle 5% VAT rate (maps to vat4)', async () => {
      const mockOCRResponse = {
        success: true,
        data: {
          counterparty: {
            name: 'Five Percent Store',
          },
          document_number: 'INV-5PCT',
          date: '2025-01-26',
          total_amount: 10500,
          subtotal: 10000,
          tax_breakdown: [
            {
              tax_rate: 5,
              tax_base: 10000,
              tax_amount: 500,
            },
          ],
        },
      }

      ;(mockOCRInstance.extractDocument as any).mockResolvedValue(mockOCRResponse)

      const response = await request(app)
        .post('/api/ocr/extract')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', Buffer.from('fake pdf content'), 'five.pdf')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.vat4Base).toBe(100.00)
      expect(response.body.data.vat4Amount).toBe(5.00)
    })
  })
})
