# Error Handling Best Practices for Gemini OCR

## Overview

Robust error handling is critical for production OCR systems. This guide covers common errors, validation strategies, and recovery mechanisms for Gemini API integration.

## Pre-Upload File Validation

### File Format Validation

```javascript
const ALLOWED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'application/pdf': ['.pdf']
};

function validateFileFormat(file) {
  const mimeType = file.type || file.mimetype;

  if (!Object.keys(ALLOWED_FORMATS).includes(mimeType)) {
    const allowed = Object.values(ALLOWED_FORMATS).flat().join(', ');
    throw new Error(
      `Only ${allowed} formats are accepted. Got: ${mimeType}`
    );
  }

  return mimeType;
}
```

### File Size Validation

```javascript
const MAX_FILE_SIZE_MB = 10; // Adjust based on your needs
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size limit exceeded (${MAX_FILE_SIZE_MB} MB). ` +
      `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
    );
  }
}
```

### PDF-Specific Validation

```javascript
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

async function validatePDF(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();

    // Check page count
    const MAX_PAGES = 50;
    if (pageCount > MAX_PAGES) {
      throw new Error(
        `This document has ${pageCount} pages. ` +
        `The maximum allowed is ${MAX_PAGES}.`
      );
    }

    // Check if encrypted
    if (pdfDoc.isEncrypted) {
      throw new Error(
        'The file is encrypted and cannot be processed. ' +
        'Please upload an unprotected version.'
      );
    }

    // Check resolution of first page
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    const MIN_WIDTH = 500;
    const MIN_HEIGHT = 500;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      throw new Error(
        `The PDF resolution is too low: ${Math.round(width)}x${Math.round(height)}. ` +
        `The minimum required is ${MIN_WIDTH}x${MIN_HEIGHT}.`
      );
    }

    return { pageCount, width, height };

  } catch (error) {
    if (error.message.includes('encrypted')) {
      throw error;
    }

    // Check for specific PDF corruption patterns
    if (error.message.includes('trailer')) {
      throw new Error(
        'The PDF file is missing required structural data and cannot be processed.'
      );
    }

    throw new Error(
      'The PDF file could not be read. ' +
      'Please make sure it\'s a valid, non-corrupted document.'
    );
  }
}
```

### Image Validation

```javascript
import sharp from 'sharp';

async function validateImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    const MIN_WIDTH = 800;
    const MIN_HEIGHT = 600;

    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      throw new Error(
        `The image resolution is too low: ${metadata.width}x${metadata.height}. ` +
        `The minimum required is ${MIN_WIDTH}x${MIN_HEIGHT}.`
      );
    }

    return metadata;

  } catch (error) {
    if (error.message.includes('resolution')) {
      throw error;
    }

    throw new Error(
      'The image file couldn\'t be opened. Please check the format and try again.'
    );
  }
}
```

## Gemini API Errors

### Common Error Codes

```javascript
const GEMINI_ERROR_CODES = {
  // Authentication
  UNAUTHENTICATED: {
    code: 401,
    message: 'Invalid or missing API key',
    retryable: false
  },

  // Authorization
  PERMISSION_DENIED: {
    code: 403,
    message: 'API key doesn\'t have permission',
    retryable: false
  },

  // Rate limiting
  RESOURCE_EXHAUSTED: {
    code: 429,
    message: 'Rate limit exceeded',
    retryable: true,
    backoff: 'exponential'
  },

  // Invalid request
  INVALID_ARGUMENT: {
    code: 400,
    message: 'Invalid request parameters',
    retryable: false
  },

  // File not found
  NOT_FOUND: {
    code: 404,
    message: 'File URI not found or expired',
    retryable: false
  },

  // Server errors
  INTERNAL: {
    code: 500,
    message: 'Internal server error',
    retryable: true,
    backoff: 'exponential'
  },

  UNAVAILABLE: {
    code: 503,
    message: 'Service temporarily unavailable',
    retryable: true,
    backoff: 'exponential'
  },

  // Timeout
  DEADLINE_EXCEEDED: {
    code: 504,
    message: 'Request timeout',
    retryable: true,
    backoff: 'linear'
  }
};
```

### Error Response Handler

```javascript
class GeminiAPIError extends Error {
  constructor(code, message, retryable = false, originalError = null) {
    super(message);
    this.name = 'GeminiAPIError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

async function handleGeminiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const status = response.status;
    const errorMessage = errorData.error?.message || response.statusText;
    const errorCode = errorData.error?.code || status;

    // Map to known error types
    let retryable = false;
    let userMessage = errorMessage;

    switch (status) {
      case 400:
        userMessage = 'Invalid request. Please check your file format and try again.';
        break;
      case 401:
        userMessage = 'Authentication failed. Please contact support.';
        break;
      case 403:
        userMessage = 'Access denied. Please contact support.';
        break;
      case 404:
        userMessage = 'File not found. The upload may have expired. Please try uploading again.';
        retryable = true;
        break;
      case 429:
        userMessage = 'Too many requests. Please try again in a few moments.';
        retryable = true;
        break;
      case 500:
      case 503:
        userMessage = 'Service temporarily unavailable. Please try again.';
        retryable = true;
        break;
      case 504:
        userMessage = 'Request timed out. Please try with a smaller file or try again later.';
        retryable = true;
        break;
    }

    throw new GeminiAPIError(errorCode, userMessage, retryable, errorData);
  }

  return response.json();
}
```

## Retry Logic

### Exponential Backoff

```javascript
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (error instanceof GeminiAPIError && !error.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}

// Usage
const result = await withRetry(async () => {
  return await callGeminiAPI(image);
}, 3, 1000);
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.error(`Circuit breaker opened. Will retry after ${this.timeout}ms`);
    }
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60000);

async function callGeminiWithBreaker(image) {
  return breaker.execute(() => callGeminiAPI(image));
}
```

## Response Validation

### Validate JSON Structure

```javascript
function validateExtractionResponse(data) {
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response candidates from model');
  }

  const candidate = data.candidates[0];

  // Check for finish reason
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Content filtered for safety reasons');
  }

  if (candidate.finishReason === 'RECITATION') {
    throw new Error('Content filtered due to recitation');
  }

  if (candidate.finishReason !== 'STOP') {
    console.warn(`Unexpected finish reason: ${candidate.finishReason}`);
  }

  // Extract content
  const content = candidate.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in response');
  }

  // Parse JSON
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse response as JSON: ${error.message}`);
  }
}
```

### Validate Financial Data

```javascript
function validateInvoiceData(invoice) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!invoice.invoice_number) {
    warnings.push('Missing invoice number');
  }

  if (!invoice.total_inc_vat && invoice.total_inc_vat !== 0) {
    errors.push('Missing total amount including VAT');
  }

  // Validate amounts are positive
  if (invoice.total_inc_vat < 0) {
    errors.push('Total amount cannot be negative');
  }

  // Validate VAT calculation
  if (invoice.total_excl_vat && invoice.total_vat_amount && invoice.total_inc_vat) {
    const calculated = invoice.total_excl_vat + invoice.total_vat_amount;
    const difference = Math.abs(calculated - invoice.total_inc_vat);

    if (difference > 1) { // Allow 1 cent rounding error
      warnings.push(
        `VAT calculation mismatch: ${invoice.total_excl_vat} + ${invoice.total_vat_amount} ` +
        `= ${calculated}, but total_inc_vat is ${invoice.total_inc_vat}`
      );
    }
  }

  // Validate line items sum
  if (invoice.line_items && invoice.line_items.length > 0) {
    const lineItemsTotal = invoice.line_items.reduce(
      (sum, item) => sum + (item.total_inc_vat || 0),
      0
    );

    const difference = Math.abs(lineItemsTotal - invoice.total_inc_vat);

    if (difference > invoice.line_items.length) { // Allow 1 cent per line item
      warnings.push(
        `Line items sum (${lineItemsTotal}) doesn't match total (${invoice.total_inc_vat})`
      );
    }
  }

  // Validate dates
  if (invoice.invoice_date && !isValidDate(invoice.invoice_date)) {
    errors.push(`Invalid invoice date format: ${invoice.invoice_date}`);
  }

  if (invoice.due_date && !isValidDate(invoice.due_date)) {
    errors.push(`Invalid due date format: ${invoice.due_date}`);
  }

  // Validate currency
  if (invoice.currency && !isValidCurrencyCode(invoice.currency)) {
    warnings.push(`Invalid or unusual currency code: ${invoice.currency}`);
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function isValidCurrencyCode(code) {
  const commonCurrencies = [
    'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'NZD', 'SEK',
    'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY',
    'BRL', 'MXN', 'ZAR', 'INR', 'KRW', 'SGD', 'HKD', 'THB', 'MYR', 'IDR'
  ];

  return commonCurrencies.includes(code);
}
```

## Logging and Monitoring

### Structured Logging

```javascript
function logOCRAttempt(data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'ocr_attempt',
    file_size: data.fileSize,
    mime_type: data.mimeType,
    page_count: data.pageCount,
    method: data.method // 'base64' or 'files_api'
  }));
}

function logOCRSuccess(data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'ocr_success',
    duration_ms: data.duration,
    invoice_number: data.result.invoice_number,
    line_items_count: data.result.line_items?.length || 0,
    has_warnings: data.warnings.length > 0
  }));
}

function logOCRError(error, context) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'ocr_error',
    error_code: error.code,
    error_message: error.message,
    retryable: error.retryable,
    context: context
  }));
}
```

### Metrics to Track

1. **Success Rate**: % of successful extractions
2. **Error Rate by Type**: Group by error code
3. **Average Processing Time**: Monitor performance degradation
4. **Retry Rate**: How often retries are needed
5. **Validation Failure Rate**: % of responses failing validation
6. **Field Extraction Rate**: % of documents with each field extracted

## User-Facing Error Messages

### Error Message Mapping

Based on the error messages from your system:

```javascript
const USER_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Only {allowed_formats} formats are accepted.',

  FILE_SIZE_EXCEEDED: 'File size limit exceeded ({size} MB). Please upload a smaller file.',

  TOO_MANY_PAGES: 'This document has {pages_count} pages. The maximum allowed is {max_pages}.',

  LOW_RESOLUTION_PDF: 'The PDF resolution is too low: {width}x{height}. The minimum required is {min_width}x{min_height}.',

  LOW_RESOLUTION_IMAGE: 'The image resolution is too low: {width}x{height}. The minimum required is {min_width}x{min_height}.',

  FILE_ENCRYPTED: 'The file is encrypted and cannot be processed. Please upload an unprotected version.',

  MALFORMED_PDF: 'The PDF file could not be read. Please make sure it\'s a valid, non-corrupted document.',

  CANNOT_OPEN_IMAGE: 'The image file couldn\'t be opened. Please check the format and try again.',

  SAVE_FAILED: 'We couldn\'t save your file. Please try uploading a different document, or only the first page of the same document.',

  API_ERROR: 'We encountered an error processing your document. Please try again.',

  TIMEOUT: 'The request took too long to process. Please try with a smaller file.',

  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.'
};
```

## Complete Error Handling Example

```javascript
async function extractInvoiceWithErrorHandling(file) {
  const startTime = Date.now();

  try {
    // 1. Validate file format
    const mimeType = validateFileFormat(file);

    // 2. Validate file size
    validateFileSize(file);

    // 3. Read file buffer
    const buffer = await file.arrayBuffer();

    // 4. Format-specific validation
    if (mimeType === 'application/pdf') {
      await validatePDF(buffer);
    } else {
      await validateImage(buffer);
    }

    // 5. Call Gemini API with retry logic
    const response = await withRetry(async () => {
      return await callGeminiAPI(buffer, mimeType);
    }, 3, 1000);

    // 6. Validate response
    const extracted = validateExtractionResponse(response);

    // 7. Validate business logic
    const validation = validateInvoiceData(extracted);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 8. Log warnings
    if (validation.warnings.length > 0) {
      console.warn('Extraction warnings:', validation.warnings);
    }

    // 9. Log success
    logOCRSuccess({
      duration: Date.now() - startTime,
      result: extracted,
      warnings: validation.warnings
    });

    return {
      success: true,
      data: extracted,
      warnings: validation.warnings
    };

  } catch (error) {
    // Log error
    logOCRError(error, {
      file_name: file.name,
      file_size: file.size,
      duration: Date.now() - startTime
    });

    // Return user-friendly error
    return {
      success: false,
      error: error.message,
      retryable: error.retryable || false
    };
  }
}
```

## Summary Checklist

- [ ] Validate file format before upload
- [ ] Check file size limits
- [ ] Validate PDF structure and encryption
- [ ] Check image resolution
- [ ] Implement retry logic with exponential backoff
- [ ] Handle all Gemini API error codes
- [ ] Validate JSON response structure
- [ ] Validate financial data consistency
- [ ] Log all attempts, successes, and errors
- [ ] Provide user-friendly error messages
- [ ] Monitor key metrics
- [ ] Implement circuit breaker for service protection
