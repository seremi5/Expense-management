import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function testQuery() {
  try {
    console.log('Testing expense query with email filter...\n');

    // Simulate what the API does
    const result = await sql`
      SELECT
        id,
        reference_number,
        email,
        name,
        surname,
        status,
        total_amount,
        created_at,
        updated_at
      FROM expenses
      WHERE email = 'sreinami@gmail.com'
      ORDER BY created_at DESC
      LIMIT 20
    `;

    console.log(`Found ${result.length} expenses:\n`);

    result.forEach((e, i) => {
      console.log(`${i + 1}. ${e.reference_number}`);
      console.log(`   Email: ${e.email}`);
      console.log(`   Status: ${e.status}`);
      console.log(`   Amount: ${e.total_amount}`);
      console.log(`   Created: ${e.created_at}\n`);
    });

    if (result.length === 0) {
      console.log('❌ Query returned no results');

      // Check if expenses exist at all
      const allExpenses = await sql`
        SELECT COUNT(*) as count FROM expenses
      `;
      console.log(`\nTotal expenses in database: ${allExpenses[0].count}`);

      // Check with different email
      const withoutFilter = await sql`
        SELECT id, email FROM expenses LIMIT 5
      `;
      console.log('\nFirst 5 expenses without filter:');
      withoutFilter.forEach(e => console.log(`  - ${e.email}`));
    }

  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await sql.end();
  }
}

testQuery();
