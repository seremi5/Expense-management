#!/usr/bin/env tsx
/**
 * Migration script to convert event and category columns from ENUM to TEXT
 * This allows flexible values from the events and categories tables
 */

import { db } from '../src/db/index.js'
import { sql } from 'drizzle-orm'

async function migrateEnumToText() {
  try {
    console.log('🔄 Starting migration: ENUM to TEXT...')

    // Step 1: Alter the event column to TEXT
    console.log('   Converting event column to TEXT...')
    await db.execute(sql`
      ALTER TABLE expenses
      ALTER COLUMN event TYPE text
      USING event::text
    `)
    console.log('   ✅ Event column converted')

    // Step 2: Alter the category column to TEXT
    console.log('   Converting category column to TEXT...')
    await db.execute(sql`
      ALTER TABLE expenses
      ALTER COLUMN category TYPE text
      USING category::text
    `)
    console.log('   ✅ Category column converted')

    // Step 3: Drop the old ENUM types (only if they exist)
    console.log('   Dropping old ENUM types...')
    try {
      await db.execute(sql`DROP TYPE IF EXISTS event CASCADE`)
      console.log('   ✅ Dropped event ENUM type')
    } catch (error) {
      console.log('   ⚠️  Event ENUM type may not exist, skipping...')
    }

    try {
      await db.execute(sql`DROP TYPE IF EXISTS category CASCADE`)
      console.log('   ✅ Dropped category ENUM type')
    } catch (error) {
      console.log('   ⚠️  Category ENUM type may not exist, skipping...')
    }

    console.log('🎉 Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrateEnumToText()
