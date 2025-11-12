import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// Load environment variables
config()

/**
 * Drizzle Kit configuration for database migrations
 *
 * This configuration is used by Drizzle Kit CLI for:
 * - Generating migrations from schema changes
 * - Pushing schema directly to database (dev only)
 * - Opening Drizzle Studio for database management
 */
export default {
  // Schema file path
  schema: './src/db/schema.ts',

  // Output directory for migration files
  out: './drizzle',

  // Database dialect (required in newer versions)
  dialect: 'postgresql',

  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Verbose logging
  verbose: true,

  // Strict mode - fail on warnings
  strict: true,

  // Table name filtering (optional)
  // tablesFilter: ['profiles', 'expenses', 'expense_line_items', 'audit_log'],
} satisfies Config
