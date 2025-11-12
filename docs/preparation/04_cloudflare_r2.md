# Cloudflare R2 Storage: File Storage and Management

## Executive Summary

This document provides comprehensive research on implementing Cloudflare R2 as the object storage solution for invoice receipts and documents in the Expense Reimbursement System. R2 offers S3-compatible API with zero egress fees, making it highly cost-effective for file storage.

**Key Advantages:**
- **Zero Egress Fees**: Unlike S3, no charges for data transfer out
- **S3-Compatible API**: Use existing AWS SDK libraries
- **Low Storage Cost**: $0.015/GB/month (€0.014/GB/month)
- **Free Tier**: 10 GB storage included
- **Presigned URLs**: Secure, time-limited file access

**For 200 invoices/month @ 500KB average**: ~€0.15/month storage cost ✅

---

## 1. Cloudflare R2 Overview

### Pricing (2025)

**Storage**:
- First 10 GB/month: **FREE**
- Above 10 GB: **$0.015/GB/month**

**Class A Operations** (write, list):
- First 1 million/month: FREE
- Above: $4.50 per million

**Class B Operations** (read):
- First 10 million/month: FREE
- Above: $0.36 per million

**Egress**:
- **$0.00** (zero egress fees!)

### Cost Calculation for Expense System

**Assumptions**:
- 200 invoices/month
- Average file size: 500 KB per invoice
- 1 year retention: 2,400 invoices

```
Storage: 2,400 × 0.5 MB = 1.2 GB
Monthly cost: 0 GB (under 10 GB free tier)

Operations per month:
- Uploads (Class A): 200
- Downloads (Class B): ~1,000 (5 views per invoice)
Total: FREE (under limits)

Total monthly cost: €0.00 ✅
```

---

## 2. Setup and Configuration

### Create R2 Bucket

1. **Log into Cloudflare Dashboard**
2. Go to **R2 Object Storage**
3. **Create Bucket**:
   - Name: `expense-receipts`
   - Location: Automatic (global distribution)

### Generate API Credentials

1. Go to **R2 → Manage R2 API Tokens**
2. Create API Token:
   - Token name: `expense-backend`
   - Permissions: `Object Read & Write`
   - TTL: No expiry (or set expiry if rotating)
3. Save:
   - Access Key ID
   - Secret Access Key
   - Account ID

### Environment Variables

```bash
# Backend .env
CLOUDFLARE_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="expense-receipts"
R2_PUBLIC_URL="https://expense-receipts.your-account.r2.cloudflarestorage.com"
```

---

## 3. Node.js Integration with AWS SDK v3

### Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### R2 Client Configuration

```typescript
// lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME!

// Create R2 client
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

// Helper to get bucket name
export const getBucketName = () => BUCKET_NAME
```

---

## 4. File Upload Operations

### Direct Upload from Backend

```typescript
// services/storage.ts
import { r2Client, getBucketName } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

interface UploadFileOptions {
  file: Buffer
  filename: string
  contentType: string
  userId: string
  expenseId?: string
}

export async function uploadReceipt(
  options: UploadFileOptions
): Promise<{ key: string; url: string }> {
  const { file, filename, contentType, userId, expenseId } = options

  // Generate unique key with folder structure
  const fileExtension = filename.split('.').pop()
  const uniqueId = randomUUID()
  const key = `receipts/${userId}/${expenseId || 'drafts'}/${uniqueId}.${fileExtension}`

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      userId,
      expenseId: expenseId || '',
      originalFilename: filename,
      uploadedAt: new Date().toISOString(),
    },
  })

  await r2Client.send(command)

  return {
    key,
    url: `https://${getBucketName()}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
  }
}
```

### File Validation

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export function validateFile(file: {
  size: number
  mimetype: string
  filename: string
}): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  // Check filename
  const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/g
  if (forbiddenChars.test(file.filename)) {
    return {
      valid: false,
      error: 'Filename contains forbidden characters',
    }
  }

  return { valid: true }
}
```

### Express Endpoint with Multer

```typescript
import express from 'express'
import multer from 'multer'
import { uploadReceipt, validateFile } from '@/services/storage'

const router = express.Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
})

router.post('/upload', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Validate file
    const validation = validateFile({
      size: req.file.size,
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
    })

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // Get user ID from auth middleware
    const userId = req.userId! // From auth middleware
    const expenseId = req.body.expenseId

    // Upload to R2
    const result = await uploadReceipt({
      file: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      userId,
      expenseId,
    })

    res.json({
      success: true,
      key: result.key,
      url: result.url,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
```

---

## 5. Presigned URLs for Secure Access

### Generate Presigned PUT URL (Client-Side Upload)

```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, getBucketName } from '@/lib/r2'

export async function generateUploadUrl(
  userId: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const fileExtension = filename.split('.').pop()
  const uniqueId = randomUUID()
  const key = `receipts/${userId}/drafts/${uniqueId}.${fileExtension}`

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  })

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 300, // 5 minutes
  })

  return { uploadUrl, key }
}
```

### Generate Presigned GET URL (Secure Downloads)

```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

// Usage in API endpoint
router.get('/expenses/:id/receipt', async (req, res) => {
  try {
    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, req.params.id),
    })

    if (!expense || !expense.receipt_url) {
      return res.status(404).json({ error: 'Receipt not found' })
    }

    // Verify user has access (via RLS or manual check)
    if (expense.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Generate presigned URL
    const downloadUrl = await generateDownloadUrl(expense.receipt_url, 900) // 15 min

    res.json({ url: downloadUrl })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate download URL' })
  }
})
```

### Client-Side Direct Upload (React)

```typescript
// Frontend: Direct upload to R2 using presigned URL
async function uploadFileDirectly(file: File) {
  // 1. Request presigned URL from backend
  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  })

  const { uploadUrl, key } = await response.json()

  // 2. Upload directly to R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  // 3. Save key to database via backend
  await fetch('/api/expenses/update-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      expenseId: '...',
      receiptKey: key,
    }),
  })

  return key
}
```

---

## 6. File Management Operations

### Delete File

```typescript
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function deleteReceipt(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  await r2Client.send(command)
}

// With cascade deletion
async function deleteExpense(expenseId: string, userId: string) {
  // Get expense
  const expense = await db.query.expenses.findFirst({
    where: eq(expenses.id, expenseId),
  })

  if (!expense) throw new Error('Expense not found')
  if (expense.user_id !== userId) throw new Error('Unauthorized')

  // Delete receipt from R2
  if (expense.receipt_url) {
    await deleteReceipt(expense.receipt_url)
  }

  // Delete expense from database
  await db.delete(expenses).where(eq(expenses.id, expenseId))
}
```

### Check if File Exists

```typescript
import { HeadObjectCommand } from '@aws-sdk/client-s3'

export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })

    await r2Client.send(command)
    return true
  } catch (error) {
    if ((error as any).name === 'NotFound') {
      return false
    }
    throw error
  }
}
```

### Get File Metadata

```typescript
export async function getFileMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  const response = await r2Client.send(command)

  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    metadata: response.Metadata,
  }
}
```

---

## 7. Public Access Configuration (Optional)

### Enable Public Access for Specific Files

**WARNING**: Only use for truly public files, not private receipts!

```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3'

// Upload with public ACL (not recommended for receipts)
const command = new PutObjectCommand({
  Bucket: getBucketName(),
  Key: key,
  Body: file,
  ContentType: contentType,
  // Note: R2 doesn't support ACLs, use presigned URLs instead
})
```

### Custom Domain for R2 Bucket

1. **In Cloudflare Dashboard**:
   - Go to R2 → your bucket → Settings
   - Add custom domain: `receipts.yourdomain.com`
   - Cloudflare automatically provisions SSL

2. **Update URLs**:
```typescript
const CUSTOM_DOMAIN = 'https://receipts.yourdomain.com'

function getPublicUrl(key: string): string {
  return `${CUSTOM_DOMAIN}/${key}`
}
```

---

## 8. File Organization Best Practices

### Folder Structure

```
receipts/
  ├── {userId}/
  │   ├── drafts/
  │   │   └── {uuid}.{ext}
  │   ├── {expenseId}/
  │   │   ├── {uuid}.{ext}
  │   │   └── {uuid}-thumb.{ext}
  │   └── archive/
  │       └── {year}/
  │           └── {uuid}.{ext}
```

### Key Naming Convention

```typescript
export function generateReceiptKey(
  userId: string,
  expenseId: string | null,
  filename: string
): string {
  const ext = filename.split('.').pop()
  const uuid = randomUUID()
  const folder = expenseId ? expenseId : 'drafts'

  return `receipts/${userId}/${folder}/${uuid}.${ext}`
}

// With date-based organization
export function generateReceiptKeyWithDate(
  userId: string,
  expenseId: string,
  filename: string
): string {
  const ext = filename.split('.').pop()
  const uuid = randomUUID()
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `receipts/${userId}/${year}/${month}/${expenseId}/${uuid}.${ext}`
}
```

---

## 9. Image Optimization and Thumbnails

### Generate Thumbnails with Sharp

```typescript
import sharp from 'sharp'

export async function uploadReceiptWithThumbnail(
  options: UploadFileOptions
): Promise<{ originalKey: string; thumbnailKey: string }> {
  const { file, filename, contentType, userId, expenseId } = options

  // Generate keys
  const ext = filename.split('.').pop()
  const uuid = randomUUID()
  const originalKey = `receipts/${userId}/${expenseId}/${uuid}.${ext}`
  const thumbnailKey = `receipts/${userId}/${expenseId}/${uuid}-thumb.jpg`

  // Upload original
  await r2Client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: originalKey,
      Body: file,
      ContentType: contentType,
    })
  )

  // Generate and upload thumbnail (only for images)
  if (contentType.startsWith('image/')) {
    const thumbnail = await sharp(file)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    await r2Client.send(
      new PutObjectCommand({
        Bucket: getBucketName(),
        Key: thumbnailKey,
        Body: thumbnail,
        ContentType: 'image/jpeg',
      })
    )
  }

  return { originalKey, thumbnailKey }
}
```

---

## 10. Error Handling and Retry Logic

### Retry with Exponential Backoff

```typescript
async function uploadWithRetry(
  command: PutObjectCommand,
  maxRetries = 3
): Promise<void> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await r2Client.send(command)
      return
    } catch (error) {
      lastError = error as Error
      const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError!.message}`)
}
```

### Common Error Handling

```typescript
export async function safeUpload(
  options: UploadFileOptions
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const result = await uploadReceipt(options)
    return { success: true, key: result.key }
  } catch (error) {
    const err = error as any

    if (err.name === 'NoSuchBucket') {
      return { success: false, error: 'Storage bucket not found' }
    }

    if (err.name === 'AccessDenied') {
      return { success: false, error: 'Storage access denied' }
    }

    if (err.name === 'EntityTooLarge') {
      return { success: false, error: 'File too large' }
    }

    return { success: false, error: 'Upload failed' }
  }
}
```

---

## 11. Monitoring and Logging

### Upload Logging

```typescript
interface UploadLog {
  userId: string
  key: string
  filename: string
  size: number
  contentType: string
  uploadedAt: Date
}

async function logUpload(log: UploadLog) {
  // Store in database for auditing
  await db.insert(uploadLogs).values(log)

  // Optional: Send to logging service
  console.log('[UPLOAD]', {
    user: log.userId,
    file: log.filename,
    size: `${(log.size / 1024).toFixed(2)} KB`,
  })
}
```

### Storage Usage Tracking

```typescript
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function getUserStorageUsage(userId: string): Promise<{
  fileCount: number
  totalSize: number
}> {
  const command = new ListObjectsV2Command({
    Bucket: getBucketName(),
    Prefix: `receipts/${userId}/`,
  })

  const response = await r2Client.send(command)

  const fileCount = response.Contents?.length || 0
  const totalSize = response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0

  return { fileCount, totalSize }
}
```

---

## 12. Security Best Practices

### 1. Never Expose R2 Credentials to Frontend

```typescript
// ❌ BAD - Never do this
const R2_ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY

// ✅ GOOD - Use presigned URLs
const { uploadUrl } = await fetch('/api/upload/presigned-url').then(r => r.json())
```

### 2. Validate File Content (Not Just Extension)

```typescript
import { fileTypeFromBuffer } from 'file-type'

export async function validateFileContent(buffer: Buffer): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType) return false

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  return allowedMimes.includes(fileType.mime)
}
```

### 3. Scan for Malware (Production)

```typescript
// Integrate with ClamAV or similar
import { scanFile } from '@/lib/malware-scanner'

export async function uploadWithScan(options: UploadFileOptions) {
  // Scan file first
  const isSafe = await scanFile(options.file)

  if (!isSafe) {
    throw new Error('File failed security scan')
  }

  return uploadReceipt(options)
}
```

---

## 13. Cost Monitoring

### Monthly Cost Calculator

```typescript
interface StorageStats {
  totalFiles: number
  totalSizeGB: number
  uploadsPerMonth: number
  downloadsPerMonth: number
}

export function calculateMonthlyCost(stats: StorageStats): number {
  // Storage cost
  const storageCost = Math.max(0, stats.totalSizeGB - 10) * 0.015

  // Class A operations (uploads)
  const classACost = Math.max(0, stats.uploadsPerMonth - 1_000_000) * (4.50 / 1_000_000)

  // Class B operations (downloads)
  const classBCost = Math.max(0, stats.downloadsPerMonth - 10_000_000) * (0.36 / 1_000_000)

  return storageCost + classACost + classBCost
}

// Example: 200 invoices/month, 1.2GB total
const cost = calculateMonthlyCost({
  totalFiles: 2400,
  totalSizeGB: 1.2,
  uploadsPerMonth: 200,
  downloadsPerMonth: 1000,
})
console.log(`Monthly cost: $${cost.toFixed(2)}`) // $0.00 (under free tier)
```

---

## 14. Official Resources

- **Cloudflare R2 Documentation**: https://developers.cloudflare.com/r2/
- **R2 API Reference**: https://developers.cloudflare.com/r2/api/s3/
- **Presigned URLs**: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- **AWS SDK for JavaScript v3**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/

---

## 15. Next Steps for Architecture

The architecture team should design:
1. File upload UI/UX with drag-drop and progress bars
2. Receipt preview modal with zoom functionality
3. Multiple file upload support
4. File deletion confirmation workflows
5. Storage quota management for users
6. Automatic cleanup of orphaned files
7. Admin dashboard for storage monitoring
8. Backup strategy for R2 files
