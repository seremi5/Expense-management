# OCR Implementation Guide with Gemini 2.5 Flash Lite

## Overview

This guide provides a complete implementation roadmap for integrating Gemini 2.5 Flash Lite API into your expense management application for OCR processing of invoices, receipts, and credit notes.

## Architecture Overview

```
┌─────────────┐
│   Frontend  │
│  (Upload)   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│            Backend API                       │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  1. File Validation                  │   │
│  │     - Format check                   │   │
│  │     - Size check                     │   │
│  │     - Resolution check               │   │
│  │     - PDF structure check            │   │
│  └────────────┬─────────────────────────┘   │
│               ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  2. File Upload to Gemini           │   │
│  │     - Use Files API for production  │   │
│  │     - Store file reference          │   │
│  └────────────┬─────────────────────────┘   │
│               ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  3. OCR Extraction                  │   │
│  │     - Send to Gemini with schema    │   │
│  │     - Structured JSON response      │   │
│  └────────────┬─────────────────────────┘   │
│               ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  4. Response Validation             │   │
│  │     - JSON structure                │   │
│  │     - Business logic                │   │
│  │     - Financial calculations        │   │
│  └────────────┬─────────────────────────┘   │
│               ↓                              │
│  ┌─────────────────────────────────────┐   │
│  │  5. Store Results                   │   │
│  │     - Save to database              │   │
│  │     - Clean up temp files           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Environment Setup

#### Install Dependencies

```bash
npm install dotenv
# For file validation
npm install pdf-lib sharp
# For HTTP requests
npm install node-fetch
```

#### Environment Variables

Create `.env` file:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash-lite

# File Upload Settings
MAX_FILE_SIZE_MB=20
MAX_PDF_PAGES=50
MIN_IMAGE_WIDTH=800
MIN_IMAGE_HEIGHT=600
MIN_PDF_WIDTH=500
MIN_PDF_HEIGHT=500

# Retry Configuration
MAX_RETRIES=3
RETRY_BASE_DELAY_MS=1000

# Rate Limiting
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_MS=60000
```

#### Load Configuration

```javascript
// config/gemini.config.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  apiKey: process.env.GEMINI_API_KEY,
  apiUrl: process.env.GEMINI_API_URL,
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',

  fileValidation: {
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 20,
    maxPdfPages: parseInt(process.env.MAX_PDF_PAGES) || 50,
    minImageWidth: parseInt(process.env.MIN_IMAGE_WIDTH) || 800,
    minImageHeight: parseInt(process.env.MIN_IMAGE_HEIGHT) || 600,
    minPdfWidth: parseInt(process.env.MIN_PDF_WIDTH) || 500,
    minPdfHeight: parseInt(process.env.MIN_PDF_HEIGHT) || 500,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
  },

  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS) || 1000
  },

  circuitBreaker: {
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
    timeoutMs: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS) || 60000
  }
};

// Validate required config
if (!config.apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
```

### Step 2: File Validation Service

```javascript
// services/fileValidation.service.js
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { config } from '../config/gemini.config.js';

export class FileValidationService {
  validateFormat(file) {
    const mimeType = file.mimetype || file.type;

    if (!config.fileValidation.allowedMimeTypes.includes(mimeType)) {
      const allowed = config.fileValidation.allowedMimeTypes.join(', ');
      throw new Error(`Only ${allowed} formats are accepted.`);
    }

    return mimeType;
  }

  validateSize(file) {
    const maxBytes = config.fileValidation.maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      throw new Error(
        `File size limit exceeded (${config.fileValidation.maxSizeMB} MB). ` +
        `File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
    }
  }

  async validatePDF(buffer) {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount > config.fileValidation.maxPdfPages) {
        throw new Error(
          `This document has ${pageCount} pages. ` +
          `The maximum allowed is ${config.fileValidation.maxPdfPages}.`
        );
      }

      if (pdfDoc.isEncrypted) {
        throw new Error(
          'The file is encrypted and cannot be processed. ' +
          'Please upload an unprotected version.'
        );
      }

      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      if (
        width < config.fileValidation.minPdfWidth ||
        height < config.fileValidation.minPdfHeight
      ) {
        throw new Error(
          `The PDF resolution is too low: ${Math.round(width)}x${Math.round(height)}. ` +
          `The minimum required is ${config.fileValidation.minPdfWidth}x${config.fileValidation.minPdfHeight}.`
        );
      }

      return { pageCount, width, height };
    } catch (error) {
      if (error.message.includes('encrypted') || error.message.includes('resolution')) {
        throw error;
      }

      throw new Error(
        'The PDF file could not be read. ' +
        'Please make sure it\'s a valid, non-corrupted document.'
      );
    }
  }

  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();

      if (
        metadata.width < config.fileValidation.minImageWidth ||
        metadata.height < config.fileValidation.minImageHeight
      ) {
        throw new Error(
          `The image resolution is too low: ${metadata.width}x${metadata.height}. ` +
          `The minimum required is ${config.fileValidation.minImageWidth}x${config.fileValidation.minImageHeight}.`
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

  async validate(file, buffer) {
    // 1. Check format
    const mimeType = this.validateFormat(file);

    // 2. Check size
    this.validateSize(file);

    // 3. Type-specific validation
    if (mimeType === 'application/pdf') {
      return { mimeType, metadata: await this.validatePDF(buffer) };
    } else {
      return { mimeType, metadata: await this.validateImage(buffer) };
    }
  }
}
```

### Step 3: Gemini API Client

```javascript
// services/gemini.service.js
import fetch from 'node-fetch';
import { config } from '../config/gemini.config.js';

export class GeminiService {
  constructor() {
    this.baseUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async uploadFile(buffer, mimeType, displayName) {
    // Step 1: Initiate resumable upload
    const initResponse = await fetch(`${this.baseUrl}/upload/v1beta/files`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'X-goog-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: { display_name: displayName }
      })
    });

    if (!initResponse.ok) {
      throw new Error(`Upload initiation failed: ${initResponse.statusText}`);
    }

    const uploadUrl = initResponse.headers.get('x-goog-upload-url');

    // Step 2: Upload file content
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize'
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      throw new Error(`File upload failed: ${uploadResponse.statusText}`);
    }

    const fileData = await uploadResponse.json();

    // Step 3: Wait for file to be active
    await this.waitForFileActive(fileData.file.name);

    return fileData.file;
  }

  async waitForFileActive(fileName, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(
        `${this.baseUrl}/v1beta/${fileName}`,
        {
          headers: { 'X-goog-api-key': this.apiKey }
        }
      );

      const file = await response.json();

      if (file.state === 'ACTIVE') {
        return file;
      }

      if (file.state === 'FAILED') {
        throw new Error('File processing failed');
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('File processing timeout');
  }

  async extractDocument(fileUri, documentType, schema) {
    const prompt = this.buildPrompt(documentType);

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            file_data: {
              mime_type: 'application/pdf', // or image mime type
              file_uri: fileUri
            }
          }
        ]
      }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: schema
      }
    };

    const response = await fetch(
      `${this.baseUrl}/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  buildPrompt(documentType) {
    const basePrompt = `Extract information from this document. All data must be extracted with maximum accuracy, as this document is financial. All extracted figures must be consistent with each other.`;

    const typeSpecificPrompts = {
      invoice: `
GERMAN INVOICE TERMINOLOGY - IMPORTANT:
For German invoices, be careful not to confuse:
- "Zwischensumme" = partial/intermediate amount (NOT the final total to extract)
- "Ihre Kosten" = total allocated costs (extract as total_excl_vat)
- "Ihre Nachzahlung" = final amount still owed (extract as total_inc_vat)
- "Summe Ihrer Zahlungen" = already paid (extract as amount_paid)

NUMBER FORMATTING:
- Extract monetary values exactly as shown
- Convert to use period (.) as decimal separator
- Provide all numbers in minor units (cents)
- For percentages, convert to integer values (20% = 20)

LINE ITEMS:
- Extract ALL line items from the document
- Some invoices span multiple pages - ensure all items are extracted
- Validate: quantity × unit_price should equal line_total

If any field can't be recognized, return null instead of an empty string.
`,
      receipt: `
Extract detailed information from this receipt.

LINE ITEMS RULES:
Only extract actual purchased items with prices. Do NOT extract:
- Loyalty card numbers
- Cashier/operator numbers
- Transaction numbers
- Marketing messages
- Coupon codes without associated products

NUMBER FORMATTING:
- All amounts in the original currency
- Convert commas to periods for decimals
- For line items, quantity defaults to 1.0 if not specified

Populate 'description' field with a short user-relevant summary (e.g., "Dinner in London", "Groceries purchase").
`,
      creditNote: `
Extract detailed information from this credit note document.

DOCUMENT REFERENCES:
- Extract credit note number exactly as shown
- Capture reference to original invoice number
- Note any customer/supplier reference numbers

NUMBER FORMATTING:
- Extract monetary values exactly as shown
- Convert to use period (.) as decimal separator
- Retain exact number of decimal places
- For percentages, convert to integer values

Use null for any fields that cannot be confidently extracted.
`
    };

    return basePrompt + (typeSpecificPrompts[documentType] || '');
  }

  async deleteFile(fileName) {
    const response = await fetch(
      `${this.baseUrl}/v1beta/${fileName}`,
      {
        method: 'DELETE',
        headers: { 'X-goog-api-key': this.apiKey }
      }
    );

    return response.ok;
  }
}
```

### Step 4: Schema Definitions

```javascript
// schemas/invoice.schema.js
export const invoiceSchema = {
  type: 'object',
  properties: {
    invoice_number: { type: ['string', 'null'] },
    invoice_date: {
      type: ['string', 'null'],
      description: 'Format: YYYY-MM-DD'
    },
    due_date: {
      type: ['string', 'null'],
      description: 'Format: YYYY-MM-DD'
    },
    currency: {
      type: ['string', 'null'],
      description: 'ISO 4217 currency code'
    },
    supplier_name: { type: ['string', 'null'] },
    supplier_vat: { type: ['string', 'null'] },
    supplier_iban: { type: ['string', 'null'] },
    supplier_email: { type: ['string', 'null'] },
    supplier_street_and_number: { type: ['string', 'null'] },
    supplier_city: { type: ['string', 'null'] },
    supplier_zipcode: { type: ['string', 'null'] },
    supplier_country: { type: ['string', 'null'] },
    recipient_name: { type: ['string', 'null'] },
    recipient_street_and_number: { type: ['string', 'null'] },
    recipient_city: { type: ['string', 'null'] },
    recipient_zipcode: { type: ['string', 'null'] },
    recipient_country: { type: ['string', 'null'] },
    total_excl_vat: {
      type: ['integer', 'null'],
      description: 'Amount in minor units (cents)'
    },
    total_inc_vat: {
      type: ['integer', 'null'],
      description: 'Amount in minor units (cents)'
    },
    total_vat_amount: {
      type: ['integer', 'null'],
      description: 'Amount in minor units (cents)'
    },
    amount_paid: {
      type: ['integer', 'null'],
      description: 'Amount already paid in minor units'
    },
    line_items: {
      type: 'array',
      description: 'Extract ALL line items',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string' },
          description: { type: ['string', 'null'] },
          quantity: { type: 'number' },
          unit_price: {
            type: 'integer',
            description: 'Price per unit in minor units'
          },
          total_excl_vat: { type: 'integer' },
          total_inc_vat: { type: 'integer' },
          vat_percent: { type: ['number', 'null'] },
          vat_amount: { type: ['integer', 'null'] }
        },
        required: ['product', 'quantity', 'unit_price']
      }
    },
    language: { type: ['string', 'null'] }
  }
};
```

### Step 5: Main OCR Service

```javascript
// services/ocr.service.js
import { FileValidationService } from './fileValidation.service.js';
import { GeminiService } from './gemini.service.js';
import { invoiceSchema } from '../schemas/invoice.schema.js';
import { receiptSchema } from '../schemas/receipt.schema.js';
import { creditNoteSchema } from '../schemas/creditNote.schema.js';

export class OCRService {
  constructor() {
    this.fileValidator = new FileValidationService();
    this.geminiService = new GeminiService();
  }

  async extractInvoice(file, buffer) {
    return this.extract(file, buffer, 'invoice', invoiceSchema);
  }

  async extractReceipt(file, buffer) {
    return this.extract(file, buffer, 'receipt', receiptSchema);
  }

  async extractCreditNote(file, buffer) {
    return this.extract(file, buffer, 'creditNote', creditNoteSchema);
  }

  async extract(file, buffer, documentType, schema) {
    const startTime = Date.now();
    let uploadedFile = null;

    try {
      // 1. Validate file
      const { mimeType, metadata } = await this.fileValidator.validate(file, buffer);

      console.log(`Processing ${documentType}:`, {
        filename: file.originalname || file.name,
        size: file.size,
        mimeType,
        metadata
      });

      // 2. Upload to Gemini Files API
      uploadedFile = await this.geminiService.uploadFile(
        buffer,
        mimeType,
        file.originalname || file.name
      );

      console.log('File uploaded:', uploadedFile.uri);

      // 3. Extract with retry logic
      const response = await this.withRetry(() =>
        this.geminiService.extractDocument(
          uploadedFile.uri,
          documentType,
          schema
        )
      );

      // 4. Parse and validate response
      const extracted = this.parseResponse(response);

      // 5. Validate business logic
      const validation = this.validateExtraction(extracted, documentType);

      if (!validation.isValid) {
        console.warn('Validation errors:', validation.errors);
      }

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
        duration
      };

    } catch (error) {
      console.error('Extraction failed:', error);

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };

    } finally {
      // Clean up uploaded file
      if (uploadedFile) {
        await this.geminiService.deleteFile(uploadedFile.name).catch(console.error);
      }
    }
  }

  parseResponse(response) {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No response from model');
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason !== 'STOP') {
      console.warn('Unexpected finish reason:', candidate.finishReason);
    }

    const content = candidate.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in response');
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse response: ${error.message}`);
    }
  }

  validateExtraction(data, documentType) {
    const errors = [];
    const warnings = [];

    // Add document-type specific validation
    if (documentType === 'invoice') {
      if (!data.total_inc_vat && data.total_inc_vat !== 0) {
        warnings.push('Missing total including VAT');
      }

      // Validate VAT calculation
      if (data.total_excl_vat && data.total_vat_amount && data.total_inc_vat) {
        const calculated = data.total_excl_vat + data.total_vat_amount;
        if (Math.abs(calculated - data.total_inc_vat) > 1) {
          warnings.push('VAT calculation mismatch');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async withRetry(fn, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

### Step 6: API Route Example (Express)

```javascript
// routes/ocr.routes.js
import express from 'express';
import multer from 'multer';
import { OCRService } from '../services/ocr.service.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ocrService = new OCRService();

router.post('/extract/invoice', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await ocrService.extractInvoice(req.file, req.file.buffer);

    if (!result.success) {
      return res.status(422).json({
        error: result.error,
        duration: result.duration
      });
    }

    res.json({
      data: result.data,
      warnings: result.warnings,
      duration: result.duration
    });

  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/extract/receipt', upload.single('file'), async (req, res) => {
  // Similar implementation
});

router.post('/extract/credit-note', upload.single('file'), async (req, res) => {
  // Similar implementation
});

export default router;
```

## Testing

### Unit Tests

```javascript
// tests/fileValidation.test.js
import { FileValidationService } from '../services/fileValidation.service.js';

describe('FileValidationService', () => {
  const validator = new FileValidationService();

  it('should accept valid JPEG files', () => {
    const file = { mimetype: 'image/jpeg', size: 1024 * 1024 };
    expect(() => validator.validateFormat(file)).not.toThrow();
  });

  it('should reject invalid formats', () => {
    const file = { mimetype: 'text/plain', size: 1024 };
    expect(() => validator.validateFormat(file)).toThrow('Only');
  });

  it('should reject oversized files', () => {
    const file = { mimetype: 'image/jpeg', size: 50 * 1024 * 1024 };
    expect(() => validator.validateSize(file)).toThrow('exceeded');
  });
});
```

### Integration Tests

```javascript
// tests/ocr.integration.test.js
import fs from 'fs';
import { OCRService } from '../services/ocr.service.js';

describe('OCR Integration', () => {
  const ocrService = new OCRService();

  it('should extract invoice data', async () => {
    const buffer = fs.readFileSync('./test-files/sample-invoice.pdf');
    const file = {
      originalname: 'sample-invoice.pdf',
      mimetype: 'application/pdf',
      size: buffer.length
    };

    const result = await ocrService.extractInvoice(file, buffer);

    expect(result.success).toBe(true);
    expect(result.data.invoice_number).toBeDefined();
    expect(result.data.total_inc_vat).toBeGreaterThan(0);
  }, 30000); // 30 second timeout
});
```

## Monitoring & Optimization

### Key Metrics

1. **Processing Time**: Track P50, P95, P99 latencies
2. **Success Rate**: % of successful extractions
3. **Error Rate**: By error type
4. **Field Extraction Rate**: % of documents with each field populated
5. **Cost**: API calls and file storage

### Cost Optimization

1. **Use appropriate model**: gemini-2.5-flash-lite for cost-effectiveness
2. **Batch processing**: Process multiple documents in parallel when possible
3. **Clean up files**: Delete from Files API after processing
4. **Cache results**: Don't reprocess the same document
5. **Optimize image size**: Compress images before upload (maintain readability)

## Next Steps

1. **Security**: Review [Security Best Practices](./security-best-practices.md)
2. **Error Handling**: Implement comprehensive [Error Handling](./error-handling.md)
3. **Deployment**: Set up monitoring and alerts
4. **Testing**: Create comprehensive test suite with real documents
5. **Documentation**: Document API endpoints for frontend integration

## Troubleshooting

### Common Issues

**Issue**: Files timing out during processing
- **Solution**: Reduce file size, split PDFs into smaller documents

**Issue**: Low extraction accuracy
- **Solution**: Improve image quality, adjust prompts, add more context

**Issue**: Rate limiting errors
- **Solution**: Implement exponential backoff, reduce concurrent requests

**Issue**: Inconsistent number formatting
- **Solution**: Be explicit in prompts about minor units and decimal formatting

## Support

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com)
- [Community Forum](https://discuss.ai.google.dev/)
