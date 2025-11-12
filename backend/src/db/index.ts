import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';

// Create PostgreSQL connection
// For migrations and schema introspection
const migrationClient = postgres(env.DATABASE_URL, {
  max: 1,
  onnotice: () => {} // Suppress notices during migrations
});

// For query execution with connection pooling
const queryClient = postgres(env.DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: true, // Use prepared statements for better performance
  onnotice: () => {} // Suppress notices
});

// Create Drizzle instance with schema
export const db = drizzle(queryClient, { schema });

// Export migration client for use with drizzle-kit
export const migrateDb = drizzle(migrationClient, { schema });

// Export schema for use in other modules
export * from './schema.js';

// Graceful shutdown handler
export async function closeDatabase() {
  await queryClient.end();
  await migrationClient.end();
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
  });
}
