import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fixAuditLog() {
  try {
    console.log('Checking audit_log table...\n');

    // Check current columns
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'audit_log'
      ORDER BY ordinal_position
    `;

    console.log('Current audit_log columns:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    console.log('\nAdding missing columns...');

    // Add the columns that our schema expects
    await sql`
      ALTER TABLE audit_log
      ADD COLUMN IF NOT EXISTS old_value TEXT,
      ADD COLUMN IF NOT EXISTS new_value TEXT,
      ADD COLUMN IF NOT EXISTS performed_by UUID
    `;

    console.log('✅ Missing columns added');

    // Check if we need to rename any columns
    const hasAction = columns.find(c => c.column_name === 'action');
    const hasExpenseId = columns.find(c => c.column_name === 'expense_id');

    if (!hasAction) {
      console.log('\nAdding action column...');
      await sql`
        ALTER TABLE audit_log
        ADD COLUMN IF NOT EXISTS action TEXT
      `;
    }

    if (!hasExpenseId) {
      console.log('\nAdding expense_id column...');
      await sql`
        ALTER TABLE audit_log
        ADD COLUMN IF NOT EXISTS expense_id UUID
      `;
    }

    console.log('\n✅ Audit log table fixed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixAuditLog();
