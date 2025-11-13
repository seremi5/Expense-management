/**
 * Migration script to add phone and bank fields to profiles table
 */

import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Adding phone and bank fields to profiles table...');

  try {
    await db.execute(sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
    `);
    console.log('✓ Added phone column');

    await db.execute(sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account text;
    `);
    console.log('✓ Added bank_account column');

    await db.execute(sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name text;
    `);
    console.log('✓ Added bank_name column');

    await db.execute(sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_holder text;
    `);
    console.log('✓ Added account_holder column');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
