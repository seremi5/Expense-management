# Unified OCR Approach - Single Endpoint for All Documents

## ✅ Implemented!

You now have **ONE endpoint** that handles all financial documents automatically.

## The Unified Endpoint

```
POST /api/ocr/extract
```

### What It Does

1. **Auto-detects** document type (invoice, receipt, credit note)
2. **Extracts** all relevant data
3. **Returns** unified format with document_type field

### No More Choosing!

Before (old way):
```
POST /api/ocr/extract/invoice   ❌ User must know it's an invoice
POST /api/ocr/extract/receipt   ❌ User must know it's a receipt
```

Now (unified):
```
POST /api/ocr/extract   ✅ Works for everything!
```

## Response Format

```json
{
  "success": true,
  "data": {
    "document_type": "invoice",  // Auto-detected!
    "document_number": "INV-2024-001",
    "date": "2024-01-15",
    "total_amount": 125000,  // In cents
    "currency": "EUR",
    "counterparty": {
      "name": "Supplier Name",
      "vat_number": "DE123456789",
      "address": { ... }
    },
    "recipient": {  // null for receipts
      "name": "Your Company",
      ...
    },
    "line_items": [...],
    "payment_terms": "NET 30"
  },
  "warnings": [],
  "duration": 2341
}
```

## Frontend Integration (Simple!)

### TypeScript Type

```typescript
export interface UnifiedDocument {
  document_type: 'invoice' | 'receipt' | 'credit_note' | 'other' | null;
  document_number: string | null;
  date: string | null;
  total_amount: number | null;  // In minor units (cents)
  currency: string | null;
  counterparty: {
    name: string | null;
    // ... merchant/supplier info
  } | null;
  recipient: {
    name: string | null;
    // ... only for invoices
  } | null;
  line_items: Array<{
    description: string;
    quantity: number;
    total: number | null;
  }>;
  // ... other fields
}
```

### React Example

```typescript
// Single upload component for ALL documents!
import { OCRService } from './lib/api/ocr';

function DocumentUpload() {
  const handleUpload = async (file: File) => {
    const result = await OCRService.extract(file);

    // Check what type was detected
    console.log('Detected:', result.data.document_type);

    // Handle the data (same structure for all types)
    if (result.data.document_type === 'invoice') {
      console.log('Invoice from:', result.data.counterparty?.name);
      console.log('Invoice to:', result.data.recipient?.name);
    } else if (result.data.document_type === 'receipt') {
      console.log('Receipt from:', result.data.counterparty?.name);
    }

    // Common fields work for all
    console.log('Amount:', result.data.total_amount / 100, result.data.currency);
    console.log('Line items:', result.data.line_items);
  };

  return (
    <div>
      <h2>Upload Any Financial Document</h2>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
    </div>
  );
}
```

### API Service (Updated)

```typescript
// lib/api/ocr.ts
const API_BASE_URL = 'http://localhost:3000';

export class OCRService {
  /**
   * Extract data from ANY financial document
   * Auto-detects type (invoice, receipt, credit note)
   */
  static async extract(file: File): Promise<OCRResponse<UnifiedDocument>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/ocr/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract document');
    }

    return response.json();
  }
}
```

## Key Benefits

### 1. Simpler Frontend
- ✅ One upload button
- ✅ One API call
- ✅ No dropdown to select type
- ✅ Handles everything automatically

### 2. Flexible Data Structure
- ✅ All fields are optional
- ✅ Gemini fills what it finds
- ✅ Works for invoices (complex) and receipts (simple)
- ✅ `document_type` tells you what it is

### 3. Common Fields for All Types

| Field | Invoice | Receipt | Credit Note |
|-------|---------|---------|-------------|
| `document_type` | ✅ | ✅ | ✅ |
| `document_number` | ✅ | ✅ | ✅ |
| `date` | ✅ | ✅ | ✅ |
| `total_amount` | ✅ | ✅ | ✅ |
| `counterparty` | ✅ (supplier) | ✅ (merchant) | ✅ |
| `recipient` | ✅ | ❌ (null) | ✅ |
| `line_items` | ✅ | ✅ | ✅ |
| `due_date` | ✅ | ❌ (null) | ✅ |

### 4. Backward Compatible

Old endpoints still work if you want to use them:
```
POST /api/ocr/extract/invoice  ✅ Still available
POST /api/ocr/extract/receipt  ✅ Still available
POST /api/ocr/extract          ✅ NEW - Recommended!
```

## Usage Examples

### Example 1: Upload Any Document

```typescript
// User uploads anything - you don't need to know what it is
const result = await OCRService.extract(file);

// System tells you what it found
console.log(`Found a ${result.data.document_type}`);
```

### Example 2: Handle Different Types

```typescript
const result = await OCRService.extract(file);

switch (result.data.document_type) {
  case 'invoice':
    // Show invoice fields
    console.log('Invoice:', result.data.document_number);
    console.log('Due:', result.data.due_date);
    break;

  case 'receipt':
    // Show receipt fields
    console.log('Receipt from:', result.data.counterparty?.name);
    console.log('Date:', result.data.date);
    break;

  case 'credit_note':
    // Handle credit note
    break;

  default:
    console.log('Unknown document type');
}
```

### Example 3: Display Universally

```typescript
// This works for ALL document types!
function DocumentDisplay({ data }: { data: UnifiedDocument }) {
  return (
    <div>
      <div className="badge">{data.document_type}</div>
      <h2>{data.document_number || 'No Number'}</h2>
      <p>Date: {data.date}</p>
      <p>
        Total: {(data.total_amount || 0) / 100} {data.currency}
      </p>

      <h3>From: {data.counterparty?.name}</h3>

      {data.recipient && (
        <h3>To: {data.recipient.name}</h3>
      )}

      <table>
        {data.line_items.map(item => (
          <tr key={item.description}>
            <td>{item.description}</td>
            <td>{item.quantity}</td>
            <td>{item.total ? (item.total / 100) : '-'}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

## Testing

```bash
# Test with any document type
curl -X POST http://localhost:3000/api/ocr/extract \
  -F "file=@invoice.pdf"

curl -X POST http://localhost:3000/api/ocr/extract \
  -F "file=@receipt.jpg"

curl -X POST http://localhost:3000/api/ocr/extract \
  -F "file=@credit-note.pdf"
```

All work with the same endpoint!

## Summary

✅ **One endpoint** for everything
✅ **Auto-detects** document type
✅ **Unified schema** with all possible fields
✅ **Simpler frontend** - no need to choose
✅ **Flexible** - handles simple receipts and complex invoices
✅ **Backward compatible** - old endpoints still work

## Migration Guide

If you built a frontend with separate upload flows:

**Before:**
```typescript
// Two different functions
uploadInvoice(file) => POST /api/ocr/extract/invoice
uploadReceipt(file) => POST /api/ocr/extract/receipt
```

**After:**
```typescript
// One function for everything
uploadDocument(file) => POST /api/ocr/extract
```

Replace your upload logic with the new unified endpoint!

## Next Steps

1. Update frontend to use `/api/ocr/extract`
2. Remove document type selection dropdown
3. Use `document_type` field to customize display
4. Test with various document types

That's it! Much simpler now. 🎉
