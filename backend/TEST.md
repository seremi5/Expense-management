# OCR API Testing Guide

## Quick Test

### 1. Start the Server

```bash
cd /Users/sergireina/Documents/GitHub/Expense-management/backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║   Expense Management API                  ║
║   Server running at http://localhost:3000  ║
╚═══════════════════════════════════════════╝
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-12T...",
  "environment": "development"
}
```

### 3. Test OCR Health

```bash
curl http://localhost:3000/api/ocr/health
```

Expected response:
```json
{
  "success": true,
  "message": "OCR service is operational",
  "timestamp": "2025-01-12T..."
}
```

### 4. Test Invoice Extraction

Create a test invoice or use a sample:

```bash
curl -X POST http://localhost:3000/api/ocr/extract/invoice \
  -F "file=@/path/to/your/invoice.pdf" \
  | json_pp
```

Expected response:
```json
{
  "success": true,
  "data": {
    "invoice_number": "...",
    "total_inc_vat": 12500,
    "currency": "EUR",
    "supplier_name": "...",
    "line_items": [...]
  },
  "warnings": [],
  "duration": 2341
}
```

### 5. Test Receipt Extraction

```bash
curl -X POST http://localhost:3000/api/ocr/extract/receipt \
  -F "file=@/path/to/your/receipt.jpg" \
  | json_pp
```

## Test with Postman/Insomnia

### Invoice Extraction

- **Method**: POST
- **URL**: `http://localhost:3000/api/ocr/extract/invoice`
- **Body**: form-data
  - Key: `file`
  - Type: File
  - Value: Select your invoice PDF/image

### Receipt Extraction

- **Method**: POST
- **URL**: `http://localhost:3000/api/ocr/extract/receipt`
- **Body**: form-data
  - Key: `file`
  - Type: File
  - Value: Select your receipt image

## Expected Processing Times

- **Simple receipt**: 1-3 seconds
- **Single-page invoice**: 2-5 seconds
- **Multi-page invoice**: 3-10 seconds

## Troubleshooting

### "GEMINI_API_KEY is required"

Make sure `.env` file has valid API key:
```env
GEMINI_API_KEY=AIzaSy...
```

### "File too large"

Max file size is 20MB. Compress your file or split multi-page PDFs.

### "Invalid file type"

Only these formats are supported:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- PDF (.pdf)

### "Resolution too low"

Minimum requirements:
- Images: 800x600
- PDFs: 500x500

### Connection refused

Make sure server is running on port 3000:
```bash
lsof -i :3000
```

## Sample Test Files

You can test with these types of documents:

✅ **Invoice examples**:
- Standard commercial invoice
- Multi-page invoice
- Invoice with line items
- Invoice in German/English

✅ **Receipt examples**:
- Restaurant receipt
- Retail receipt
- Gas station receipt
- Online purchase receipt

## Success Indicators

✅ Server starts without errors
✅ Health endpoints respond
✅ File uploads accepted
✅ OCR extraction returns structured data
✅ Validation warnings are informational
✅ Processing completes within reasonable time

## Common Test Scenarios

### Test 1: Valid Invoice
Upload a clear, single-page invoice PDF
→ Should extract all fields successfully

### Test 2: Low Quality Image
Upload a blurry or low-res image
→ Should reject with "resolution too low" error

### Test 3: Encrypted PDF
Upload a password-protected PDF
→ Should reject with "file is encrypted" error

### Test 4: Large File
Upload a file over 20MB
→ Should reject with "file size limit exceeded" error

### Test 5: Invalid Format
Upload a .txt or .docx file
→ Should reject with "invalid file type" error

## Next Steps

Once basic testing works:

1. Test with your actual invoices/receipts
2. Verify extracted data accuracy
3. Check validation warnings
4. Test error scenarios
5. Monitor processing times
6. Integrate with frontend

## Support

If you encounter issues:
1. Check server logs
2. Verify .env configuration
3. Test API key with curl
4. Review documentation in `/docs/ocr/`
