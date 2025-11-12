# Security and Compliance: GDPR, LOPD, and Best Practices

## Executive Summary

This document covers security requirements and GDPR/LOPD compliance for the Expense Reimbursement System handling personal and financial data in Spain. The system must implement robust security measures including HTTPS, JWT authentication, bcrypt password hashing, rate limiting, input validation, and GDPR-compliant data handling.

**Key Requirements:**
- **HTTPS/SSL**: Mandatory for all communications
- **JWT Security**: Secure token generation and validation
- **Password Hashing**: bcrypt with salt rounds ≥ 12
- **Rate Limiting**: Protect against brute force and DDoS
- **Data Encryption**: At rest and in transit
- **GDPR/LOPD Compliance**: Right to access, deletion, portability

---

## 1. Authentication and Authorization Security

### JWT Token Security Best Practices

```typescript
// lib/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET! // Min 256 bits (32 characters)
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

interface TokenPayload {
  userId: string
  email: string
  role: 'user' | 'admin'
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // Short-lived access tokens
    issuer: 'expense-system',
    audience: 'expense-api',
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // Longer-lived refresh tokens
      issuer: 'expense-system',
      audience: 'expense-api',
    }
  )
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'expense-system',
      audience: 'expense-api',
    }) as TokenPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

// Store refresh tokens in database for revocation capability
export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await db.insert(refreshTokens).values({
    userId,
    token: await hashToken(token),
    expiresAt,
  })
}

async function hashToken(token: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  return hash.update(token).digest('hex')
}
```

### Password Security with bcrypt

```typescript
// lib/auth.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12 // OWASP recommendation: 12+

export async function hashPassword(password: string): Promise<string> {
  // Validate password strength first
  validatePasswordStrength(password)
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function validatePasswordStrength(password: string): void {
  const minLength = 12
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters`)
  }

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new Error(
      'Password must contain uppercase, lowercase, numbers, and special characters'
    )
  }

  // Check against common passwords list
  if (isCommonPassword(password)) {
    throw new Error('Password is too common')
  }
}

// Import from common passwords database
const commonPasswords = new Set([
  'password123',
  '123456789',
  'qwerty123',
  // ... more common passwords
])

function isCommonPassword(password: string): boolean {
  return commonPasswords.has(password.toLowerCase())
}
```

---

## 2. API Security Measures

### Rate Limiting with express-rate-limit

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { createClient } from 'redis'

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
})

// Expense submission limit
export const expenseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 expense submissions per hour
  message: 'Expense submission limit reached',
})

// File upload limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50, // 50 file uploads per hour
  message: 'File upload limit reached',
})

// Apply to routes
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/expenses', expenseLimiter)
app.use('/api/upload', uploadLimiter)
```

### CORS Configuration

```typescript
// middleware/cors.ts
import cors from 'cors'

const allowedOrigins = [
  process.env.FRONTEND_URL!, // Production frontend
  'http://localhost:3000', // Dev frontend
]

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}

app.use(cors(corsOptions))
```

### Helmet Security Headers

```typescript
// middleware/security.ts
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.API_URL!],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
)
```

---

## 3. Input Validation and Sanitization

### Zod Validation for All Inputs

```typescript
// validation/expense.ts
import { z } from 'zod'
import validator from 'validator'

export const createExpenseSchema = z.object({
  invoiceNumber: z.string()
    .min(1, 'Invoice number required')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Invalid invoice number format'),

  invoiceDate: z.coerce.date()
    .max(new Date(), 'Invoice date cannot be in the future'),

  vendorName: z.string()
    .min(2, 'Vendor name required')
    .max(200)
    .transform(str => validator.escape(str)), // Sanitize HTML

  vendorTaxId: z.string()
    .regex(/^[A-Z]\d{8}$/, 'Invalid NIF/CIF format')
    .optional(),

  amount: z.number()
    .positive('Amount must be positive')
    .max(10000, 'Amount exceeds maximum')
    .refine(val => Number.isFinite(val), 'Invalid amount'),

  receiptFile: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File too large (max 10MB)')
    .refine(
      file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      'Invalid file type'
    ),
})

// Apply validation middleware
router.post('/expenses', validate(createExpenseSchema), async (req, res) => {
  // req.body is now validated and sanitized
})
```

### SQL Injection Prevention

```typescript
// Using Drizzle ORM (parameterized queries)
// ✅ SAFE - Parameterized
await db
  .select()
  .from(expenses)
  .where(eq(expenses.userId, userId))

// ❌ DANGEROUS - String concatenation (never do this)
// await db.execute(`SELECT * FROM expenses WHERE user_id = '${userId}'`)
```

### XSS Prevention

```typescript
import sanitizeHtml from 'sanitize-html'

export function sanitizeUserInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {},
  })
}

// For rich text fields (if needed)
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: {},
  })
}
```

---

## 4. File Upload Security

### File Type Validation

```typescript
import { fileTypeFromBuffer } from 'file-type'

export async function validateUploadedFile(
  buffer: Buffer,
  declaredMimeType: string
): Promise<{ valid: boolean; error?: string }> {
  // Verify actual file type matches declared
  const actualType = await fileTypeFromBuffer(buffer)

  if (!actualType) {
    return { valid: false, error: 'Unknown file type' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  if (!allowedTypes.includes(actualType.mime)) {
    return { valid: false, error: 'File type not allowed' }
  }

  if (actualType.mime !== declaredMimeType) {
    return { valid: false, error: 'File type mismatch' }
  }

  return { valid: true }
}
```

### Filename Sanitization

```typescript
import sanitize from 'sanitize-filename'

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const basename = filename.split('/').pop() || ''

  // Sanitize
  const sanitized = sanitize(basename)

  // Generate safe filename
  const ext = sanitized.split('.').pop()
  const name = sanitized.substring(0, sanitized.lastIndexOf('.'))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)

  return `${name}-${timestamp}-${random}.${ext}`
}
```

### Malware Scanning (Production)

```typescript
// Integration with ClamAV or similar
import { NodeClam } from 'clamscan'

const clam = new NodeClam().init({
  clamdscan: {
    host: process.env.CLAMAV_HOST,
    port: 3310,
  },
})

export async function scanFileForMalware(
  filePath: string
): Promise<{ isSafe: boolean; threat?: string }> {
  try {
    const { isInfected, viruses } = await clam.isInfected(filePath)

    return {
      isSafe: !isInfected,
      threat: viruses?.[0],
    }
  } catch (error) {
    console.error('Malware scan error:', error)
    // Fail closed: reject file if scan fails
    return { isSafe: false, threat: 'Scan failed' }
  }
}
```

---

## 5. GDPR and LOPD Compliance

### Data Subject Rights Implementation

**Right to Access (Article 15)**:
```typescript
router.get('/gdpr/data-export', authenticate, async (req, res) => {
  const userId = req.userId!

  // Collect all user data
  const userData = {
    profile: await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    }),
    expenses: await db.query.expenses.findMany({
      where: eq(expenses.userId, userId),
    }),
    auditLogs: await db.query.auditLog.findMany({
      where: eq(auditLog.userId, userId),
    }),
  }

  res.json(userData)
})
```

**Right to Erasure (Article 17)**:
```typescript
router.delete('/gdpr/delete-account', authenticate, async (req, res) => {
  const userId = req.userId!

  await db.transaction(async (tx) => {
    // Delete receipts from R2
    const userExpenses = await tx.query.expenses.findMany({
      where: eq(expenses.userId, userId),
    })

    for (const expense of userExpenses) {
      if (expense.receiptUrl) {
        await deleteReceipt(expense.receiptUrl)
      }
    }

    // Delete user data (cascade will handle related records)
    await tx.delete(profiles).where(eq(profiles.id, userId))
    await tx.delete(users).where(eq(users.id, userId))
  })

  res.json({ message: 'Account deleted successfully' })
})
```

**Right to Data Portability (Article 20)**:
```typescript
router.get('/gdpr/export-json', authenticate, async (req, res) => {
  const userId = req.userId!
  const userData = await collectUserData(userId)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="user-data-${userId}.json"`
  )
  res.send(JSON.stringify(userData, null, 2))
})
```

### Data Retention Policies

```sql
-- Auto-delete old audit logs after 2 years
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron or external cron
SELECT cron.schedule('delete-old-logs', '0 0 1 * *', 'SELECT delete_old_audit_logs()');
```

### Privacy Policy and Consent

```typescript
// Consent tracking
CREATE TABLE consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  consent_type TEXT NOT NULL, -- 'terms', 'privacy', 'marketing'
  version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Record consent
async function recordConsent(
  userId: string,
  consentType: string,
  granted: boolean,
  ipAddress: string,
  userAgent: string
) {
  await db.insert(consentLog).values({
    userId,
    consentType,
    version: '1.0',
    granted,
    ipAddress,
    userAgent,
  })
}
```

---

## 6. Data Encryption

### Encryption at Rest

**Database**: Supabase provides encryption at rest by default

**File Storage**: Cloudflare R2 encrypts all data at rest

**Sensitive Fields** (additional encryption):
```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Usage for sensitive data
const encryptedNIF = encrypt(user.nif)
await db.update(profiles).set({ nif: encryptedNIF })
```

### Encryption in Transit

**HTTPS Everywhere**:
```typescript
// Force HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
})

// HSTS header (via Helmet)
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
}))
```

---

## 7. Audit Logging

### Comprehensive Audit Trail

```typescript
interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, any>
  ipAddress: string
  userAgent: string
  success: boolean
  errorMessage?: string
}

export async function logAudit(entry: AuditLogEntry) {
  await db.insert(auditLog).values({
    ...entry,
    timestamp: new Date(),
  })
}

// Middleware to log all API actions
app.use((req, res, next) => {
  const originalSend = res.send

  res.send = function (data) {
    logAudit({
      userId: req.userId,
      action: req.method,
      resource: req.path,
      resourceId: req.params.id || '',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      success: res.statusCode < 400,
      errorMessage: res.statusCode >= 400 ? data : undefined,
    })

    return originalSend.call(this, data)
  }

  next()
})
```

---

## 8. Security Checklist

### Pre-Launch Security Audit

- ✅ All API endpoints require authentication
- ✅ RLS policies tested and verified
- ✅ HTTPS enforced in production
- ✅ Rate limiting configured
- ✅ CORS properly restricted
- ✅ Input validation on all endpoints
- ✅ File uploads validated and scanned
- ✅ Passwords hashed with bcrypt (12+ rounds)
- ✅ JWT tokens have short expiration
- ✅ Sensitive data encrypted
- ✅ Audit logging enabled
- ✅ GDPR compliance features implemented
- ✅ Security headers configured (Helmet)
- ✅ Dependencies vulnerability scan (npm audit)
- ✅ Environment variables secured (never in git)
- ✅ Database backups configured
- ✅ Error messages don't leak sensitive info

---

## 9. Incident Response Plan

### Security Breach Protocol

1. **Detect**: Monitor logs for suspicious activity
2. **Contain**: Disable affected accounts/endpoints
3. **Investigate**: Review audit logs, identify scope
4. **Notify**: Inform affected users within 72 hours (GDPR)
5. **Remediate**: Fix vulnerability, reset credentials
6. **Review**: Post-mortem, update security measures

### Contact Information

```typescript
const SECURITY_CONTACTS = {
  dpo: 'dpo@yourdomain.com', // Data Protection Officer
  admin: 'admin@yourdomain.com',
  emergency: '+34 XXX XXX XXX',
}
```

---

## 10. Official Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **GDPR Official**: https://gdpr.eu/
- **AEPD (Spain)**: https://www.aepd.es/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **Node.js Security Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html

---

## 11. Next Steps for Architecture

The architecture team should design:
1. Complete authentication flow with MFA option
2. Admin dashboard for security monitoring
3. User consent management interface
4. Data export/deletion request workflows
5. Security event alerting system
6. Regular security audit procedures
7. Penetration testing schedule
8. Incident response playbooks
