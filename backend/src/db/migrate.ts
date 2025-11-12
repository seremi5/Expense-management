import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db, queryClient, testConnection } from './index.js'
import { validateEnv } from '../config/env.js'

/**
 * Run database migrations
 * This script applies all pending migrations to the database
 */
async function runMigrations() {
  try {
    console.log('[Migration] Starting database migration...')

    // Validate environment variables
    validateEnv()

    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      throw new Error('Database connection failed')
    }

    // Run migrations from the drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('[Migration] Database migration completed successfully')

    // Close connection
    await queryClient.end()

    process.exit(0)
  } catch (error) {
    console.error('[Migration] Migration failed:', error)
    await queryClient.end()
    process.exit(1)
  }
}

// Run migrations
runMigrations()
