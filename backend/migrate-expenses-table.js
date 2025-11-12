import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function migrateExpensesTable() {
  try {
    console.log('Starting expenses table migration...\n');

    // Create enum types if they don't exist
    console.log('Creating enum types...');

    await sql`
      DO $$ BEGIN
        CREATE TYPE expense_type AS ENUM ('reimbursable', 'non_reimbursable', 'payable');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('✅ Enum types created');

    // Add missing columns
    console.log('\nAdding missing columns...');

    await sql`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS surname TEXT,
      ADD COLUMN IF NOT EXISTS type expense_type,
      ADD COLUMN IF NOT EXISTS vendor_nif TEXT,
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
      ADD COLUMN IF NOT EXISTS tax_base NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_21_base NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_21_amount NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_10_base NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_10_amount NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_4_base NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_4_amount NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_0_base NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS vat_0_amount NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS bank_account TEXT,
      ADD COLUMN IF NOT EXISTS account_holder TEXT,
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS approved_by UUID,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS declined_reason TEXT,
      ADD COLUMN IF NOT EXISTS comments TEXT
    `;

    console.log('✅ Columns added');

    // Update invoice_date to timestamp with time zone if it's just date
    console.log('\nUpdating invoice_date column type...');
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN invoice_date TYPE TIMESTAMP WITH TIME ZONE USING invoice_date::timestamp with time zone
    `;
    console.log('✅ invoice_date updated to timestamp');

    // Set NOT NULL on required fields after populating them
    console.log('\nPopulating required fields with defaults for existing rows...');

    await sql`
      UPDATE expenses
      SET
        email = COALESCE(email, 'migrated@example.com'),
        phone = COALESCE(phone, '+34000000000'),
        name = COALESCE(name, 'Migrated'),
        surname = COALESCE(surname, 'User'),
        type = COALESCE(type, 'non_reimbursable'::expense_type),
        vendor_nif = COALESCE(vendor_nif, vendor_tax_id, 'UNKNOWN'),
        file_url = COALESCE(file_url, receipt_url, 'https://placeholder.com/receipt.pdf'),
        file_name = COALESCE(file_name, receipt_filename, 'migrated-receipt.pdf')
      WHERE email IS NULL OR phone IS NULL OR name IS NULL OR surname IS NULL OR type IS NULL OR vendor_nif IS NULL OR file_url IS NULL OR file_name IS NULL
    `;

    console.log('✅ Required fields populated');

    // Now set NOT NULL constraints
    console.log('\nSetting NOT NULL constraints...');
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN email SET NOT NULL,
      ALTER COLUMN phone SET NOT NULL,
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN surname SET NOT NULL,
      ALTER COLUMN type SET NOT NULL,
      ALTER COLUMN vendor_nif SET NOT NULL,
      ALTER COLUMN file_url SET NOT NULL,
      ALTER COLUMN file_name SET NOT NULL,
      ALTER COLUMN currency SET NOT NULL
    `;

    console.log('✅ NOT NULL constraints set');

    // Add foreign key for approved_by
    console.log('\nAdding foreign key constraint for approved_by...');
    await sql`
      ALTER TABLE expenses
      DROP CONSTRAINT IF EXISTS expenses_approved_by_profiles_id_fk,
      ADD CONSTRAINT expenses_approved_by_profiles_id_fk
        FOREIGN KEY (approved_by) REFERENCES profiles(id)
    `;

    console.log('✅ Foreign key added');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew columns added:');
    console.log('  - email, phone, name, surname (submitter info)');
    console.log('  - type, vendor_nif (expense classification)');
    console.log('  - tax_base, vat_*_base, vat_*_amount (tax breakdown)');
    console.log('  - bank_account, account_holder (payment info)');
    console.log('  - file_url, file_name (file info)');
    console.log('  - approved_by, approved_at, declined_at, declined_reason');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrateExpensesTable();
