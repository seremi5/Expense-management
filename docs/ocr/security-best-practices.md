# Security Best Practices for OCR Implementation

## Overview

Financial documents contain sensitive information. This guide outlines security best practices for handling documents, API keys, and extracted data.

## API Key Security

### Never Hardcode API Keys

❌ **WRONG**:
```javascript
const API_KEY = 'AIzaSyB87C-lCCffJAEQekMGxe3utGk55IA9qiU'; // NEVER DO THIS
```

✅ **CORRECT**:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
```

### Environment Variables

Create `.env` file (never commit to Git):

```env
GEMINI_API_KEY=your_api_key_here
```

Add to `.gitignore`:

```
.env
.env.local
.env.*.local
```

### API Key Rotation

1. **Generate new keys regularly** (monthly or quarterly)
2. **Use different keys** for development, staging, and production
3. **Revoke compromised keys immediately**
4. **Audit key usage** through Google Cloud Console

### Restrict API Key Access

In Google Cloud Console:
1. Navigate to **APIs & Services** > **Credentials**
2. Edit API key
3. Set **Application restrictions**:
   - HTTP referrers (for web apps)
   - IP addresses (for backend servers)
4. Set **API restrictions**:
   - Only enable Generative Language API

### Use Service Accounts (Production)

For production, prefer service accounts over API keys:

```javascript
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const client = await auth.getClient();
const accessToken = await client.getAccessToken();
```

Benefits:
- Fine-grained IAM permissions
- Automatic rotation
- Better audit trails
- No need to manually manage keys

## Data Privacy

### Minimize Data Exposure

1. **Upload files directly to Gemini**: Don't store unencrypted files on your servers
2. **Clean up immediately**: Delete files from Gemini Files API after processing
3. **Limit retention**: Don't keep extracted data longer than necessary
4. **Mask sensitive fields**: Redact or mask certain fields in logs

```javascript
function sanitizeForLogging(invoice) {
  return {
    ...invoice,
    supplier_iban: invoice.supplier_iban ? '***' + invoice.supplier_iban.slice(-4) : null,
    supplier_account_nr: invoice.supplier_account_nr ? '***' + invoice.supplier_account_nr.slice(-4) : null,
    recipient_email: invoice.recipient_email ? invoice.recipient_email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
  };
}

console.log('Extracted invoice:', sanitizeForLogging(invoiceData));
```

### Encryption

#### At Rest

Encrypt sensitive data in your database:

```javascript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

#### In Transit

Always use HTTPS:

```javascript
// In production, enforce HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

### Data Minimization

Only extract what you need:

```javascript
// Only extract required fields
const minimalSchema = {
  type: 'object',
  properties: {
    invoice_number: { type: 'string' },
    total_inc_vat: { type: 'integer' },
    invoice_date: { type: 'string' },
    supplier_name: { type: 'string' }
    // Don't extract sensitive fields you don't need
  }
};
```

## Access Control

### Authentication

Require authentication for all OCR endpoints:

```javascript
import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

router.post('/extract/invoice', authenticateToken, upload.single('file'), async (req, res) => {
  // Handle request
});
```

### Authorization

Check user permissions:

```javascript
function authorizeUpload(req, res, next) {
  // Check if user has permission to upload documents
  if (!req.user.permissions.includes('document:upload')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
}

router.post('/extract/invoice',
  authenticateToken,
  authorizeUpload,
  upload.single('file'),
  async (req, res) => {
    // Handle request
  }
);
```

### Rate Limiting

Prevent abuse with rate limiting:

```javascript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/extract/invoice', uploadLimiter, async (req, res) => {
  // Handle request
});
```

### Per-User Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const userLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:ocr:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour per user
  keyGenerator: (req) => req.user.id, // Use user ID as key
  message: 'Upload limit exceeded. Please try again later.'
});
```

## Input Validation

### File Validation

```javascript
import { createHash } from 'crypto';

function validateUpload(req, res, next) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Check file size
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return res.status(400).json({ error: 'File too large' });
  }

  // Verify MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  // Verify actual file type (not just extension)
  // Use a library like 'file-type' for this
  import('file-type').then(async (fileType) => {
    const type = await fileType.fileTypeFromBuffer(file.buffer);

    if (!type || !allowedTypes.includes(type.mime)) {
      return res.status(400).json({ error: 'File type mismatch' });
    }

    next();
  });
}
```

### Sanitize Filenames

```javascript
import path from 'path';

function sanitizeFilename(filename) {
  // Remove path separators
  filename = path.basename(filename);

  // Remove special characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);

  return name.substring(0, 100) + ext;
}

// Usage
const safeFilename = sanitizeFilename(req.file.originalname);
```

## Prevent Common Vulnerabilities

### SQL Injection

Use parameterized queries:

```javascript
// ❌ WRONG - Vulnerable to SQL injection
const query = `SELECT * FROM invoices WHERE invoice_number = '${invoiceNumber}'`;

// ✅ CORRECT - Use parameterized queries
const query = 'SELECT * FROM invoices WHERE invoice_number = ?';
await db.query(query, [invoiceNumber]);
```

### XSS Prevention

Sanitize extracted data before displaying:

```javascript
import xss from 'xss';

function sanitizeInvoiceData(invoice) {
  return {
    ...invoice,
    supplier_name: xss(invoice.supplier_name),
    supplier_email: xss(invoice.supplier_email),
    invoice_number: xss(invoice.invoice_number)
  };
}
```

### Path Traversal

Never use user input for file paths:

```javascript
// ❌ WRONG - Vulnerable to path traversal
const filePath = `/uploads/${req.params.filename}`;

// ✅ CORRECT - Validate and sanitize
const filename = path.basename(req.params.filename);
const filePath = path.join('/uploads', filename);

// Ensure the path is within the uploads directory
const realPath = fs.realpathSync(filePath);
if (!realPath.startsWith('/uploads')) {
  throw new Error('Invalid file path');
}
```

## Audit Logging

### Log Security Events

```javascript
function logSecurityEvent(event) {
  const log = {
    timestamp: new Date().toISOString(),
    event: event.type,
    userId: event.userId,
    ip: event.ip,
    userAgent: event.userAgent,
    success: event.success,
    details: event.details
  };

  // In production, send to a secure logging service
  console.log(JSON.stringify(log));

  // Also store in database for audit trail
  // await db.auditLogs.create(log);
}

// Usage
router.post('/extract/invoice', authenticateToken, async (req, res) => {
  try {
    const result = await ocrService.extractInvoice(req.file, req.file.buffer);

    logSecurityEvent({
      type: 'document_processed',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
      details: {
        filename: req.file.originalname,
        size: req.file.size,
        documentType: 'invoice'
      }
    });

    res.json(result);

  } catch (error) {
    logSecurityEvent({
      type: 'document_processing_failed',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: false,
      details: {
        filename: req.file.originalname,
        error: error.message
      }
    });

    res.status(500).json({ error: 'Processing failed' });
  }
});
```

### What to Log

1. **Authentication events**: Login, logout, failed attempts
2. **Upload events**: File uploads, sizes, types
3. **Processing events**: Success, failures, duration
4. **Access events**: Who accessed what data
5. **Security events**: Rate limit hits, validation failures
6. **Error events**: Unexpected errors, exceptions

### What NOT to Log

1. **API keys or passwords**
2. **Full file contents**
3. **Sensitive personal data** (full IBANs, credit cards, etc.)
4. **Session tokens**

## Data Retention

### Implement Retention Policies

```javascript
// Delete old uploaded files
async function cleanupOldFiles() {
  const RETENTION_DAYS = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  // Delete from database
  await db.documents.deleteMany({
    createdAt: { $lt: cutoffDate }
  });

  console.log('Cleanup completed');
}

// Run daily
import cron from 'node-cron';

cron.schedule('0 2 * * *', cleanupOldFiles); // Run at 2 AM daily
```

### GDPR Compliance

Implement data deletion:

```javascript
router.delete('/user/:userId/data', authenticateToken, async (req, res) => {
  const userId = req.params.userId;

  // Verify user has permission
  if (req.user.id !== userId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Delete all user documents
    await db.documents.deleteMany({ userId });

    // Delete extracted data
    await db.invoices.deleteMany({ userId });

    // Log deletion
    logSecurityEvent({
      type: 'user_data_deleted',
      userId: userId,
      ip: req.ip,
      success: true
    });

    res.json({ message: 'All user data deleted' });

  } catch (error) {
    console.error('Data deletion failed:', error);
    res.status(500).json({ error: 'Deletion failed' });
  }
});
```

## Secure Configuration

### Environment-Specific Settings

```javascript
// config/security.config.js
export const securityConfig = {
  development: {
    corsOrigin: '*',
    rateLimitEnabled: false,
    encryptionRequired: false
  },
  staging: {
    corsOrigin: ['https://staging.example.com'],
    rateLimitEnabled: true,
    encryptionRequired: true
  },
  production: {
    corsOrigin: ['https://example.com'],
    rateLimitEnabled: true,
    encryptionRequired: true,
    requireHTTPS: true
  }
};

const config = securityConfig[process.env.NODE_ENV || 'development'];
```

### CORS Configuration

```javascript
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Incident Response

### Detection

Monitor for:
- Unusual API call patterns
- High error rates
- Unexpected geographic access
- Failed authentication attempts
- Rate limit violations

### Response Plan

1. **Identify**: Detect the security incident
2. **Contain**: Disable compromised accounts/keys
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

### Emergency API Key Rotation

```bash
# 1. Generate new key in Google Cloud Console
# 2. Update production environment variable
# 3. Restart application
# 4. Verify new key works
# 5. Revoke old key
# 6. Monitor for errors
```

## Security Checklist

- [ ] API keys stored in environment variables (never in code)
- [ ] API keys restricted by IP/domain
- [ ] Service accounts used in production
- [ ] HTTPS enforced for all connections
- [ ] Authentication required for all endpoints
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] File upload validation implemented
- [ ] Input sanitization for all user data
- [ ] Sensitive data encrypted at rest
- [ ] Audit logging enabled
- [ ] Data retention policies implemented
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet)
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies regularly updated
- [ ] Security scanning in CI/CD pipeline
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GDPR Compliance](https://gdpr.eu/)
