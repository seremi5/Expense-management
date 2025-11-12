import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkExpenseEmail() {
  try {
    console.log('Checking expense emails...\n');

    const expenses = await sql`
      SELECT id, email, name, surname, reference_number, created_at
      FROM expenses
      ORDER BY created_at DESC
      LIMIT 10
    `;

    if (expenses.length === 0) {
      console.log('❌ No expenses found in database');
      return;
    }

    console.log(`Found ${expenses.length} expense(s):\n`);
    expenses.forEach((e, i) => {
      console.log(`${i + 1}. Reference: ${e.reference_number}`);
      console.log(`   Email: ${e.email}`);
      console.log(`   Name: ${e.name} ${e.surname}`);
      console.log(`   Created: ${e.created_at}\n`);
    });

    // Check user email
    const user = await sql`
      SELECT id, email, name
      FROM profiles
      WHERE email = 'sreinami@gmail.com'
    `;

    if (user.length > 0) {
      console.log(`Your profile email: ${user[0].email}`);
      console.log(`Your profile name: ${user[0].name}`);

      const matchingExpenses = expenses.filter(e => e.email === user[0].email);
      console.log(`\n✅ Expenses matching your email: ${matchingExpenses.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

checkExpenseEmail();
