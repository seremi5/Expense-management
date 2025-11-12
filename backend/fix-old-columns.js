import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fixOldColumns() {
  try {
    console.log('Making old expense columns nullable...\n');

    // Make all the old schema columns nullable
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN user_id DROP NOT NULL,
      ALTER COLUMN subtotal DROP NOT NULL,
      ALTER COLUMN vat_amount DROP NOT NULL,
      ALTER COLUMN vendor_name DROP NOT NULL,
      ALTER COLUMN status DROP NOT NULL,
      ALTER COLUMN created_at DROP NOT NULL,
      ALTER COLUMN updated_at DROP NOT NULL,
      ALTER COLUMN event DROP NOT NULL,
      ALTER COLUMN category DROP NOT NULL
    `;

    console.log('✅ All old columns are now nullable');
    console.log('\nOld columns that are now optional:');
    console.log('  - user_id (old foreign key to users)');
    console.log('  - subtotal, vat_amount (old financial fields)');
    console.log('  - vendor_name (we use vendorName in new schema)');
    console.log('  - status, created_at, updated_at (have defaults)');
    console.log('  - event, category (new schema provides these)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixOldColumns();
