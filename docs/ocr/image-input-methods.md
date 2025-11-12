# Image Input Methods for Gemini API

## Overview

Gemini API supports two primary methods for sending images: inline base64 encoding and the Files API. Choose the appropriate method based on your file size and use case.

## Method 1: Inline Base64 Encoding

### When to Use

- Files **< 20 MB** total request size
- Single-use images
- Quick prototyping
- Images fetched from URLs

### Limitations

- **Maximum request size**: 20 MB (including all files, text prompt, system instructions)
- Base64 encoding increases file size by ~33%
- Not efficient for reusing images across multiple requests

### Implementation

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Extract information from this invoice..."
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "BASE64_ENCODED_IMAGE_DATA"
          }
        }
      ]
    }
  ]
}
```

### Important Notes

**DO NOT** include the data URI prefix:
- ❌ WRONG: `"data:image/png;base64,iVBORw0KGgo..."`
- ✅ CORRECT: `"iVBORw0KGgo..."`

Including the prefix will cause an API error.

### Supported Formats

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/heic`
- `image/heif`

### Example (JavaScript)

```javascript
import fs from 'fs';

// Read and encode image
const imageBuffer = fs.readFileSync('invoice.jpg');
const base64Image = imageBuffer.toString('base64');

const request = {
  contents: [{
    parts: [
      { text: "Extract invoice details" },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Image
        }
      }
    ]
  }]
};
```

## Method 2: Files API (Recommended for Production)

### When to Use

- Files **> 20 MB**
- Reusing images across multiple requests
- Production environments
- PDF documents
- Multi-page documents

### Advantages

- **Storage**: Up to 20 GB per project
- **Max file size**: 2 GB per file
- **Efficiency**: Upload once, reference multiple times
- **Auto-cleanup**: Files automatically deleted after 48 hours

### Two-Step Process

#### Step 1: Upload File

```bash
curl -X POST "https://generativelanguage.googleapis.com/upload/v1beta/files" \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: FILE_SIZE" \
  -H "X-Goog-Upload-Header-Content-Type: image/jpeg" \
  -H "X-goog-api-key: YOUR_API_KEY" \
  -d '{"file": {"display_name": "invoice-001.jpg"}}'
```

Response includes an upload URL. Then upload the file:

```bash
curl -X POST "UPLOAD_URL" \
  -H "Content-Length: FILE_SIZE" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary "@invoice.jpg"
```

Response:
```json
{
  "file": {
    "name": "files/abc123",
    "displayName": "invoice-001.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": "123456",
    "createTime": "2025-01-15T10:00:00Z",
    "state": "ACTIVE",
    "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123"
  }
}
```

#### Step 2: Reference File in Request

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Extract information from this invoice..."
        },
        {
          "file_data": {
            "mime_type": "image/jpeg",
            "file_uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123"
          }
        }
      ]
    }
  ]
}
```

### File State Management

Files have three states:
- **PROCESSING**: Upload complete, processing in progress
- **ACTIVE**: Ready to use (check before sending to model)
- **FAILED**: Upload failed

Always verify `state === "ACTIVE"` before using in requests.

### Cleanup

Files are automatically deleted after 48 hours. You can also manually delete:

```bash
curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/files/abc123" \
  -H "X-goog-api-key: YOUR_API_KEY"
```

## PDF Support

Both methods support PDFs, but Files API is recommended for:
- Multi-page PDFs
- Large PDFs (> 20 MB)
- Production use

```json
{
  "file_data": {
    "mime_type": "application/pdf",
    "file_uri": "https://generativelanguage.googleapis.com/v1beta/files/pdf123"
  }
}
```

## Best Practices

### Image Quality

1. **Verify rotation**: Ensure images are correctly oriented
2. **Use clear images**: Avoid blurry or low-resolution files
3. **Minimum resolution**:
   - Check your specific requirements (from error messages)
   - Typical minimum: 300 DPI for OCR

### Prompt Placement

- **Single image + text**: Place text prompt **after** the image part
- **Multiple images**: Interleave text and images as needed

```json
{
  "parts": [
    { "inline_data": {...} },  // Image first
    { "text": "Extract data..." }  // Then prompt
  ]
}
```

### Multi-page Documents

For invoices spanning multiple pages:

```json
{
  "parts": [
    { "text": "Extract ALL line items from this multi-page invoice:" },
    { "file_data": { "file_uri": "files/page1" } },
    { "file_data": { "file_uri": "files/page2" } },
    { "file_data": { "file_uri": "files/page3" } }
  ]
}
```

Or upload as a single PDF using Files API.

## Size Limits Summary

| Method | Max Request Size | Max File Size | Storage |
|--------|-----------------|---------------|---------|
| Base64 | 20 MB total | N/A | None |
| Files API | N/A | 2 GB per file | 20 GB per project |

## Recommendations for Expense Management

1. **Use Files API** for production
2. **Upload PDFs** rather than converting to images when possible
3. **Implement retry logic** for file uploads
4. **Monitor file state** before processing
5. **Clean up files** after processing to manage quota
6. **Store file URIs** if you need to reprocess documents

## Error Handling

Common errors:
- `INVALID_ARGUMENT`: Invalid base64 or mime type
- `FILE_TOO_LARGE`: Exceeds size limits
- `FILE_NOT_FOUND`: Invalid file URI or expired file
- `QUOTA_EXCEEDED`: Storage limit reached

See [Error Handling Guide](./error-handling.md) for details.
