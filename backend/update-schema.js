import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL);

async function updateSchema() {
  try {
    console.log('Starting schema update...\n');

    // 1. Add new columns to profiles
    console.log('1. Adding new columns to profiles table...');
    await sql`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS bank_account TEXT,
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_holder TEXT
    `;
    console.log('✓ Profile columns added\n');

    // 2. Create new enum types with Catalan values
    console.log('2. Creating new enum types...');

    await sql`
      DO $$ BEGIN
        CREATE TYPE event_new AS ENUM (
          'peregrinatge_estiu_roma',
          'bartimeu',
          'be_apostle',
          'emunah',
          'escola_pregaria',
          'exercicis_espirituals',
          'har_tabor',
          'nicodemus',
          'trobada_adolescents',
          'equip_dele',
          'general'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE category_new AS ENUM (
          'menjar',
          'transport',
          'material_activitats',
          'dietes',
          'impresos_fotocopies',
          'web_xarxes',
          'casa_convis',
          'formacio',
          'cancellacions',
          'material_musica',
          'reparacions',
          'mobiliari'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✓ New enum types created\n');

    // 3. Add temporary columns with new enum types
    console.log('3. Adding temporary columns...');
    await sql`
      ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS event_new event_new,
      ADD COLUMN IF NOT EXISTS category_new category_new
    `;
    console.log('✓ Temporary columns added\n');

    // 4. Drop old columns (since we can't easily migrate the data due to completely different values)
    console.log('4. Cleaning up old columns...');
    await sql`
      ALTER TABLE expenses
      DROP COLUMN IF EXISTS event CASCADE,
      DROP COLUMN IF EXISTS category CASCADE
    `;
    console.log('✓ Old columns dropped\n');

    // 5. Rename new columns to original names
    console.log('5. Renaming columns...');
    await sql`
      ALTER TABLE expenses
      RENAME COLUMN event_new TO event;
    `;
    await sql`
      ALTER TABLE expenses
      RENAME COLUMN category_new TO category;
    `;
    console.log('✓ Columns renamed\n');

    // 6. Drop old enum types
    console.log('6. Dropping old enum types...');
    await sql`DROP TYPE IF EXISTS event CASCADE`;
    await sql`DROP TYPE IF EXISTS category CASCADE`;
    console.log('✓ Old enum types dropped\n');

    // 7. Rename new enum types
    console.log('7. Renaming enum types...');
    await sql`ALTER TYPE event_new RENAME TO event`;
    await sql`ALTER TYPE category_new RENAME TO category`;
    console.log('✓ Enum types renamed\n');

    // 8. Make the columns NOT NULL
    console.log('8. Setting NOT NULL constraints...');
    await sql`
      ALTER TABLE expenses
      ALTER COLUMN event SET NOT NULL,
      ALTER COLUMN category SET NOT NULL
    `;
    console.log('✓ Constraints set\n');

    console.log('✅ Schema update complete!');
    console.log('\nNext steps:');
    console.log('1. Restart the backend server if not using tsx watch');
    console.log('2. Update frontend to use new event and category values');
    console.log('3. Test expense creation with new enums');

  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await sql.end();
  }
}

updateSchema();
