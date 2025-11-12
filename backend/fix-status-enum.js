import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fixStatusEnum() {
  try {
    console.log('Checking expense_status enum values...\n');

    // Check current enum values
    const currentValues = await sql`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'expense_status')
      ORDER BY enumsortorder;
    `;

    console.log('Current values:', currentValues.map(v => v.enumlabel));

    const hasReadyToPay = currentValues.some(v => v.enumlabel === 'ready_to_pay');

    if (!hasReadyToPay) {
      console.log('\nAdding ready_to_pay to expense_status enum...');

      await sql`
        ALTER TYPE expense_status ADD VALUE IF NOT EXISTS 'ready_to_pay';
      `;

      console.log('✅ Added ready_to_pay');
    } else {
      console.log('\n✅ ready_to_pay already exists');
    }

    // Check again
    const updatedValues = await sql`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'expense_status')
      ORDER BY enumsortorder;
    `;

    console.log('\nFinal enum values:', updatedValues.map(v => v.enumlabel));

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixStatusEnum();
