/**
 * OCR Orchestration Service
 * Coordinates file validation, upload, and extraction
 */

import { FileValidationService, FileValidationError } from './fileValidation.service.js';
import { GeminiService, GeminiAPIError } from './gemini.service.js';
import {
  invoiceSchema,
  receiptSchema,
  unifiedDocumentSchema,
  type InvoiceExtraction,
  type ReceiptExtraction,
  type UnifiedDocument
} from '../schemas/index.js';
import { env } from '../config/env.js';

export interface OCRResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  warnings?: string[];
  duration: number;
  metadata?: {
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    pageCount?: number;
  };
}

export class OCRService {
  private readonly fileValidator: FileValidationService;
  private readonly geminiService: GeminiService;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;

  constructor() {
    this.fileValidator = new FileValidationService();
    this.geminiService = new GeminiService();
    this.maxRetries = env.MAX_RETRIES;
    this.retryBaseDelay = env.RETRY_BASE_DELAY_MS;
  }

  /**
   * Extract invoice data
   */
  async extractInvoice(
    file: { mimetype: string; size: number; originalname?: string },
    buffer: Buffer
  ): Promise<OCRResult<InvoiceExtraction>> {
    return this.extract(file, buffer, 'invoice', invoiceSchema);
  }

  /**
   * Extract receipt data
   */
  async extractReceipt(
    file: { mimetype: string; size: number; originalname?: string },
    buffer: Buffer
  ): Promise<OCRResult<ReceiptExtraction>> {
    return this.extract(file, buffer, 'receipt', receiptSchema);
  }

  /**
   * Extract document data (unified - auto-detects type)
   */
  async extractDocument(
    file: { mimetype: string; size: number; originalname?: string },
    buffer: Buffer
  ): Promise<OCRResult<UnifiedDocument>> {
    return this.extract(file, buffer, 'document', unifiedDocumentSchema);
  }

  /**
   * Main extraction logic
   */
  private async extract<T>(
    file: { mimetype: string; size: number; originalname?: string },
    buffer: Buffer,
    documentType: 'invoice' | 'receipt' | 'document',
    schema: any
  ): Promise<OCRResult<T>> {
    const startTime = Date.now();
    let uploadedFile: any = null;

    try {
      console.log(`Processing ${documentType}:`, {
        filename: file.originalname || 'unknown',
        size: file.size,
        mimeType: file.mimetype
      });

      // 1. Validate file
      const { mimeType, metadata } = await this.fileValidator.validate(file, buffer);

      console.log('File validated:', { mimeType, metadata });

      // 2. Upload to Gemini Files API
      uploadedFile = await this.geminiService.uploadFile(
        buffer,
        mimeType,
        file.originalname || `${documentType}-${Date.now()}`
      );

      console.log('File uploaded:', uploadedFile.uri);

      // 3. Extract with retry logic
      const response = await this.withRetry(() =>
        this.geminiService.extractDocument(
          uploadedFile.uri,
          mimeType,
          documentType,
          schema
        )
      );

      // 4. Parse and validate response
      const extracted = this.geminiService.parseResponse(response);

      // 5. Validate business logic
      const validation = this.validateExtraction(extracted, documentType);

      if (validation.warnings.length > 0) {
        console.warn('Validation warnings:', validation.warnings);
      }

      const duration = Date.now() - startTime;

      console.log(`Extraction completed in ${duration}ms`);

      return {
        success: true,
        data: extracted,
        errors: validation.errors,
        warnings: validation.warnings,
        duration,
        metadata: {
          fileSize: file.size,
          mimeType: file.mimetype,
          ...metadata
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Extraction failed:', error);

      let errorMessage = 'Unknown error occurred';
      if (error instanceof FileValidationError) {
        errorMessage = error.message;
      } else if (error instanceof GeminiAPIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        duration,
        metadata: {
          fileSize: file.size,
          mimeType: file.mimetype
        }
      };
    } finally {
      // Clean up uploaded file
      if (uploadedFile) {
        await this.geminiService.deleteFile(uploadedFile.name).catch(err => {
          console.error('Failed to cleanup file:', err);
        });
      }
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if error is not retryable
        if (error instanceof GeminiAPIError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.retryBaseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd

        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError;
  }

  /**
   * Validate extracted data
   */
  private validateExtraction(
    data: any,
    documentType: 'invoice' | 'receipt' | 'document'
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (documentType === 'invoice') {
      return this.validateInvoice(data);
    } else if (documentType === 'receipt') {
      return this.validateReceipt(data);
    } else if (documentType === 'document') {
      return this.validateUnifiedDocument(data);
    }

    return { errors, warnings };
  }

  /**
   * Validate invoice data
   */
  private validateInvoice(invoice: InvoiceExtraction): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing critical fields
    if (!invoice.invoice_number) {
      warnings.push('Missing invoice number');
    }

    if (!invoice.total_inc_vat && invoice.total_inc_vat !== 0) {
      warnings.push('Missing total amount including VAT');
    }

    // Validate amounts are not negative
    if (invoice.total_inc_vat !== null && invoice.total_inc_vat < 0) {
      errors.push('Total amount cannot be negative');
    }

    // Validate VAT calculation
    if (
      invoice.total_excl_vat !== null &&
      invoice.total_vat_amount !== null &&
      invoice.total_inc_vat !== null
    ) {
      const calculated = invoice.total_excl_vat + invoice.total_vat_amount;
      const difference = Math.abs(calculated - invoice.total_inc_vat);

      if (difference > 1) {
        // Allow 1 cent rounding error
        warnings.push(
          `VAT calculation mismatch: ${invoice.total_excl_vat} + ${invoice.total_vat_amount} = ${calculated}, but total_inc_vat is ${invoice.total_inc_vat}`
        );
      }
    }

    // Validate line items sum
    if (invoice.line_items && invoice.line_items.length > 0 && invoice.total_inc_vat !== null) {
      const lineItemsTotal = invoice.line_items.reduce(
        (sum, item) => sum + (item.total_inc_vat || 0),
        0
      );

      const difference = Math.abs(lineItemsTotal - invoice.total_inc_vat);
      const tolerance = invoice.line_items.length; // 1 cent per line item

      if (difference > tolerance) {
        warnings.push(
          `Line items sum (${lineItemsTotal}) doesn't match total (${invoice.total_inc_vat})`
        );
      }
    }

    // Validate dates
    if (invoice.invoice_date && !this.isValidDate(invoice.invoice_date)) {
      errors.push(`Invalid invoice date format: ${invoice.invoice_date}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate receipt data
   */
  private validateReceipt(receipt: ReceiptExtraction): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing critical fields
    if (!receipt.amount && receipt.amount !== 0) {
      errors.push('Missing total amount');
    }

    // Validate amount is not negative
    if (receipt.amount < 0) {
      errors.push('Total amount cannot be negative');
    }

    // Validate date format
    if (receipt.date && !this.isValidDateISO8601(receipt.date)) {
      errors.push(`Invalid date format: ${receipt.date}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate date in YYYY-MM-DD format
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate ISO 8601 date format
   */
  private isValidDateISO8601(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Validate unified document data
   */
  private validateUnifiedDocument(doc: UnifiedDocument): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for critical fields
    if (!doc.total_amount && doc.total_amount !== 0) {
      warnings.push('Missing total amount');
    }

    // Validate amount is not negative
    if (doc.total_amount !== null && doc.total_amount < 0) {
      errors.push('Total amount cannot be negative');
    }

    // Validate calculations if all amounts present
    if (doc.subtotal !== null && doc.tax_amount !== null && doc.total_amount !== null) {
      const calculated = doc.subtotal + doc.tax_amount;
      const difference = Math.abs(calculated - doc.total_amount);

      if (difference > 1) {
        warnings.push(
          `Amount calculation mismatch: ${doc.subtotal} + ${doc.tax_amount} = ${calculated}, but total is ${doc.total_amount}`
        );
      }
    }

    // Validate date format
    if (doc.date && !this.isValidDateISO8601(doc.date)) {
      errors.push(`Invalid date format: ${doc.date}`);
    }

    return { errors, warnings };
  }
}
