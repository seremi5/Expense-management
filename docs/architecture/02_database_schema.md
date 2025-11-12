# Database Schema Architecture

## Document Overview

**Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: PACT Architect
**Database**: PostgreSQL 15 (Supabase)
**ORM**: Drizzle ORM

---

## Executive Summary

This document defines the complete database schema for the Expense Reimbursement System. The schema is designed for PostgreSQL 15 hosted on Supabase, with Row-Level Security (RLS) policies for data protection and Drizzle ORM for type-safe database access.

**Key Design Principles**:
- Normalized schema (3NF) for data integrity
- UUID primary keys for security and scalability
- Timestamp tracking on all tables
- Soft deletes where applicable
- Comprehensive indexing for performance
- RLS policies for multi-tenant security

---

## 1. Entity Relationship Diagram

```
┌─────────────────────┐
│   auth.users        │  (Supabase managed)
│  PK: id (UUID)      │
└──────────┬──────────┘
           │ 1
           │
           │ 1
┌──────────▼──────────┐
│   profiles          │
│  PK: id (UUID)      │───┐
│  FK: id → auth.users│   │
│  - email            │   │
│  - full_name        │   │
│  - role             │   │
│  - organization     │   │
│  - phone            │   │
└─────────────────────┘   │
           │ 1            │
           │              │
           │ N            │
┌──────────▼──────────┐   │
│   expenses          │   │
│  PK: id (UUID)      │   │
│  FK: user_id        │───┘
│  FK: reviewed_by    │───┐
│  - invoice_number   │   │
│  - invoice_date     │   │
│  - vendor_name      │   │
│  - vendor_tax_id    │   │
│  - subtotal         │   │
│  - vat_amount       │   │
│  - total_amount     │   │
│  - receipt_url      │   │
│  - ocr_data (JSONB) │   │
│  - status (ENUM)    │   │
│  - created_at       │   │
│  - updated_at       │   │
└──────────┬──────────┘   │
           │ 1            │
           │              │
           │ N            │
┌──────────▼──────────┐   │
│ expense_line_items  │   │
│  PK: id (UUID)      │   │
│  FK: expense_id     │───┘
│  - description      │
│  - quantity         │
│  - unit_price       │
│  - vat_rate         │
│  - line_total       │
└─────────────────────┘
           │
           │
┌──────────▼──────────┐
│   audit_log         │
│  PK: id (UUID)      │
│  FK: expense_id     │
│  FK: user_id        │
│  - action           │
│  - old_values       │
│  - new_values       │
│  - ip_address       │
│  - user_agent       │
│  - created_at       │
└─────────────────────┘
```

---

## 2. Table Specifications

### 2.1 profiles

**Purpose**: Extended user profile data linked to Supabase auth.users

**Drizzle Schema Definition**:
```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  organization: text('organization'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK → auth.users(id) ON DELETE CASCADE | User identifier |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| full_name | TEXT | NOT NULL | User's full name (Catalan format) |
| role | TEXT | NOT NULL, DEFAULT 'user', CHECK (role IN ('user', 'admin')) | User role for authorization |
| organization | TEXT | NULL | Optional organization name |
| phone | TEXT | NULL | Optional phone number |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Profile creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role = 'admin';
```

**RLS Policies**:
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Sample Data**:
```sql
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'joan.marti@example.cat', 'Joan Martí', 'admin'),
  ('650e8400-e29b-41d4-a716-446655440001', 'maria.garcia@example.cat', 'Maria Garcia', 'user');
```

---

### 2.2 expenses

**Purpose**: Core expense submission data

**Drizzle Schema Definition**:
```typescript
import { pgTable, uuid, text, date, decimal, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core'

export const expenseStatusEnum = pgEnum('expense_status', [
  'draft',
  'submitted',
  'pending_review',
  'approved',
  'declined',
  'paid'
])

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

  // Invoice details
  invoiceNumber: text('invoice_number'),
  invoiceDate: date('invoice_date'),
  dueDate: date('due_date'),

  // Vendor information
  vendorName: text('vendor_name').notNull(),
  vendorTaxId: text('vendor_tax_id'), // NIF/CIF
  vendorAddress: text('vendor_address'),
  vendorCity: text('vendor_city'),
  vendorPostalCode: text('vendor_postal_code'),

  // Amounts
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal('vat_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),

  // Receipt storage
  receiptUrl: text('receipt_url'), // R2 object key
  receiptFilename: text('receipt_filename'),
  receiptFilesize: integer('receipt_filesize'), // bytes
  receiptMimetype: text('receipt_mimetype'),

  // OCR data
  ocrData: jsonb('ocr_data'), // Full extraction result
  ocrConfidence: decimal('ocr_confidence', { precision: 3, scale: 2 }), // 0.00 - 1.00
  requiresReview: boolean('requires_review').default(false),

  // Expense categorization
  expenseType: text('expense_type'), // 'reimbursable', 'non_reimbursable', 'payable'
  category: text('category'), // Category from predefined list
  eventName: text('event_name'), // Event from predefined list
  description: text('description'),
  notes: text('notes'),

  // Workflow status
  status: expenseStatusEnum('status').default('draft'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewNotes: text('review_notes'),
  paidAt: timestamp('paid_at'),
  paymentReference: text('payment_reference'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Expense unique identifier |
| user_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Submitter user ID |
| invoice_number | TEXT | NULL | Invoice/receipt number |
| invoice_date | DATE | NULL | Invoice issue date |
| due_date | DATE | NULL | Payment due date |
| vendor_name | TEXT | NOT NULL | Vendor/supplier name |
| vendor_tax_id | TEXT | NULL | NIF/CIF tax identifier |
| vendor_address | TEXT | NULL | Vendor street address |
| vendor_city | TEXT | NULL | Vendor city |
| vendor_postal_code | TEXT | NULL | Vendor postal code |
| subtotal | DECIMAL(10,2) | NOT NULL | Amount before VAT |
| vat_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | Total VAT amount |
| total_amount | DECIMAL(10,2) | NOT NULL | Total including VAT |
| receipt_url | TEXT | NULL | Cloudflare R2 object key |
| receipt_filename | TEXT | NULL | Original filename |
| receipt_filesize | INTEGER | NULL | File size in bytes |
| receipt_mimetype | TEXT | NULL | MIME type (image/jpeg, application/pdf) |
| ocr_data | JSONB | NULL | Full OCR extraction result |
| ocr_confidence | DECIMAL(3,2) | NULL | Overall confidence (0.00-1.00) |
| requires_review | BOOLEAN | DEFAULT false | Flag for manual review |
| expense_type | TEXT | NULL | 'reimbursable', 'non_reimbursable', 'payable' |
| category | TEXT | NULL | Expense category |
| event_name | TEXT | NULL | Associated event |
| description | TEXT | NULL | User description |
| notes | TEXT | NULL | Additional notes |
| status | expense_status | DEFAULT 'draft' | Workflow status |
| submitted_at | TIMESTAMPTZ | NULL | Submission timestamp |
| reviewed_at | TIMESTAMPTZ | NULL | Review timestamp |
| reviewed_by | UUID | NULL, FK → profiles(id) | Admin who reviewed |
| review_notes | TEXT | NULL | Admin review notes |
| paid_at | TIMESTAMPTZ | NULL | Payment timestamp |
| payment_reference | TEXT | NULL | Payment reference number |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
```sql
-- Query optimization
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_invoice_date ON expenses(invoice_date DESC);
CREATE INDEX idx_expenses_submitted_at ON expenses(submitted_at DESC NULLS LAST);
CREATE INDEX idx_expenses_user_status ON expenses(user_id, status);

-- Full-text search on vendor name
CREATE INDEX idx_expenses_vendor_search ON expenses
  USING gin(to_tsvector('simple', vendor_name));

-- JSON indexing for OCR data
CREATE INDEX idx_expenses_ocr_data ON expenses USING gin(ocr_data);
```

**Constraints**:
```sql
-- Ensure total_amount = subtotal + vat_amount (with 0.01 tolerance for rounding)
ALTER TABLE expenses ADD CONSTRAINT check_total_amount
  CHECK (ABS(total_amount - (subtotal + vat_amount)) < 0.02);

-- Ensure dates are logical
ALTER TABLE expenses ADD CONSTRAINT check_invoice_date
  CHECK (invoice_date IS NULL OR invoice_date <= CURRENT_DATE);

ALTER TABLE expenses ADD CONSTRAINT check_due_date_after_invoice
  CHECK (due_date IS NULL OR invoice_date IS NULL OR due_date >= invoice_date);

-- Ensure submitted_at is set when status changes from draft
-- (Enforced in application logic)
```

**RLS Policies**:
```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can view their own expenses
CREATE POLICY "expenses_select_own" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own expenses
CREATE POLICY "expenses_insert_own" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft/submitted expenses
CREATE POLICY "expenses_update_own" ON expenses
  FOR UPDATE USING (
    auth.uid() = user_id AND
    status IN ('draft', 'submitted')
  );

-- Users can delete their own draft expenses
CREATE POLICY "expenses_delete_own" ON expenses
  FOR DELETE USING (
    auth.uid() = user_id AND
    status = 'draft'
  );

-- Admins can view all expenses
CREATE POLICY "expenses_select_admin" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all expenses
CREATE POLICY "expenses_update_admin" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Sample Data**:
```sql
INSERT INTO expenses (
  user_id, invoice_number, invoice_date, vendor_name, vendor_tax_id,
  subtotal, vat_amount, total_amount, receipt_url, status, submitted_at
) VALUES (
  '650e8400-e29b-41d4-a716-446655440001',
  'FAC-2025-001',
  '2025-01-10',
  'Proveïdor SL',
  'B12345678',
  103.72,
  21.78,
  125.50,
  'receipts/650e8400-e29b-41d4-a716-446655440001/abc123.pdf',
  'pending_review',
  '2025-01-12 10:30:00+00'
);
```

---

### 2.3 expense_line_items

**Purpose**: Detailed line items from invoices

**Drizzle Schema Definition**:
```typescript
export const expenseLineItems = pgTable('expense_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),

  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }).notNull(), // e.g., 21.00
  lineTotal: decimal('line_total', { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Line item identifier |
| expense_id | UUID | NOT NULL, FK → expenses(id) ON DELETE CASCADE | Parent expense |
| description | TEXT | NOT NULL | Item/service description |
| quantity | DECIMAL(10,2) | NOT NULL, DEFAULT 1 | Item quantity |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit (excl. VAT) |
| vat_rate | DECIMAL(5,2) | NOT NULL | VAT percentage (e.g., 21.00) |
| line_total | DECIMAL(10,2) | NOT NULL | Total for line (incl. VAT) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes**:
```sql
CREATE INDEX idx_expense_line_items_expense_id ON expense_line_items(expense_id);
```

**Constraints**:
```sql
-- Ensure line_total = (quantity * unit_price) * (1 + vat_rate/100)
ALTER TABLE expense_line_items ADD CONSTRAINT check_line_total
  CHECK (ABS(line_total - (quantity * unit_price * (1 + vat_rate/100))) < 0.02);

-- Ensure positive values
ALTER TABLE expense_line_items ADD CONSTRAINT check_positive_values
  CHECK (quantity > 0 AND unit_price >= 0 AND vat_rate >= 0);
```

**RLS Policies**:
```sql
ALTER TABLE expense_line_items ENABLE ROW LEVEL SECURITY;

-- Users can view line items for their expenses
CREATE POLICY "line_items_select_own" ON expense_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

-- Users can insert line items for their expenses
CREATE POLICY "line_items_insert_own" ON expense_line_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

-- Admins can view all line items
CREATE POLICY "line_items_select_admin" ON expense_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 2.4 audit_log

**Purpose**: Audit trail for compliance and debugging

**Drizzle Schema Definition**:
```typescript
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id),

  action: text('action').notNull(), // 'created', 'updated', 'status_changed', 'reviewed'
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'), // Using inet type
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log entry identifier |
| expense_id | UUID | NULL, FK → expenses(id) ON DELETE CASCADE | Related expense (if applicable) |
| user_id | UUID | NULL, FK → profiles(id) | User who performed action |
| action | TEXT | NOT NULL | Action type |
| old_values | JSONB | NULL | Previous state (for updates) |
| new_values | JSONB | NULL | New state |
| ip_address | TEXT | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent string |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Log timestamp |

**Indexes**:
```sql
CREATE INDEX idx_audit_log_expense_id ON audit_log(expense_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

**RLS Policies**:
```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their expenses
CREATE POLICY "audit_log_select_own" ON audit_log
  FOR SELECT USING (
    expense_id IS NULL OR
    EXISTS (
      SELECT 1 FROM expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

-- Admins can view all audit logs
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No one can update or delete audit logs (append-only)
```

---

## 3. Database Triggers

### 3.1 Auto-update Timestamps

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Auto-create Audit Log Entries

```sql
-- Function to log expense changes
CREATE OR REPLACE FUNCTION log_expense_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (expense_id, user_id, action, new_values)
    VALUES (NEW.id, auth.uid(), 'created', to_jsonb(NEW));

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if status changed or reviewed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_log (expense_id, user_id, action, old_values, new_values)
      VALUES (
        NEW.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
      );
    END IF;

    IF OLD.reviewed_at IS NULL AND NEW.reviewed_at IS NOT NULL THEN
      INSERT INTO audit_log (expense_id, user_id, action, new_values)
      VALUES (
        NEW.id,
        NEW.reviewed_by,
        'reviewed',
        jsonb_build_object(
          'status', NEW.status,
          'review_notes', NEW.review_notes
        )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER expense_audit_trigger
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_changes();
```

### 3.3 Auto-create Profile on User Signup

```sql
-- Function to create profile when auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. Database Migration Strategy

### 4.1 Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
```

### 4.2 Initial Migration (0000_initial_schema.sql)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE expense_status AS ENUM (
  'draft',
  'submitted',
  'pending_review',
  'approved',
  'declined',
  'paid'
);

-- Create tables (as defined above)
-- ... (all CREATE TABLE statements)

-- Create indexes (as defined above)
-- ... (all CREATE INDEX statements)

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- ... (all CREATE POLICY statements)

-- Create triggers
-- ... (all CREATE TRIGGER statements)
```

### 4.3 Migration Workflow

```bash
# Generate migration from schema changes
npm run db:generate

# Review generated migration in drizzle/ folder

# Apply migration to database
npm run db:migrate

# Or push schema directly (dev only)
npm run db:push
```

---

## 5. Query Optimization Guidelines

### 5.1 Common Query Patterns

**Get user's recent expenses**:
```typescript
const recentExpenses = await db
  .select()
  .from(expenses)
  .where(eq(expenses.userId, userId))
  .orderBy(desc(expenses.createdAt))
  .limit(20)
```

**Get expenses pending review (Admin)**:
```typescript
const pendingExpenses = await db
  .select({
    expense: expenses,
    user: profiles,
  })
  .from(expenses)
  .leftJoin(profiles, eq(expenses.userId, profiles.id))
  .where(eq(expenses.status, 'pending_review'))
  .orderBy(desc(expenses.submittedAt))
```

**Get expense with line items**:
```typescript
const expense = await db.query.expenses.findFirst({
  where: eq(expenses.id, expenseId),
  with: {
    lineItems: true,
    reviewer: true,
  },
})
```

### 5.2 Performance Considerations

**Use Prepared Statements**:
```typescript
const preparedQuery = db
  .select()
  .from(expenses)
  .where(eq(expenses.userId, placeholder('userId')))
  .prepare('get_user_expenses')

const results = await preparedQuery.execute({ userId: '...' })
```

**Batch Inserts**:
```typescript
await db.insert(expenseLineItems).values([
  { expenseId, description: 'Item 1', ... },
  { expenseId, description: 'Item 2', ... },
  { expenseId, description: 'Item 3', ... },
])
```

**Avoid N+1 Queries**:
```typescript
// ❌ Bad: N+1 queries
const expenses = await db.select().from(expenses)
for (const expense of expenses) {
  const user = await db.select().from(profiles).where(eq(profiles.id, expense.userId))
}

// ✅ Good: Single join query
const expenses = await db
  .select()
  .from(expenses)
  .leftJoin(profiles, eq(expenses.userId, profiles.id))
```

---

## 6. Data Retention and Archival

### 6.1 Retention Policies

**Active Data**:
- Expenses: Retain indefinitely while active
- Audit logs: Retain for 2 years
- User profiles: Retain while account active

**Archived Data**:
- Deleted expenses: Soft delete, retain for 90 days then hard delete
- Closed expenses (paid): Archive after 7 years per Spanish tax law

### 6.2 Archival Process

```sql
-- Archive old audit logs
CREATE TABLE IF NOT EXISTS audit_log_archive (LIKE audit_log INCLUDING ALL);

-- Move old logs to archive
WITH deleted AS (
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '2 years'
  RETURNING *
)
INSERT INTO audit_log_archive SELECT * FROM deleted;
```

---

## 7. Backup and Recovery

### 7.1 Backup Strategy

**Automated Backups** (Supabase Pro):
- Frequency: Daily at 02:00 UTC
- Retention: 7 days
- Format: pg_dump format

**Manual Backups**:
```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema-only backup
pg_dump --schema-only $DATABASE_URL > schema_backup.sql
```

### 7.2 Recovery Procedures

**Full Recovery**:
```bash
# Restore from backup
psql $DATABASE_URL < backup_20250115.sql
```

**Point-in-Time Recovery** (Supabase Pro only):
- Available via Supabase dashboard
- Restore to any point within 7-day window

---

## 8. Database Security Checklist

- ✅ RLS enabled on all tables
- ✅ Policies enforce user/admin separation
- ✅ No direct table access from frontend
- ✅ Prepared statements prevent SQL injection
- ✅ Sensitive data encrypted (consider field-level encryption for NIF/CIF)
- ✅ Audit logs are append-only
- ✅ Connection pooling limits resource usage
- ✅ Regular backups configured
- ✅ SSL/TLS enforced for connections

---

## 9. Drizzle ORM Integration Examples

### 9.1 Schema Export

```typescript
// src/db/schema.ts
import * as t from 'drizzle-orm/pg-core'

// Export all table definitions
export const profiles = t.pgTable(/* ... */)
export const expenses = t.pgTable(/* ... */)
export const expenseLineItems = t.pgTable(/* ... */)
export const auditLog = t.pgTable(/* ... */)

// Export relations
import { relations } from 'drizzle-orm'

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  user: one(profiles, {
    fields: [expenses.userId],
    references: [profiles.id],
  }),
  lineItems: many(expenseLineItems),
  reviewer: one(profiles, {
    fields: [expenses.reviewedBy],
    references: [profiles.id],
  }),
}))
```

### 9.2 Database Client

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
```

---

## 10. Future Schema Enhancements

**Phase 2**:
- Add `payment_methods` table for tracking payment information
- Add `expense_comments` table for threaded discussions
- Add `expense_attachments` table for multiple files per expense

**Phase 3**:
- Add `expense_approvals` table for multi-level approval workflows
- Add `expense_categories` table for dynamic category management
- Add `expense_budgets` table for budget tracking

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | PACT Architect | Initial database schema specification |
