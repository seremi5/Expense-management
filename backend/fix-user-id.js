import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function fixUserId() {
  try {
    console.log('Making user_id nullable in expenses table...\n');

    // Make user_id nullable since expenses can be submitted by non-logged-in users
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN user_id DROP NOT NULL
    `;

    console.log('✅ user_id is now nullable');
    console.log('\nExpenses can now be created without requiring user authentication.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixUserId();
