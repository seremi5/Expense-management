import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function addReferenceNumber() {
  try {
    console.log('Checking if reference_number column exists...');

    // Check if column exists
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      AND column_name = 'reference_number'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ reference_number column already exists');
      await sql.end();
      return;
    }

    console.log('Adding reference_number column...');

    // Add the column
    await sql`
      ALTER TABLE expenses
      ADD COLUMN reference_number TEXT
    `;

    console.log('Generating reference numbers for existing expenses...');

    // Generate reference numbers for existing rows
    await sql`
      UPDATE expenses
      SET reference_number = 'EXP-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 10, '0')
      WHERE reference_number IS NULL
    `;

    console.log('Setting NOT NULL constraint...');

    // Now set NOT NULL
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN reference_number SET NOT NULL
    `;

    console.log('Adding UNIQUE constraint...');

    // Add unique constraint
    await sql`
      ALTER TABLE expenses
      ADD CONSTRAINT expenses_reference_number_unique UNIQUE (reference_number)
    `;

    console.log('✅ Successfully added reference_number column with constraints');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

addReferenceNumber();
