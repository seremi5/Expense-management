import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fixLineItems() {
  try {
    console.log('Checking expense_line_items table...\n');

    // Check current columns
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'expense_line_items'
      ORDER BY ordinal_position
    `;

    console.log('Current expense_line_items columns:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));

    console.log('\nAdding missing columns...');

    // Add the columns that our schema expects
    await sql`
      ALTER TABLE expense_line_items
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `;

    console.log('✅ Missing columns added');

    console.log('\n✅ Line items table fixed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixLineItems();
