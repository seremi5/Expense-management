# Supabase PostgreSQL Setup and Configuration

## Executive Summary

This document provides comprehensive guidance on setting up and configuring Supabase as the PostgreSQL database and authentication provider for the Expense Reimbursement System. Supabase offers a complete backend solution with PostgreSQL database, authentication, Row Level Security (RLS), and real-time capabilities, all within the free tier for projects with under 500MB database size and 50,000 monthly active users.

**Key Benefits:**
- **Free Tier**: Up to 500MB database, unlimited API requests
- **Built-in Auth**: Email/password authentication out-of-the-box
- **Row Level Security**: Database-level authorization
- **Connection Pooling**: Supavisor handles connections efficiently
- **Automatic Backups**: Daily backups on Pro plan ($25/month)

**For 40-200 monthly submissions: Free tier is sufficient** ✅

---

## 1. Supabase Project Setup

### Creating a New Project

1. **Sign up at**: https://supabase.com
2. **Create new project**:
   - Project name: `expense-reimbursement`
   - Database password: Use strong password (store in password manager)
   - Region: Choose closest to users (e.g., `eu-west-1` for Spain)
   - Pricing plan: Free tier

3. **Wait for provisioning** (2-3 minutes)

### Environment Variables

After project creation, collect these values:

```bash
# .env (Backend)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGci..."  # Public anon key
SUPABASE_SERVICE_KEY="eyJhbGci..." # Secret service role key

# .env (Frontend)
VITE_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGci..." # Public anon key
```

---

## 2. Database Schema Design

### Core Tables

**users table** (handled by Supabase Auth, extended with custom fields):

```sql
-- auth.users is managed by Supabase
-- We create a public.profiles table for additional user data

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  organization TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**expenses table**:

```sql
CREATE TYPE expense_status AS ENUM (
  'draft',
  'submitted',
  'pending_review',
  'approved',
  'declined',
  'paid'
);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,

  -- Vendor information
  vendor_name TEXT NOT NULL,
  vendor_tax_id TEXT, -- NIF/CIF
  vendor_address TEXT,

  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Receipt storage
  receipt_url TEXT, -- Cloudflare R2 URL
  receipt_filename TEXT,

  -- OCR data
  ocr_data JSONB, -- Full extraction result
  ocr_confidence DECIMAL(3, 2), -- 0.00 - 1.00
  requires_review BOOLEAN DEFAULT false,

  -- Status and workflow
  status expense_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  paid_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_invoice_date ON public.expenses(invoice_date DESC);
CREATE INDEX idx_expenses_submitted_at ON public.expenses(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft/submitted expenses"
  ON public.expenses FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status IN ('draft', 'submitted')
  );

CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all expenses"
  ON public.expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**expense_line_items table**:

```sql
CREATE TABLE public.expense_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  vat_rate DECIMAL(5, 2) NOT NULL, -- e.g., 21.00 for 21%
  line_total DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_expense_line_items_expense_id ON public.expense_line_items(expense_id);

-- Enable RLS
ALTER TABLE public.expense_line_items ENABLE ROW LEVEL SECURITY;

-- Policies (inherit from parent expense)
CREATE POLICY "Users can view their expense line items"
  ON public.expense_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert line items for their expenses"
  ON public.expense_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all line items"
  ON public.expense_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**audit_log table** (for tracking changes):

```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'reviewed'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_audit_log_expense_id ON public.audit_log(expense_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit logs for their expenses"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE id = expense_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Triggers for Automatic Updates

```sql
-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_expense_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (expense_id, user_id, action, old_values, new_values)
    VALUES (
      NEW.id,
      auth.uid(),
      'updated',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (expense_id, user_id, action, new_values)
    VALUES (
      NEW.id,
      auth.uid(),
      'created',
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_audit_trigger
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION log_expense_changes();
```

---

## 3. Authentication Setup

### Email/Password Authentication

**Enable in Supabase Dashboard**:
1. Go to Authentication → Settings
2. Enable "Email" provider
3. Configure email templates (see section below)

### Supabase Auth Client (Frontend)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Type-safe database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'user' | 'admin'
          organization: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      expenses: {
        // ... type definitions
      }
    }
  }
}
```

### Authentication Hooks

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, loading }
}

// hooks/useProfile.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setProfile(data)
        setLoading(false)
      })
  }, [userId])

  return { profile, loading, isAdmin: profile?.role === 'admin' }
}
```

### Sign Up / Sign In Functions

```typescript
// services/auth.ts
import { supabase } from '@/lib/supabase'

export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) throw authError

  // 2. Create profile (via trigger or manually)
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'user',
      })

    if (profileError) throw profileError
  }

  return authData
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
}
```

### Automatic Profile Creation Trigger

```sql
-- Create profile automatically when user signs up
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. Row Level Security (RLS) Best Practices

### Testing RLS Policies

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

### Common RLS Patterns

**1. User owns resource**:
```sql
CREATE POLICY "name" ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

**2. Admin access**:
```sql
CREATE POLICY "name" ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**3. Conditional access based on status**:
```sql
CREATE POLICY "name" ON expenses
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status IN ('draft', 'submitted')
  );
```

### Performance Optimization for RLS

```sql
-- Add indexes on columns used in RLS policies
CREATE INDEX idx_profiles_id_role ON profiles(id, role);
CREATE INDEX idx_expenses_user_id_status ON expenses(user_id, status);
```

---

## 5. Connection Pooling with Supavisor

### Understanding Connection Limits

**Free Tier**:
- Direct connections: ~20
- Pooler connections: ~200 (transaction mode)
- Max pooler clients: Depends on compute

### Connection String Types

```bash
# Direct connection (for migrations, admin tasks)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Pooled connection (for application - transaction mode)
postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres

# Pooled connection (session mode)
postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:5432/postgres
```

### Using with Drizzle ORM

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Use pooled connection for application
const connectionString = process.env.DATABASE_URL! // Transaction mode (port 6543)

const client = postgres(connectionString, {
  max: 10, // Max connections in pool
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client)
```

### Best Practices

1. **Use transaction mode (port 6543)** for serverless functions
2. **Keep connection pool size low** (5-10 connections)
3. **Use prepared statements** when possible
4. **Close connections** properly in serverless functions

```typescript
// Serverless function example
export async function handler(event: any) {
  try {
    const result = await db.query.expenses.findMany()
    return { statusCode: 200, body: JSON.stringify(result) }
  } finally {
    // Connection returns to pool automatically
  }
}
```

---

## 6. Database Migrations with Drizzle Kit

### Setup

```bash
npm install -D drizzle-kit
```

**drizzle.config.ts**:
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### Generate and Run Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate:pg

# Push schema directly to database (dev only)
npx drizzle-kit push:pg

# View database in Drizzle Studio
npx drizzle-kit studio
```

---

## 7. Backup and Disaster Recovery

### Daily Backups (Pro Plan - $25/month)

- Automatic daily backups
- 7-day retention on Pro plan
- Point-in-time recovery available

### Manual Backup (Free Tier)

```bash
# Using pg_dump
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup.sql

# Restore
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < backup.sql
```

### Backup Strategy Recommendation

**For free tier**:
1. Weekly manual backups via pg_dump
2. Store backups in Cloudflare R2 or GitHub (encrypted)
3. Test restore process monthly

**Upgrade to Pro ($25/month) for**:
- Automatic daily backups
- Point-in-time recovery
- Production use with compliance requirements

---

## 8. Free Tier Limitations

### Quotas

- **Database size**: 500 MB
- **Bandwidth**: 5 GB
- **Storage**: 1 GB (for Supabase Storage, not needed if using R2)
- **Monthly Active Users**: 50,000
- **API requests**: Unlimited

### Monitoring Usage

Check in Supabase Dashboard → Settings → Usage

### When to Upgrade ($25/month Pro Plan)

- Database size > 500 MB
- Need automatic backups
- Require point-in-time recovery
- Need more than 50,000 MAU
- Production workload with SLA requirements

**For 40-200 monthly submissions**: Free tier is more than sufficient ✅

---

## 9. Real-time Features (Optional)

### Enable Realtime for Admin Dashboard

```typescript
// Subscribe to expense changes
const channel = supabase
  .channel('expenses-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'expenses',
    },
    (payload) => {
      console.log('Change received!', payload)
      // Update UI accordingly
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

### Enable in Supabase Dashboard

1. Go to Database → Replication
2. Enable replication for `expenses` table
3. Configure RLS policies for realtime

---

## 10. Security Best Practices

### Environment Variables

```bash
# NEVER commit these to git
# Use .env.local or secret management

# Backend (server-side only)
SUPABASE_SERVICE_KEY="service_role_key" # Full access, keep secret

# Frontend (public)
VITE_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="anon_public_key" # Safe to expose
```

### Service Role Key Usage

```typescript
// Backend only - full access, bypasses RLS
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Use for admin operations
async function approveExpense(expenseId: string) {
  const { error } = await supabaseAdmin
    .from('expenses')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', expenseId)

  if (error) throw error
}
```

### RLS Testing Checklist

- ✅ Users can only see their own data
- ✅ Users cannot modify other users' data
- ✅ Admins have appropriate elevated access
- ✅ Deleted users' data is cascaded properly
- ✅ Audit logs cannot be modified by users

---

## 11. Official Resources

- **Supabase Documentation**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Auth Guide**: https://supabase.com/docs/guides/auth
- **Drizzle + Supabase**: https://orm.drizzle.team/docs/get-started-postgresql

---

## 12. Next Steps for Architecture

The architecture team should design:
1. Database migration strategy
2. Seed data for development/testing
3. Admin user creation workflow
4. User roles and permissions matrix
5. API endpoints mapping to database operations
6. Caching strategy for frequently accessed data
7. Query optimization for dashboard views
8. Data retention and archival policies
