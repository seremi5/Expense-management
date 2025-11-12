import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('Checking database tables...\n');

    // List all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Existing tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // Check expenses table columns if it exists
    const expensesTable = tables.find(t => t.table_name === 'expenses');

    if (expensesTable) {
      console.log('\n📊 Expenses table columns:');
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'expenses'
        ORDER BY ordinal_position
      `;
      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));
    } else {
      console.log('\n⚠️  No expenses table found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
