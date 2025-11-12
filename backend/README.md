# Expense Management Backend

Backend API for the Expense Management system with OCR capabilities powered by Google Gemini 2.5 Flash Lite.

## Features

- **OCR Extraction**: Extract structured data from invoices and receipts
- **Gemini 2.5 Flash Lite**: Fast, cost-effective OCR processing
- **File Validation**: Comprehensive validation (format, size, resolution, encryption)
- **Retry Logic**: Automatic retries with exponential backoff
- **Error Handling**: Detailed error messages and validation warnings

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Gemini API key from [Google AI Studio](https://aistudio.google.com)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env` and set your values:

```env
# Required - Get from https://aistudio.google.com
GEMINI_API_KEY=your_api_key_here

# Required - Your database
DATABASE_URL=postgresql://user:password@localhost:5432/expense_management

# Optional - Already configured
GEMINI_MODEL=gemini-2.5-flash-lite
MAX_FILE_SIZE_MB=20
PORT=3000
```

**Note**: Other environment variables (R2, Resend, JWT) are placeholders for future features.

### 3. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## API Endpoints

### OCR Endpoints

#### Extract Invoice

```bash
POST /api/ocr/extract/invoice
Content-Type: multipart/form-data

file: <invoice.pdf|invoice.jpg>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "total_inc_vat": 125000,
    "currency": "EUR",
    "supplier_name": "Acme Corp",
    "line_items": [...]
  },
  "warnings": [],
  "errors": [],
  "duration": 2341,
  "metadata": {
    "fileSize": 245678,
    "mimeType": "application/pdf"
  }
}
```

#### Extract Receipt

```bash
POST /api/ocr/extract/receipt
Content-Type: multipart/form-data

file: <receipt.jpg|receipt.pdf>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 45.50,
    "currency": "EUR",
    "date": "2024-01-15T14:30:00Z",
    "sender": {
      "name": "Coffee Shop"
    },
    "line_items": [...]
  },
  "duration": 1823
}
```

#### Health Check

```bash
GET /api/ocr/health
```

### Testing with cURL

```bash
# Test invoice extraction
curl -X POST http://localhost:3000/api/ocr/extract/invoice \
  -F "file=@/path/to/invoice.pdf"

# Test receipt extraction
curl -X POST http://localhost:3000/api/ocr/extract/receipt \
  -F "file=@/path/to/receipt.jpg"

# Health check
curl http://localhost:3000/api/ocr/health
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment configuration
│   │   └── constants.ts        # Application constants
│   ├── schemas/
│   │   ├── invoice.schema.ts   # Invoice JSON schema
│   │   ├── receipt.schema.ts   # Receipt JSON schema
│   │   └── index.ts
│   ├── services/
│   │   ├── fileValidation.service.ts  # File validation
│   │   ├── gemini.service.ts          # Gemini API client
│   │   └── ocr.service.ts             # OCR orchestration
│   ├── routes/
│   │   └── ocr.routes.ts       # OCR API routes
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   └── index.ts                # Main application
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

## File Support

### Supported Formats

- **Images**: JPEG, PNG, WebP
- **Documents**: PDF

### File Limits

- **Max file size**: 20MB
- **Max PDF pages**: 50 pages
- **Min image resolution**: 800x600
- **Min PDF resolution**: 500x500

### Requirements

- ✅ Valid format (JPEG, PNG, PDF)
- ✅ Under 20MB
- ✅ Not encrypted
- ✅ Sufficient resolution
- ✅ Valid structure (for PDFs)

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| `No file uploaded` | 400 | Missing file in request |
| `Invalid file type` | 400 | Unsupported format |
| `File too large` | 400 | Exceeds 20MB limit |
| `PDF is encrypted` | 400 | Password-protected PDF |
| `Resolution too low` | 400 | Image/PDF quality insufficient |
| `OCR extraction failed` | 422 | Gemini API error |
| `Internal server error` | 500 | Unexpected error |

### Validation Warnings

The API may return warnings for:
- Missing invoice number
- VAT calculation mismatches
- Line items not summing to total
- Invalid date formats

These are informational and don't prevent extraction success.

## Development

### Run Development Server

```bash
npm run dev
```

Uses `tsx watch` for hot reload during development.

### Build for Production

```bash
npm run build
npm start
```

### Run Database Migrations

```bash
npm run db:migrate
```

### Open Database Studio

```bash
npm run db:studio
```

## Environment Variables Reference

### Required

- `GEMINI_API_KEY`: Google Gemini API key
- `DATABASE_URL`: PostgreSQL connection string

### OCR Configuration

- `GEMINI_MODEL`: Model to use (default: gemini-2.5-flash-lite)
- `GEMINI_API_URL`: API endpoint (default: Google's URL)
- `MAX_FILE_SIZE_MB`: Max file size in MB (default: 20)
- `MAX_PDF_PAGES`: Max pages in PDF (default: 50)
- `MIN_IMAGE_WIDTH`: Min image width (default: 800)
- `MIN_IMAGE_HEIGHT`: Min image height (default: 600)

### Server Configuration

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development|production)
- `FRONTEND_URL`: CORS origin (default: http://localhost:5173)

### Retry Configuration

- `MAX_RETRIES`: Max retry attempts (default: 3)
- `RETRY_BASE_DELAY_MS`: Base retry delay (default: 1000)
- `CIRCUIT_BREAKER_THRESHOLD`: Failed requests before breaking (default: 5)
- `CIRCUIT_BREAKER_TIMEOUT_MS`: Circuit breaker timeout (default: 60000)

## Troubleshooting

### Server won't start

Check that all required environment variables are set:
```bash
# Verify .env file
cat .env | grep GEMINI_API_KEY
cat .env | grep DATABASE_URL
```

### OCR extraction fails

1. Check API key is valid
2. Verify file meets requirements (format, size, quality)
3. Check server logs for detailed error messages

### File upload issues

- Ensure file is under 20MB
- Check file format is supported
- Verify file is not corrupted or encrypted

## Documentation

- [OCR Implementation Guide](../docs/ocr/ocr-implementation-guide.md)
- [Gemini API Overview](../docs/ocr/gemini-api-overview.md)
- [Security Best Practices](../docs/ocr/security-best-practices.md)
- [Quick Reference](../docs/ocr/quick-reference.md)

## License

MIT
