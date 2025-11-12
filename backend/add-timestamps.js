import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function addTimestamps() {
  try {
    console.log('Ensuring timestamp columns exist and have defaults...\n');

    // Make sure created_at and updated_at have defaults
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at SET DEFAULT NOW()
    `;

    // Update any NULL values
    await sql`
      UPDATE expenses
      SET
        created_at = COALESCE(created_at, NOW()),
        updated_at = COALESCE(updated_at, NOW())
      WHERE created_at IS NULL OR updated_at IS NULL
    `;

    console.log('✅ Timestamp columns fixed with defaults');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

addTimestamps();
