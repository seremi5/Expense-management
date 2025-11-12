# Quick Reference Guide

Quick code snippets and patterns for common OCR tasks with Gemini 2.0 Flash.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Request Examples](#request-examples)
- [Schema Examples](#schema-examples)
- [Error Codes](#error-codes)
- [Common Patterns](#common-patterns)
- [Testing Commands](#testing-commands)

## API Endpoints

```
# Main API
https://generativelanguage.googleapis.com/v1beta

# Models
/models/gemini-2.5-flash-lite:generateContent
/models/gemini-2.5-flash:generateContent
/models/gemini-2.0-flash:generateContent

# Files API
/upload/v1beta/files          # Upload
/v1beta/files/{name}           # Get file status
/v1beta/files/{name}           # Delete file
```

## Request Examples

### Basic Extraction with Base64

```javascript
const request = {
  contents: [{
    parts: [
      { text: "Extract invoice information" },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Image
        }
      }
    ]
  }],
  generationConfig: {
    response_mime_type: "application/json",
    response_schema: invoiceSchema
  }
};

const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify(request)
  }
);
```

### Using Files API

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('file', fileBuffer);

const uploadInit = await fetch(
  'https://generativelanguage.googleapis.com/upload/v1beta/files',
  {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': fileBuffer.length,
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'X-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({ file: { display_name: 'invoice.pdf' } })
  }
);

const uploadUrl = uploadInit.headers.get('x-goog-upload-url');

const uploadComplete = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Content-Length': fileBuffer.length,
    'X-Goog-Upload-Offset': '0',
    'X-Goog-Upload-Command': 'upload, finalize'
  },
  body: fileBuffer
});

const { file } = await uploadComplete.json();

// 2. Use file in extraction
const request = {
  contents: [{
    parts: [
      { text: "Extract invoice information" },
      {
        file_data: {
          mime_type: file.mimeType,
          file_uri: file.uri
        }
      }
    ]
  }],
  generationConfig: {
    response_mime_type: "application/json",
    response_schema: invoiceSchema
  }
};
```

## Schema Examples

### Invoice Schema

```json
{
  "type": "object",
  "properties": {
    "invoice_number": { "type": ["string", "null"] },
    "invoice_date": { "type": ["string", "null"], "description": "YYYY-MM-DD" },
    "total_inc_vat": { "type": ["integer", "null"], "description": "In cents" },
    "currency": { "type": ["string", "null"], "description": "ISO 4217" },
    "supplier_name": { "type": ["string", "null"] },
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "product": { "type": "string" },
          "quantity": { "type": "number" },
          "unit_price": { "type": "integer" },
          "total_inc_vat": { "type": "integer" }
        },
        "required": ["product", "quantity", "unit_price"]
      }
    }
  }
}
```

### Receipt Schema

```json
{
  "type": "object",
  "properties": {
    "date": { "type": ["string", "null"], "description": "ISO 8601" },
    "amount": { "type": "number" },
    "currency": { "type": ["string", "null"] },
    "merchant_name": { "type": ["string", "null"] },
    "description": { "type": ["string", "null"] },
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "quantity": { "type": "number" },
          "total": { "type": "number" }
        },
        "required": ["name", "total"]
      }
    }
  }
}
```

## Error Codes

| Code | Meaning | Retryable | Action |
|------|---------|-----------|--------|
| 400 | Invalid request | No | Check request format |
| 401 | Invalid API key | No | Check API key |
| 403 | Permission denied | No | Check API key permissions |
| 404 | File not found | Yes | Re-upload file |
| 429 | Rate limit | Yes | Wait and retry |
| 500 | Server error | Yes | Retry with backoff |
| 503 | Service unavailable | Yes | Retry with backoff |
| 504 | Timeout | Yes | Retry or reduce file size |

## Common Patterns

### Retry with Exponential Backoff

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) throw error;

      const delay = 1000 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage
const result = await withRetry(() => extractInvoice(file));
```

### File Validation

```javascript
function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }

  if (file.size > maxSize) {
    throw new Error('File too large');
  }
}
```

### Parse Response

```javascript
function parseGeminiResponse(response) {
  if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format');
  }

  const content = response.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Failed to parse JSON response');
  }
}
```

### Convert to Minor Units

```javascript
// Convert dollars to cents
function toMinorUnits(amount, currency = 'USD') {
  const decimals = currency === 'JPY' ? 0 : 2;
  return Math.round(amount * Math.pow(10, decimals));
}

// Convert cents to dollars
function fromMinorUnits(amount, currency = 'USD') {
  const decimals = currency === 'JPY' ? 0 : 2;
  return amount / Math.pow(10, decimals);
}

// Examples
toMinorUnits(12.50, 'USD')   // 1250
toMinorUnits(100, 'JPY')     // 100
fromMinorUnits(1250, 'USD')  // 12.50
```

### Validate Date Format

```javascript
function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Usage
isValidDate('2024-01-15')  // true
isValidDate('2024-1-15')   // false
isValidDate('invalid')     // false
```

### Sanitize Filename

```javascript
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
}
```

## Testing Commands

### Test with cURL

```bash
# Test extraction with base64 image
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent" \
  -H "Content-Type: application/json" \
  -H "X-goog-api-key: YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Extract invoice data"},
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "'"$(base64 -i invoice.jpg)"'"
          }
        }
      ]
    }],
    "generationConfig": {
      "response_mime_type": "application/json"
    }
  }'
```

### Test File Upload

```bash
# 1. Start upload
UPLOAD_URL=$(curl -X POST \
  "https://generativelanguage.googleapis.com/upload/v1beta/files" \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: $(wc -c < invoice.pdf)" \
  -H "X-Goog-Upload-Header-Content-Type: application/pdf" \
  -H "X-goog-api-key: YOUR_API_KEY" \
  -d '{"file":{"display_name":"invoice.pdf"}}' \
  -D - | grep -i x-goog-upload-url | cut -d' ' -f2)

# 2. Upload file
curl -X POST "$UPLOAD_URL" \
  -H "Content-Length: $(wc -c < invoice.pdf)" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary @invoice.pdf
```

### Test with Node.js

```javascript
// test.js
import fs from 'fs';
import fetch from 'node-fetch';

const apiKey = process.env.GEMINI_API_KEY;
const imageBuffer = fs.readFileSync('./invoice.jpg');
const base64Image = imageBuffer.toString('base64');

const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Extract invoice number and total' },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    })
  }
);

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
```

Run: `node test.js`

## Environment Variables

```bash
# .env
GEMINI_API_KEY=your_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
MAX_FILE_SIZE_MB=10
MAX_RETRIES=3
```

## Common Prompts

### Invoice Extraction

```
Extract information from this invoice. All data must be extracted with maximum accuracy, as this document is financial. All extracted figures must be consistent with each other.

NUMBER FORMATTING:
- Provide all numbers in minor units (cents)
- Convert commas to periods for decimals

LINE ITEMS:
- Extract ALL line items from all pages
- Validate: quantity × unit_price = line_total

If any field can't be recognized, return null.
```

### Receipt Extraction

```
Extract detailed information from this receipt.

Only extract actual purchased items with prices. Do NOT extract:
- Loyalty card numbers
- Cashier numbers
- Transaction IDs
- Marketing messages

Populate 'description' with a short summary (e.g., "Dinner in London").
```

### Document Type Detection

```
Classify which type this document most closely belongs to:
- Invoice
- Receipt
- CreditNote
- Other

Provide the classification, confidence level (0-1), and reason.
```

## Validation Patterns

### Validate VAT Calculation

```javascript
function validateVAT(invoice) {
  if (!invoice.total_excl_vat || !invoice.total_vat_amount || !invoice.total_inc_vat) {
    return { valid: true, message: 'Incomplete VAT data' };
  }

  const calculated = invoice.total_excl_vat + invoice.total_vat_amount;
  const difference = Math.abs(calculated - invoice.total_inc_vat);

  if (difference > 1) { // Allow 1 cent rounding
    return {
      valid: false,
      message: `VAT mismatch: ${invoice.total_excl_vat} + ${invoice.total_vat_amount} = ${calculated}, but total is ${invoice.total_inc_vat}`
    };
  }

  return { valid: true };
}
```

### Validate Line Items Sum

```javascript
function validateLineItems(invoice) {
  if (!invoice.line_items || invoice.line_items.length === 0) {
    return { valid: true, message: 'No line items' };
  }

  const sum = invoice.line_items.reduce(
    (total, item) => total + (item.total_inc_vat || 0),
    0
  );

  const tolerance = invoice.line_items.length; // 1 cent per item
  const difference = Math.abs(sum - invoice.total_inc_vat);

  if (difference > tolerance) {
    return {
      valid: false,
      message: `Line items sum ${sum} doesn't match total ${invoice.total_inc_vat}`
    };
  }

  return { valid: true };
}
```

## Performance Tips

### Optimize Image Size

```javascript
import sharp from 'sharp';

async function optimizeImage(buffer) {
  return sharp(buffer)
    .resize(2000, 2000, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

### Parallel Processing

```javascript
// Process multiple files in parallel
const results = await Promise.allSettled(
  files.map(file => extractInvoice(file))
);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failed = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);
```

### Rate Limiting

```javascript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

const results = await Promise.all(
  files.map(file => limit(() => extractInvoice(file)))
);
```

## Monitoring Snippets

### Log Extraction

```javascript
console.log(JSON.stringify({
  event: 'ocr_extraction',
  timestamp: new Date().toISOString(),
  filename: file.name,
  size: file.size,
  duration_ms: endTime - startTime,
  success: true,
  fields_extracted: Object.keys(result.data).length
}));
```

### Track Metrics

```javascript
const metrics = {
  total_requests: 0,
  successful: 0,
  failed: 0,
  total_duration_ms: 0,

  record(success, duration) {
    this.total_requests++;
    if (success) this.successful++;
    else this.failed++;
    this.total_duration_ms += duration;
  },

  getStats() {
    return {
      total: this.total_requests,
      success_rate: this.successful / this.total_requests,
      avg_duration: this.total_duration_ms / this.total_requests
    };
  }
};
```

## Quick Debugging

### Enable Debug Logging

```javascript
// Set environment variable
DEBUG=gemini:* node app.js

// Or in code
if (process.env.DEBUG) {
  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Response:', JSON.stringify(response, null, 2));
}
```

### Test in AI Studio

1. Go to https://aistudio.google.com
2. Select Gemini 2.0 Flash
3. Upload your image
4. Paste your prompt
5. Enable JSON mode
6. Add your schema
7. Test and iterate

## Resources

- [Full Implementation Guide](./ocr-implementation-guide.md)
- [Error Handling](./error-handling.md)
- [Security Best Practices](./security-best-practices.md)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
