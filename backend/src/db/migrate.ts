import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { migrateDb, closeDatabase } from './index.js'
import { env } from '../config/env.js'

/**
 * Run database migrations
 * This script applies all pending migrations to the database
 */
async function runMigrations() {
  try {
    console.log('[Migration] Starting database migration...')
    console.log('[Migration] Database URL configured:', env.DATABASE_URL ? 'Yes' : 'No')

    // Run migrations from the drizzle folder
    await migrate(migrateDb, { migrationsFolder: './drizzle' })

    console.log('[Migration] Database migration completed successfully')

    // Close connection
    await closeDatabase()

    process.exit(0)
  } catch (error) {
    console.error('[Migration] Migration failed:', error)
    await closeDatabase()
    process.exit(1)
  }
}

// Run migrations
runMigrations()
