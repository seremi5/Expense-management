/**
 * Location: /Users/sergireina/Documents/GitHub/Expense-management/backend/src/config/env.ts
 *
 * Purpose: Environment variable configuration and validation.
 * Ensures all required environment variables are present and properly typed.
 *
 * Dependencies: dotenv
 * Used by: All service modules, database connection, main application
 *
 * Key responsibilities:
 * - Load environment variables from .env file
 * - Validate required environment variables
 * - Provide typed access to configuration values
 * - Fail fast with clear error messages if configuration is missing
 *
 * Integration notes: This module is imported at application startup and throughout
 * the codebase to access configuration values in a type-safe manner.
 */

import 'dotenv/config';

/**
 * Validates that a required environment variable exists
 * @param key - The environment variable name
 * @param value - The environment variable value
 * @throws Error if the value is undefined or empty
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Application environment configuration
 * All values are validated at module load time to ensure the application
 * cannot start with missing configuration
 */
export const env = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL', process.env.DATABASE_URL),

  // JWT Authentication
  JWT_SECRET: requireEnv('JWT_SECRET', process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Gemini (for OCR)
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY', process.env.GEMINI_API_KEY),
  GEMINI_API_URL: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',

  // Cloudflare R2 Storage (optional for local development)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',

  // Resend Email Service (optional for local development)
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Expense Management <noreply@joventut.cat>',

  // Security (optional for local development)
  FORM_PASSWORD: process.env.FORM_PASSWORD || 'dev_password',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // File Upload
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10), // 20MB default
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf',
  MAX_PDF_PAGES: parseInt(process.env.MAX_PDF_PAGES || '50', 10),
  MIN_IMAGE_WIDTH: parseInt(process.env.MIN_IMAGE_WIDTH || '800', 10),
  MIN_IMAGE_HEIGHT: parseInt(process.env.MIN_IMAGE_HEIGHT || '600', 10),
  MIN_PDF_WIDTH: parseInt(process.env.MIN_PDF_WIDTH || '500', 10),
  MIN_PDF_HEIGHT: parseInt(process.env.MIN_PDF_HEIGHT || '500', 10),

  // OCR Retry Configuration
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  RETRY_BASE_DELAY_MS: parseInt(process.env.RETRY_BASE_DELAY_MS || '1000', 10),

  // Circuit Breaker
  CIRCUIT_BREAKER_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
  CIRCUIT_BREAKER_TIMEOUT_MS: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '60000', 10),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
} as const;

/**
 * Type-safe environment variable access
 */
export type Env = typeof env;

/**
 * Helper to check if running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';
