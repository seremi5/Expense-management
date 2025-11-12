# Database Documentation

## Overview

This document provides comprehensive documentation for the Expense Reimbursement System database implementation using PostgreSQL, Drizzle ORM, and Supabase.

**Technology Stack**:
- Database: PostgreSQL 15 (hosted on Supabase)
- ORM: Drizzle ORM v0.29.3
- Migration Tool: Drizzle Kit v0.20.9
- Connection Pooling: Supavisor (Supabase)

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Setup Instructions](#setup-instructions)
3. [Migration Management](#migration-management)
4. [Database Schema](#database-schema)
5. [Query Examples](#query-examples)
6. [Indexing Strategy](#indexing-strategy)
7. [Performance Optimization](#performance-optimization)
8. [Security and RLS](#security-and-rls)
9. [Troubleshooting](#troubleshooting)

---

## Schema Overview

The database consists of 4 main tables:

1. **profiles** - Extended user profile data linked to Supabase auth.users
2. **expenses** - Core expense submission data with invoice and vendor details
3. **expense_line_items** - Itemized line items from invoices
4. **audit_log** - Audit trail for all expense changes

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
profiles
    │
    │ 1:N
    ├─► expenses
    │       │
    │       │ 1:N
    │       ├─► expense_line_items
    │       │
    │       │ 1:N
    │       └─► audit_log
    │
    └─► audit_log (user actions)
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- PostgreSQL database credentials from Supabase

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**Important**: Use the **pooled connection** (port 6543) for the application.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Initial Migration

```bash
# Generate migration files from schema (already done)
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 5. Apply Constraints and Triggers

The second migration file includes additional constraints, triggers, and RLS policies:

```bash
# Connect to your Supabase database and run
psql $DATABASE_URL -f drizzle/0001_add_constraints_and_triggers.sql
```

Alternatively, use the Supabase SQL Editor to run the contents of `0001_add_constraints_and_triggers.sql`.

### 6. Verify Setup

```bash
# Test database connection
npm run dev

# Open Drizzle Studio to inspect database
npm run db:studio
```

---

## Migration Management

### Available Scripts

```bash
# Generate new migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Push schema directly to database (dev only - bypasses migrations)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio

# Drop all tables (dangerous!)
npm run db:drop
```

### Creating New Migrations

1. Modify the schema in `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/` folder
4. Apply migration: `npm run db:migrate`

### Migration Best Practices

- Always review generated migrations before applying
- Test migrations on development database first
- Never edit migration files after they've been applied
- Use `db:push` only in development, never in production
- Keep migrations small and focused

---

## Database Schema

### Table: profiles

Extended user profile data linked to Supabase auth.users.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | References auth.users(id) |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| full_name | TEXT | NOT NULL | User's full name |
| role | TEXT | NOT NULL, DEFAULT 'user' | User role ('user' or 'admin') |
| organization | TEXT | NULL | Optional organization name |
| phone | TEXT | NULL | Optional phone number |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_profiles_email` on (email)
- `idx_profiles_role` on (role)

**TypeScript Type**:
```typescript
import { Profile, NewProfile } from '@/db/schema'

const profile: Profile = {
  id: '...',
  email: 'user@example.com',
  fullName: 'John Doe',
  role: 'user',
  organization: null,
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

---

### Table: expenses

Core expense submission data with invoice details and workflow status.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique expense identifier |
| user_id | UUID | NOT NULL, FK → profiles(id) | Submitter user ID |
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
| receipt_mimetype | TEXT | NULL | MIME type |
| ocr_data | JSONB | NULL | Full OCR extraction result |
| ocr_confidence | DECIMAL(3,2) | NULL | Confidence score (0.00-1.00) |
| requires_review | BOOLEAN | DEFAULT false | Manual review flag |
| expense_type | TEXT | NULL | 'reimbursable', 'non_reimbursable', or 'payable' |
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

**Status Enum**: `'draft' | 'submitted' | 'pending_review' | 'approved' | 'declined' | 'paid'`

**Indexes**:
- `idx_expenses_user_id` on (user_id)
- `idx_expenses_status` on (status)
- `idx_expenses_invoice_date` on (invoice_date)
- `idx_expenses_submitted_at` on (submitted_at)
- `idx_expenses_user_status` on (user_id, status)

**Constraints**:
- Total amount must equal subtotal + VAT amount
- Invoice date cannot be in the future
- Due date must be after invoice date
- Expense type must be valid

---

### Table: expense_line_items

Detailed line items from invoices with quantity, pricing, and VAT.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Line item identifier |
| expense_id | UUID | NOT NULL, FK → expenses(id) | Parent expense |
| description | TEXT | NOT NULL | Item/service description |
| quantity | DECIMAL(10,2) | NOT NULL, DEFAULT 1 | Item quantity |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit (excl. VAT) |
| vat_rate | DECIMAL(5,2) | NOT NULL | VAT percentage (e.g., 21.00) |
| line_total | DECIMAL(10,2) | NOT NULL | Total for line (incl. VAT) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes**:
- `idx_expense_line_items_expense_id` on (expense_id)

**Constraints**:
- Line total must equal (quantity × unit_price) × (1 + VAT rate/100)
- All values must be positive

---

### Table: audit_log

Audit trail for compliance and debugging.

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log entry identifier |
| expense_id | UUID | NULL, FK → expenses(id) | Related expense |
| user_id | UUID | NULL, FK → profiles(id) | User who performed action |
| action | TEXT | NOT NULL | Action type |
| old_values | JSONB | NULL | Previous state |
| new_values | JSONB | NULL | New state |
| ip_address | TEXT | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Log timestamp |

**Indexes**:
- `idx_audit_log_expense_id` on (expense_id)
- `idx_audit_log_user_id` on (user_id)
- `idx_audit_log_created_at` on (created_at)
- `idx_audit_log_action` on (action)

**Action Types**: `'created' | 'updated' | 'status_changed' | 'reviewed' | 'deleted'`

---

## Query Examples

### Basic Queries

```typescript
import { db } from './db'
import { expenses, profiles, expenseLineItems } from './db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

// Get all expenses for a user
const userExpenses = await db
  .select()
  .from(expenses)
  .where(eq(expenses.userId, userId))
  .orderBy(desc(expenses.createdAt))

// Get expense with line items
const expenseWithItems = await db.query.expenses.findFirst({
  where: eq(expenses.id, expenseId),
  with: {
    lineItems: true,
    user: true,
    reviewer: true,
  },
})

// Get pending expenses for admin
const pendingExpenses = await db
  .select({
    expense: expenses,
    user: profiles,
  })
  .from(expenses)
  .leftJoin(profiles, eq(expenses.userId, profiles.id))
  .where(eq(expenses.status, 'pending_review'))
  .orderBy(desc(expenses.submittedAt))

// Create expense with line items
const [newExpense] = await db
  .insert(expenses)
  .values({
    userId,
    vendorName: 'Test Vendor',
    subtotal: '100.00',
    vatAmount: '21.00',
    totalAmount: '121.00',
    status: 'draft',
  })
  .returning()

await db.insert(expenseLineItems).values([
  {
    expenseId: newExpense.id,
    description: 'Item 1',
    quantity: '1',
    unitPrice: '100.00',
    vatRate: '21.00',
    lineTotal: '121.00',
  },
])

// Update expense status
await db
  .update(expenses)
  .set({
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminId,
    reviewNotes: 'Approved',
  })
  .where(eq(expenses.id, expenseId))

// Get expenses by date range
const expensesByDate = await db
  .select()
  .from(expenses)
  .where(
    and(
      eq(expenses.userId, userId),
      sql`${expenses.invoiceDate} >= ${startDate}`,
      sql`${expenses.invoiceDate} <= ${endDate}`
    )
  )
```

### Advanced Queries

```typescript
// Get total expenses by status
const expenseStats = await db
  .select({
    status: expenses.status,
    count: sql<number>`count(*)`,
    total: sql<string>`sum(${expenses.totalAmount})`,
  })
  .from(expenses)
  .where(eq(expenses.userId, userId))
  .groupBy(expenses.status)

// Search expenses by vendor name (full-text search)
const searchResults = await db
  .select()
  .from(expenses)
  .where(sql`to_tsvector('simple', ${expenses.vendorName}) @@ plainto_tsquery('simple', ${searchTerm})`)

// Get expenses with audit trail
const expenseWithAudit = await db.query.expenses.findFirst({
  where: eq(expenses.id, expenseId),
  with: {
    lineItems: true,
    auditLogs: {
      orderBy: (auditLog, { desc }) => [desc(auditLog.createdAt)],
    },
  },
})
```

---

## Indexing Strategy

### Current Indexes

All indexes are created automatically during migration. The indexing strategy focuses on:

1. **Foreign Keys**: All FK columns are indexed for join performance
2. **Filter Columns**: Status, dates, and user IDs for common queries
3. **Composite Indexes**: user_id + status for filtered user queries
4. **Sort Columns**: created_at, submitted_at for ordering

### Index Monitoring

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Performance Optimization

### Connection Pooling

The application uses connection pooling via Supavisor:

- Pool size: 10 connections (configurable via `DB_POOL_MAX`)
- Idle timeout: 20 seconds
- Connection timeout: 10 seconds

### Prepared Statements

Drizzle ORM automatically uses prepared statements for better performance:

```typescript
const preparedQuery = db
  .select()
  .from(expenses)
  .where(eq(expenses.userId, sql.placeholder('userId')))
  .prepare('get_user_expenses')

// Execute with parameters
const results = await preparedQuery.execute({ userId: '...' })
```

### Batch Operations

Use batch inserts for better performance:

```typescript
// Insert multiple line items at once
await db.insert(expenseLineItems).values([
  { expenseId, description: 'Item 1', ... },
  { expenseId, description: 'Item 2', ... },
  { expenseId, description: 'Item 3', ... },
])
```

### Query Optimization Tips

1. **Use SELECT only needed columns**
   ```typescript
   // Bad: Select all columns
   await db.select().from(expenses)

   // Good: Select specific columns
   await db.select({
     id: expenses.id,
     vendorName: expenses.vendorName,
     totalAmount: expenses.totalAmount,
   }).from(expenses)
   ```

2. **Avoid N+1 queries**
   ```typescript
   // Bad: N+1 queries
   const expenses = await db.select().from(expenses)
   for (const expense of expenses) {
     const user = await db.select().from(profiles).where(eq(profiles.id, expense.userId))
   }

   // Good: Single join query
   const expenses = await db
     .select()
     .from(expenses)
     .leftJoin(profiles, eq(expenses.userId, profiles.id))
   ```

3. **Use relational queries for nested data**
   ```typescript
   // Efficiently fetch expense with relations
   const expense = await db.query.expenses.findFirst({
     where: eq(expenses.id, expenseId),
     with: {
       lineItems: true,
       user: true,
     },
   })
   ```

---

## Security and RLS

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Profiles**:
- Users can view/update their own profile
- Admins can view all profiles

**Expenses**:
- Users can view/create/update their own expenses
- Users can only update draft/submitted expenses
- Users can only delete draft expenses
- Admins can view/update all expenses

**Expense Line Items**:
- Users can view/create/update/delete line items for their expenses
- Line items can only be modified for draft expenses
- Admins can view all line items

**Audit Log**:
- Users can view audit logs for their expenses
- Admins can view all audit logs
- No one can update or delete audit logs (append-only)

### Testing RLS Policies

Use the Supabase SQL Editor to test RLS:

```sql
-- Test as user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM expenses; -- Should only see their expenses

-- Test as admin
SET request.jwt.claim.sub = 'admin-uuid-here';
SELECT * FROM expenses; -- Should see all expenses

-- Reset
RESET ALL;
```

### Security Best Practices

1. Always use the anon key on the frontend
2. Use the service key only on the backend
3. Never expose service key to clients
4. Let RLS handle authorization, not application code
5. Audit logs are append-only for compliance

---

## Troubleshooting

### Common Issues

**Connection Refused**:
- Verify DATABASE_URL is correct
- Check if using pooled connection (port 6543)
- Ensure Supabase project is not paused

**Migration Failed**:
- Check database credentials
- Verify network connectivity
- Review migration SQL for errors
- Check Supabase logs

**RLS Policy Errors**:
- Ensure auth.uid() is set (user is authenticated)
- Check if user has correct role in profiles table
- Verify RLS policies are created correctly

**Slow Queries**:
- Check query execution plan: `EXPLAIN ANALYZE SELECT ...`
- Ensure indexes are being used
- Review connection pool settings
- Consider adding more specific indexes

### Useful Commands

```bash
# Test database connection
npm run dev

# Open database GUI
npm run db:studio

# Generate types from schema
npm run build

# Check migration status
npm run db:generate -- --custom
```

### Database Maintenance

```sql
-- Vacuum tables to reclaim space
VACUUM ANALYZE;

-- Reindex all tables
REINDEX DATABASE postgres;

-- Check for dead tuples
SELECT schemaname, tablename, n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

---

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle Kit CLI Reference](https://orm.drizzle.team/kit-docs/overview)

---

## Support

For issues or questions:
1. Check this documentation
2. Review Drizzle ORM docs
3. Check Supabase logs
4. Review application logs
5. Contact the development team
