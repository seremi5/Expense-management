# OCR Implementation with Gemini 2.5 Flash Lite

Comprehensive documentation for implementing OCR (Optical Character Recognition) in the Expense Management application using Google's Gemini 2.5 Flash Lite API.

## Overview

This documentation covers the complete implementation of OCR functionality for extracting structured data from financial documents (invoices, receipts, and credit notes) using Gemini 2.5 Flash Lite's fast, cost-effective multimodal capabilities.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Gemini API key from [Google AI Studio](https://aistudio.google.com)
- Basic understanding of REST APIs and JSON

### 2. Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new key or use an existing one
4. **Important**: Keep this key secure and never commit it to version control

### 3. Environment Setup

```bash
# Install dependencies
npm install dotenv pdf-lib sharp node-fetch

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Add to .gitignore
echo ".env" >> .gitignore
```

### 4. Basic Usage

```javascript
import { OCRService } from './services/ocr.service.js';

const ocrService = new OCRService();

// Extract invoice data
const result = await ocrService.extractInvoice(file, buffer);

if (result.success) {
  console.log('Invoice data:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Documentation Structure

### Core Concepts

1. **[Gemini API Overview](./gemini-api-overview.md)**
   - Model capabilities and features
   - API endpoints and authentication
   - Pricing and rate limits
   - Use cases for financial documents

2. **[Image Input Methods](./image-input-methods.md)**
   - Base64 encoding (for small files < 20 MB)
   - Files API (recommended for production)
   - PDF support and multi-page documents
   - Best practices for image quality

3. **[Structured Output with JSON Schema](./structured-output.md)**
   - How to define schemas
   - Recent JSON Schema support updates
   - Integration with BAML
   - Examples for invoices, receipts, and credit notes

### Implementation Guides

4. **[OCR Implementation Guide](./ocr-implementation-guide.md)** ⭐ **START HERE**
   - Complete step-by-step implementation
   - Code examples and architecture
   - Service layer design
   - API routes and testing
   - Full working example

5. **[Error Handling Best Practices](./error-handling.md)**
   - Pre-upload file validation
   - API error handling
   - Retry logic with exponential backoff
   - Circuit breaker pattern
   - Response validation
   - Logging and monitoring

6. **[Security Best Practices](./security-best-practices.md)**
   - API key management
   - Data privacy and encryption
   - Access control and authentication
   - Input validation
   - GDPR compliance
   - Incident response

## Key Features

### Gemini 2.5 Flash Lite Advantages

- **1M Token Context**: Process ~1,500 pages in one request
- **Multimodal**: Understands both text and visual elements
- **Fastest Model**: Optimized for low latency and high throughput
- **Most Cost-Effective**: Budget-friendly pricing for high-volume processing
- **Edge Cases**: Handles handwriting, watermarks, unusual fonts
- **Multi-language**: German, English, and other languages
- **Structured Output**: Native JSON Schema support

### Supported Document Types

1. **Invoices**
   - Supplier and recipient details
   - Line items with quantities and prices
   - Tax calculations (VAT, GST, etc.)
   - Payment terms and due dates
   - Multi-page support

2. **Receipts**
   - Merchant information
   - Purchased items
   - Tax amounts
   - Transaction timestamps
   - Auto-generated descriptions

3. **Credit Notes**
   - Reference to original invoice
   - Adjusted amounts
   - Reason for credit
   - Counterparty details

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│            (File Upload UI)                      │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│              Backend API                         │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  FileValidationService                   │  │
│  │  - Format check                          │  │
│  │  - Size validation                       │  │
│  │  - PDF structure check                   │  │
│  │  - Image resolution check                │  │
│  └────────────────┬─────────────────────────┘  │
│                   ↓                              │
│  ┌──────────────────────────────────────────┐  │
│  │  GeminiService                           │  │
│  │  - File upload to Gemini Files API       │  │
│  │  - OCR extraction with schema            │  │
│  │  - Response parsing                      │  │
│  └────────────────┬─────────────────────────┘  │
│                   ↓                              │
│  ┌──────────────────────────────────────────┐  │
│  │  OCRService                              │  │
│  │  - Orchestrates validation + extraction  │  │
│  │  - Error handling & retry logic          │  │
│  │  - Business logic validation             │  │
│  │  - Cleanup                               │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│          Gemini 2.0 Flash API                    │
│  - Multimodal understanding                      │
│  - Structured JSON output                        │
│  - 1M token context window                       │
└─────────────────────────────────────────────────┘
```

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Get Gemini API key
- [ ] Set up environment variables
- [ ] Install dependencies
- [ ] Review documentation

### Phase 2: Core Implementation (Days 2-3)
- [ ] Implement FileValidationService
- [ ] Implement GeminiService (Files API integration)
- [ ] Create JSON schemas for document types
- [ ] Implement OCRService
- [ ] Create API routes

### Phase 3: Error Handling (Day 4)
- [ ] Add file validation
- [ ] Implement retry logic
- [ ] Add response validation
- [ ] Set up logging
- [ ] Implement circuit breaker

### Phase 4: Security (Day 5)
- [ ] Secure API key management
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up audit logging

### Phase 5: Testing & Deployment (Days 6-7)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test with real documents
- [ ] Set up monitoring
- [ ] Deploy to production
- [ ] Monitor and optimize

## Common Use Cases

### Extract Invoice Data

```javascript
const result = await ocrService.extractInvoice(file, buffer);

// Result structure:
{
  success: true,
  data: {
    invoice_number: "INV-2024-001",
    invoice_date: "2024-01-15",
    total_inc_vat: 125000, // in cents
    currency: "EUR",
    supplier_name: "Acme Corp",
    line_items: [
      {
        product: "Service A",
        quantity: 10,
        unit_price: 10000,
        total_inc_vat: 100000
      }
    ]
  },
  warnings: [],
  duration: 2341
}
```

### Handle Errors

```javascript
try {
  const result = await ocrService.extractInvoice(file, buffer);

  if (!result.success) {
    // Handle extraction failure
    console.error('Extraction failed:', result.error);

    // Show user-friendly error
    return res.status(422).json({
      error: result.error,
      retryable: result.retryable
    });
  }

  // Validate warnings
  if (result.warnings.length > 0) {
    console.warn('Validation warnings:', result.warnings);
  }

  // Store in database
  await saveInvoiceToDatabase(result.data);

} catch (error) {
  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Process Multiple Documents

```javascript
async function processDocumentBatch(files) {
  const results = await Promise.allSettled(
    files.map(file => ocrService.extractInvoice(file, file.buffer))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value.data);

  const failed = results
    .filter(r => r.status === 'rejected' || !r.value.success);

  return { successful, failed };
}
```

## Performance Optimization

### Cost Optimization

1. **Use Files API**: Upload once, reuse for multiple extraction attempts
2. **Compress Images**: Reduce file size while maintaining quality
3. **Batch Processing**: Process multiple documents in parallel
4. **Cache Results**: Don't reprocess the same document
5. **Clean Up**: Delete files from Gemini after processing

### Processing Speed

- **Typical latency**: 2-5 seconds per document
- **Multi-page PDFs**: Add ~1 second per additional page
- **Large images**: Consider resizing (maintain min resolution)
- **Parallel processing**: Use Promise.all for batches

### Monitoring Metrics

Track these key metrics:
- Success rate (target: >95%)
- Average processing time (target: <5s)
- Error rate by type
- Field extraction rate (% of documents with each field)
- API cost per document

## Troubleshooting

### Common Issues

**Problem**: "File too large" error
- **Solution**: Compress images, split PDFs, or use Files API

**Problem**: Low extraction accuracy
- **Solution**: Improve image quality, adjust prompts, validate document format

**Problem**: "Rate limit exceeded"
- **Solution**: Implement exponential backoff, reduce concurrent requests

**Problem**: Numbers extracted incorrectly
- **Solution**: Be explicit about minor units in schema descriptions

**Problem**: Missing line items
- **Solution**: Add explicit instruction "Extract ALL line items" in prompt

### Getting Help

- Review the [Error Handling Guide](./error-handling.md)
- Check [Gemini API Status](https://status.cloud.google.com/)
- Visit [Google AI Developer Forum](https://discuss.ai.google.dev/)
- Test in [Google AI Studio](https://aistudio.google.com)

## API Reference Quick Links

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Structured Output Reference](https://ai.google.dev/gemini-api/docs/structured-output)
- [Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Files API](https://ai.google.dev/gemini-api/docs/file-prompting-strategies)
- [JSON Schema Spec](https://json-schema.org/)

## Examples

### Complete Working Example

See [OCR Implementation Guide](./ocr-implementation-guide.md) for a complete, production-ready implementation with:
- Full service layer
- Error handling
- Retry logic
- Validation
- API routes
- Tests

### BAML Integration

Your existing BAML prompts can be converted to Gemini's JSON Schema format:

```
// BAML format
class Invoice {
  invoice_number string?
  total_inc_vat int?
}

// Gemini JSON Schema
{
  "type": "object",
  "properties": {
    "invoice_number": {"type": ["string", "null"]},
    "total_inc_vat": {"type": ["integer", "null"]}
  }
}
```

## Migration Path

### From Other OCR Services

If migrating from another OCR service:

1. **Keep existing schemas**: Convert to JSON Schema format
2. **Test in parallel**: Run both services initially
3. **Compare results**: Validate accuracy and performance
4. **Gradual rollout**: Start with non-critical documents
5. **Monitor closely**: Track metrics during transition

### BAML to Gemini

Your existing BAML prompts are already well-structured. Main changes:
1. Convert BAML schemas to JSON Schema
2. Update API client to use Gemini endpoint
3. Adjust error handling for Gemini responses
4. Test thoroughly with sample documents

## Next Steps

1. **Read** [OCR Implementation Guide](./ocr-implementation-guide.md) (start here!)
2. **Review** [Security Best Practices](./security-best-practices.md)
3. **Implement** following the step-by-step guide
4. **Test** with your actual documents
5. **Monitor** and optimize based on metrics
6. **Iterate** on prompts and validation logic

## Security Notice

**CRITICAL**: The API key shared in your original message has been exposed and should be revoked immediately:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find the compromised key
3. Click "Delete" or "Disable"
4. Create a new key
5. Update your environment variables
6. Never share API keys in public channels

## Support & Contribution

This documentation is part of the Expense Management project. For questions or improvements:
- Review the documentation first
- Check the troubleshooting section
- Consult official Gemini API docs
- Open an issue in your project repository

## License

This documentation is proprietary and part of the Expense Management application.

---

**Last Updated**: January 2025
**Gemini API Version**: v1beta
**Model**: gemini-2.5-flash-lite
**Max File Size**: 20MB
