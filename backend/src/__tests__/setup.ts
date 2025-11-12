/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Set test environment variables before any imports
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars'
process.env.JWT_EXPIRES_IN = '1h'
process.env.PORT = '3001'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.FRONTEND_URL = 'http://localhost:3000'
process.env.ENABLE_AUDIT_LOG = 'true'
process.env.ENABLE_RLS = 'false'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'

// Suppress console logs in tests (keeping errors and warnings)
const originalConsole = { ...console }
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  error: originalConsole.error,
  warn: originalConsole.warn,
}
