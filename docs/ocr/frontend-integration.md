# Frontend Integration Guide

## API Endpoints

Base URL: `http://localhost:3000`

### Extract Invoice
```
POST /api/ocr/extract/invoice
Content-Type: multipart/form-data
```

### Extract Receipt
```
POST /api/ocr/extract/receipt
Content-Type: multipart/form-data
```

## TypeScript Types

```typescript
// Response Types
export interface OCRResponse<T = any> {
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

// Invoice Data
export interface InvoiceData {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string | null;
  supplier_name: string | null;
  supplier_vat: string | null;
  supplier_iban: string | null;
  supplier_email: string | null;
  supplier_street_and_number: string | null;
  supplier_city: string | null;
  supplier_zipcode: string | null;
  supplier_country: string | null;
  recipient_name: string | null;
  total_excl_vat: number | null;
  total_inc_vat: number | null;
  total_vat_amount: number | null;
  amount_paid: number | null;
  line_items: LineItem[];
  language: string | null;
  document_type: string | null;
}

export interface LineItem {
  product: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  units: string | null;
  total_excl_vat: number;
  total_inc_vat: number;
  vat_amount: number | null;
  vat_percent: number | null;
}

// Receipt Data
export interface ReceiptData {
  document_reference: string | null;
  currency: string | null;
  date: string | null;
  amount: number;
  subtotal: number | null;
  tax: number | null;
  tax_amount: number | null;
  tax_type: string | null;
  discount: number | null;
  description: string | null;
  sender: {
    name: string | null;
    vat_number: string | null;
    email: string | null;
    address: {
      street_and_number: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
    } | null;
  } | null;
  line_items: ReceiptLineItem[];
}

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unit_price: number | null;
  total: number;
  discount: number | null;
}
```

## React Example

### 1. API Service

```typescript
// src/lib/api/ocr.ts
import type { OCRResponse, InvoiceData, ReceiptData } from './types';

const API_BASE_URL = 'http://localhost:3000';

export class OCRService {
  /**
   * Extract invoice data from file
   */
  static async extractInvoice(file: File): Promise<OCRResponse<InvoiceData>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/ocr/extract/invoice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract invoice');
    }

    return response.json();
  }

  /**
   * Extract receipt data from file
   */
  static async extractReceipt(file: File): Promise<OCRResponse<ReceiptData>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/ocr/extract/receipt`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract receipt');
    }

    return response.json();
  }

  /**
   * Check OCR service health
   */
  static async checkHealth(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/ocr/health`);
    return response.json();
  }
}
```

### 2. React Component with File Upload

```tsx
// src/components/InvoiceUpload.tsx
import React, { useState } from 'react';
import { OCRService } from '../lib/api/ocr';
import type { InvoiceData, OCRResponse } from '../lib/api/types';

export function InvoiceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResponse<InvoiceData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await OCRService.extractInvoice(file);
      setResult(response);

      if (!response.success) {
        setError(response.error || 'Extraction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Invoice OCR</h2>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Upload Invoice (PDF, JPG, PNG)
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-6 py-2 bg-blue-600 text-white rounded
          hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Extract Data'}
      </button>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span>Extracting data from invoice...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Warnings */}
      {result?.warnings && result.warnings.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="font-semibold text-yellow-800">⚠️ Warnings:</p>
          <ul className="list-disc list-inside mt-2 text-yellow-700">
            {result.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Result */}
      {result?.success && result.data && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            ✅ Extraction Successful ({result.duration}ms)
          </h3>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-semibold">{result.data.invoice_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{result.data.invoice_date || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Supplier</p>
                <p className="font-semibold">{result.data.supplier_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total (incl. VAT)</p>
                <p className="font-semibold">
                  {result.data.total_inc_vat !== null
                    ? `${(result.data.total_inc_vat / 100).toFixed(2)} ${result.data.currency || ''}`
                    : '-'}
                </p>
              </div>
            </div>

            {/* Line Items */}
            {result.data.line_items.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Line Items ({result.data.line_items.length})
                </p>
                <div className="bg-white rounded border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Product</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.line_items.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.product}</td>
                          <td className="text-right p-2">{item.quantity}</td>
                          <td className="text-right p-2">
                            {(item.unit_price / 100).toFixed(2)}
                          </td>
                          <td className="text-right p-2">
                            {(item.total_inc_vat / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raw JSON (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                View Raw Data
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. React Hook

```typescript
// src/hooks/useOCR.ts
import { useState, useCallback } from 'react';
import { OCRService } from '../lib/api/ocr';
import type { OCRResponse, InvoiceData, ReceiptData } from '../lib/api/types';

export function useInvoiceOCR() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResponse<InvoiceData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractInvoice = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await OCRService.extractInvoice(file);
      setResult(response);

      if (!response.success) {
        setError(response.error || 'Extraction failed');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    extractInvoice,
    loading,
    result,
    error,
    reset,
  };
}

// Usage in component
function MyComponent() {
  const { extractInvoice, loading, result, error } = useInvoiceOCR();

  const handleUpload = async (file: File) => {
    try {
      await extractInvoice(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // ... rest of component
}
```

## Vue Example

```vue
<!-- InvoiceUpload.vue -->
<template>
  <div class="invoice-upload">
    <h2>Invoice OCR</h2>

    <div class="upload-area">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        @change="handleFileChange"
        :disabled="loading"
      />
      <button @click="handleUpload" :disabled="!file || loading">
        {{ loading ? 'Processing...' : 'Extract Data' }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      Extracting data...
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="result?.success && result.data" class="result">
      <h3>✅ Extraction Successful ({{ result.duration }}ms)</h3>
      <div class="data-grid">
        <div>
          <span>Invoice #:</span>
          <strong>{{ result.data.invoice_number }}</strong>
        </div>
        <div>
          <span>Date:</span>
          <strong>{{ result.data.invoice_date }}</strong>
        </div>
        <div>
          <span>Total:</span>
          <strong>{{ formatAmount(result.data.total_inc_vat, result.data.currency) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { OCRService } from '@/lib/api/ocr';
import type { InvoiceData, OCRResponse } from '@/lib/api/types';

const file = ref<File | null>(null);
const loading = ref(false);
const result = ref<OCRResponse<InvoiceData> | null>(null);
const error = ref<string | null>(null);

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
  error.value = null;
  result.value = null;
};

const handleUpload = async () => {
  if (!file.value) return;

  loading.value = true;
  error.value = null;

  try {
    result.value = await OCRService.extractInvoice(file.value);

    if (!result.value.success) {
      error.value = result.value.error || 'Extraction failed';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
};

const formatAmount = (amount: number | null, currency: string | null) => {
  if (amount === null) return '-';
  return `${(amount / 100).toFixed(2)} ${currency || ''}`;
};
</script>
```

## Error Handling

```typescript
// Handle different error scenarios
try {
  const result = await OCRService.extractInvoice(file);

  if (!result.success) {
    // Extraction failed
    if (result.error?.includes('File too large')) {
      alert('File is too large. Maximum size is 20MB');
    } else if (result.error?.includes('Invalid file type')) {
      alert('Please upload a PDF, JPG, or PNG file');
    } else if (result.error?.includes('resolution too low')) {
      alert('Image quality is too low. Please use a higher resolution image');
    } else {
      alert(result.error || 'Failed to extract data');
    }
  } else {
    // Success - check for warnings
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Extraction warnings:', result.warnings);
      // Optionally show warnings to user
    }

    // Use the extracted data
    console.log('Invoice data:', result.data);
  }

} catch (err) {
  // Network or other errors
  console.error('Upload failed:', err);
  alert('Failed to connect to server');
}
```

## Testing Tips

1. **Test with different file types**: PDF, JPG, PNG
2. **Test file size limits**: Try uploading files >20MB
3. **Test invalid formats**: Try uploading .txt or .docx files
4. **Check network errors**: Test with server stopped
5. **Verify data accuracy**: Compare extracted data with actual invoice
6. **Test loading states**: Ensure UI shows loading indicators
7. **Test error messages**: Verify user-friendly error messages display

## Environment Variables

For production, use environment variables:

```typescript
// .env
VITE_API_BASE_URL=https://your-api-domain.com

// In code
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

## Next Steps

1. Add the OCR service to your frontend
2. Create a file upload component
3. Test with sample invoices/receipts
4. Handle extracted data (save to database, display to user)
5. Add progress indicators
6. Implement error handling
7. Add validation for extracted data

## Resources

- [Backend API Documentation](../../backend/README.md)
- [Testing Guide](../../backend/TEST.md)
- [OCR Implementation Details](./ocr-implementation-guide.md)
