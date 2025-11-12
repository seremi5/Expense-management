# User Credentials Storage Documentation

## Overview
This document details where and how user credentials and sensitive data are stored in the Expense Reimbursement System.

---

## Backend Storage

### Database: PostgreSQL (Hosted on Supabase)

**Connection Details:**
- Database: PostgreSQL 15
- Host: Supabase Cloud
- Connection String: Stored in `backend/.env` as `DATABASE_URL`

**Credentials Table: `profiles`**

Located in the public schema, the profiles table stores:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- User unique identifier
  email TEXT UNIQUE NOT NULL,             -- User email (login credential)
  password_hash TEXT NOT NULL,            -- Hashed password (bcrypt, 12 rounds)
  name TEXT NOT NULL,                     -- Full name
  role TEXT NOT NULL DEFAULT 'viewer',    -- 'admin' or 'viewer'
  phone TEXT,                             -- Phone number (optional)
  bank_account TEXT,                      -- IBAN / Bank account (optional)
  bank_name TEXT,                         -- Bank name (optional)
  account_holder TEXT,                    -- Account holder name (optional)
  created_at TIMESTAMPTZ NOT NULL,        -- Account creation date
  last_login TIMESTAMPTZ                  -- Last login timestamp
);
```

**Security Measures:**

1. **Password Hashing:**
   - Algorithm: bcrypt
   - Salt Rounds: 12
   - Implementation: `backend/src/services/auth.service.ts`
   - Passwords are NEVER stored in plain text
   - Original password cannot be recovered (one-way hash)

2. **Row Level Security (RLS):**
   - Enabled on all tables
   - Users can only access their own data
   - Admins have elevated permissions
   - Policies defined in: `backend/drizzle/0001_add_constraints_and_triggers.sql`

3. **Database Access:**
   - Connection requires valid credentials
   - Credentials stored in environment variables (not in code)
   - Uses connection pooling (Supavisor)
   - TLS/SSL encryption for all connections

**Storage Location:**
```
Physical: Supabase Cloud Infrastructure
Region: (Depends on your Supabase project settings)
Table: public.profiles
Access: Protected by PostgreSQL authentication + RLS
```

---

## Frontend Storage

### 1. JWT Tokens (Authentication)

**Storage Method:** localStorage

**Location:** Browser localStorage
```javascript
Key: 'auth-token'
Value: JWT token (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
```

**Implementation:**
- File: `frontend/src/store/authStore.ts`
- Zustand store with persistence middleware
- Token stored automatically on login
- Token removed on logout

**Security Considerations:**
- ⚠️ localStorage is vulnerable to XSS attacks
- ✅ JWT has expiration (7 days default)
- ✅ Token is HttpOnly header in requests
- ✅ No sensitive data in token payload (only userId, email, role)

**Token Contents (Decoded JWT):**
```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "role": "viewer",
  "iat": 1699999999,  // Issued at
  "exp": 1700604799,  // Expires at
  "aud": "expense-management-client",
  "iss": "expense-management-api"
}
```

### 2. User Profile Data

**Storage Method:** Zustand store (in-memory + localStorage)

**Location:**
- In-memory: React state via Zustand
- Persisted: localStorage
```javascript
Key: 'auth-storage'
Value: {
  token: "jwt-token-here",
  user: {
    id: "uuid",
    email: "user@example.com",
    name: "User Name",
    role: "viewer",
    phone: "+34 600 123 456",
    bankAccount: "ES00 0000 0000 0000 0000 0000",
    bankName: "CaixaBank",
    accountHolder: "User Name"
  }
}
```

**Implementation:**
- File: `frontend/src/store/authStore.ts`
- Automatically synced with localStorage
- Cleared on logout
- Re-fetched on page refresh

**Security Considerations:**
- ⚠️ Bank details stored in browser (local only)
- ⚠️ Accessible via browser DevTools
- ✅ Cleared when user logs out
- ✅ Not shared across domains
- ✅ Only accessible to same-origin scripts

---

## Environment Variables

### Backend (.env)

**Location:** `backend/.env`

**Critical Credentials:**
```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres

# JWT Secret (used to sign tokens)
JWT_SECRET=your-secret-key-32-chars-minimum

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=public-key-here
SUPABASE_SERVICE_KEY=secret-service-key-here  # ⚠️ NEVER expose!

# File Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key  # ⚠️ NEVER expose!

# OpenAI (for OCR)
OPENAI_API_KEY=sk-...  # ⚠️ NEVER expose!

# Email (Resend)
RESEND_API_KEY=re_...  # ⚠️ NEVER expose!
```

**Security:**
- ✅ File excluded from Git (`.gitignore`)
- ✅ Only accessible on server
- ✅ Never sent to frontend
- ⚠️ Ensure file permissions are restricted (chmod 600)

### Frontend (.env.local)

**Location:** `frontend/.env.local`

**Contents:**
```env
VITE_API_URL=http://localhost:3000/api
```

**Security:**
- ✅ Only non-sensitive configuration
- ✅ No credentials stored
- ✅ Prefixed with VITE_ to be bundled safely

---

## Data Flow

### Registration Flow
```
1. User enters: email + password + name
   ↓
2. Frontend sends to: POST /api/auth/register
   ↓
3. Backend:
   - Hashes password with bcrypt (12 rounds)
   - Stores: { email, password_hash, name } in database
   - Generates JWT token
   ↓
4. Frontend receives: { token, user }
   ↓
5. Frontend stores:
   - token → localStorage['auth-token']
   - user → localStorage['auth-storage']
```

### Login Flow
```
1. User enters: email + password
   ↓
2. Frontend sends to: POST /api/auth/login
   ↓
3. Backend:
   - Looks up user by email
   - Compares password with bcrypt.compare()
   - Generates new JWT token if valid
   ↓
4. Frontend receives: { token, user }
   ↓
5. Frontend stores:
   - token → localStorage['auth-token']
   - user → localStorage['auth-storage']
```

### Profile Update Flow
```
1. User updates: phone, bankAccount, bankName, accountHolder
   ↓
2. Frontend sends to: PATCH /api/profiles/me
   Headers: { Authorization: 'Bearer <token>' }
   Body: { phone, bankAccount, bankName, accountHolder }
   ↓
3. Backend:
   - Verifies JWT token
   - Checks user owns the profile (RLS)
   - Updates database
   ↓
4. Frontend receives: updated user object
   ↓
5. Frontend updates:
   - Zustand store (in-memory)
   - localStorage['auth-storage']
```

---

## Security Best Practices Implemented

### ✅ Backend
1. **Password Hashing:** bcrypt with 12 rounds
2. **JWT Signing:** HS256 algorithm with secret key
3. **Environment Variables:** Sensitive data not in code
4. **Row Level Security:** Database-level access control
5. **HTTPS:** All production traffic encrypted (when deployed)
6. **CORS:** Restricted to frontend domain
7. **Rate Limiting:** Prevents brute force attacks
8. **Input Validation:** Zod schemas on all endpoints

### ✅ Frontend
1. **HTTPS:** Enforced in production
2. **Token Expiration:** 7-day max lifetime
3. **Auto Logout:** On token expiration or 401 errors
4. **XSS Protection:** React escapes all output by default
5. **CSRF Protection:** Token-based auth (not cookies)

---

## Potential Security Improvements

### 🔒 Recommended Enhancements

1. **HttpOnly Cookies for JWT:**
   - Store JWT in HttpOnly cookie instead of localStorage
   - Prevents JavaScript access (XSS protection)
   - Requires backend changes for cookie handling

2. **Refresh Tokens:**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (30 days)
   - Better security with auto-rotation

3. **2FA (Two-Factor Authentication):**
   - Optional SMS or TOTP verification
   - Extra security for admin accounts

4. **Audit Logging:**
   - Already implemented for expenses
   - Extend to profile changes and logins

5. **Rate Limiting:**
   - Already implemented
   - Consider IP-based blocking for repeated failures

6. **Encryption at Rest:**
   - Encrypt sensitive fields in database (bank_account)
   - Use PostgreSQL pgcrypto extension

---

## Access Summary

| Data Type | Storage Location | Encryption | Access Control |
|-----------|-----------------|------------|----------------|
| Password | Database (hash) | bcrypt (12 rounds) | Database auth + RLS |
| JWT Token | Browser localStorage | Signed (HS256) | Same-origin only |
| User Profile | Database + localStorage | TLS in transit | RLS + JWT auth |
| Bank Details | Database + localStorage | TLS in transit | RLS + JWT auth |
| API Keys | Server .env | File permissions | Server-only |

---

## Compliance Notes

### GDPR Considerations
- ✅ Users can view their data (profile page)
- ✅ Users can update their data (profile edit)
- ⚠️ Need to implement: data export, account deletion
- ✅ Audit trail for data changes (audit_log table)
- ✅ Data minimization (only collect necessary fields)

### PCI DSS (If handling payments)
- ⚠️ Bank account data stored but not credit card numbers
- ⚠️ Consider tokenization for sensitive financial data
- ✅ No credit card CVV or full card numbers stored

---

## Emergency Procedures

### If Credentials Are Compromised

1. **Database Breach:**
   - Rotate DATABASE_URL immediately
   - Force password reset for all users
   - Invalidate all JWT tokens (change JWT_SECRET)
   - Notify affected users

2. **JWT Secret Exposed:**
   - Change JWT_SECRET in .env
   - Restart backend server
   - All existing tokens become invalid
   - Users must log in again

3. **API Key Leaked:**
   - Rotate the specific API key (Supabase/OpenAI/Resend)
   - Update .env file
   - Restart services
   - Monitor for unauthorized usage

---

## Support & Questions

For security concerns or questions about credential storage:
1. Review this documentation
2. Check backend code: `backend/src/services/auth.service.ts`
3. Check frontend code: `frontend/src/store/authStore.ts`
4. Review database migrations: `backend/drizzle/`

Last Updated: 2025-11-12
