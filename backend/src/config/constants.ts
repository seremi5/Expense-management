/**
 * Location: /Users/sergireina/Documents/GitHub/Expense-management/backend/src/config/constants.ts
 *
 * Purpose: Application-wide constants and configuration values.
 * Centralizes magic numbers, strings, and configuration that doesn't come from environment.
 *
 * Dependencies: None
 * Used by: Services, routes, middleware throughout the application
 *
 * Key responsibilities:
 * - Define status codes and their meanings
 * - Define file validation rules
 * - Define email templates metadata
 * - Define OCR confidence thresholds
 * - Define reference number generation patterns
 *
 * Integration notes: Import specific constants as needed throughout the application.
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'] as const,
  UPLOAD_FIELD_NAME: 'invoice',
} as const;

/**
 * OCR Configuration
 */
export const OCR = {
  MIN_CONFIDENCE_THRESHOLD: 0.7, // 70% minimum confidence
  RETRY_ON_LOW_CONFIDENCE: true,
  MAX_RETRIES: 2,
} as const;

/**
 * Reference Number Generation
 */
export const REFERENCE_NUMBER = {
  PREFIX: 'EXP',
  DATE_FORMAT: 'YYYYMMDD',
  RANDOM_SUFFIX_LENGTH: 6,
  // Example: EXP-20250112-ABC123
} as const;

/**
 * Email Template IDs (Catalan)
 */
export const EMAIL_TEMPLATES = {
  SUBMISSION_CONFIRMATION: 'submission_confirmation',
  EXPENSE_DECLINED: 'expense_declined',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
} as const;

/**
 * Authentication
 */
export const AUTH = {
  JWT_EXPIRY: '24h',
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Storage Paths
 */
export const STORAGE = {
  INVOICE_PATH_TEMPLATE: 'invoices/{year}/{month}/INVOICE_{number}_{timestamp}_{original}',
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;

/**
 * Expense Status Workflow
 * Defines valid status transitions
 */
export const STATUS_TRANSITIONS = {
  submitted: ['ready_to_pay', 'declined', 'validated', 'flagged'],
  validated: ['ready_to_pay', 'declined', 'flagged'],
  ready_to_pay: ['paid', 'declined'],
  flagged: ['validated', 'declined'],
  paid: [], // Terminal state
  declined: [], // Terminal state
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_FORM_PASSWORD: 'Invalid form password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPG, PNG, and PDF are allowed',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  EXPENSE_NOT_FOUND: 'Expense not found',
  DUPLICATE_INVOICE_NUMBER: 'Invoice number already exists',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  OCR_FAILED: 'Failed to extract data from invoice',
  STORAGE_FAILED: 'Failed to upload file',
  EMAIL_FAILED: 'Failed to send email notification',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  EXPENSE_SUBMITTED: 'Expense submitted successfully',
  EXPENSE_APPROVED: 'Expense approved',
  EXPENSE_DECLINED: 'Expense declined',
  EXPENSE_PAID: 'Expense marked as paid',
  EXPENSE_DELETED: 'Expense deleted',
  LOGIN_SUCCESS: 'Login successful',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  IBAN_REGEX: /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/,
  SPANISH_NIF_REGEX: /^[0-9]{8}[A-Z]$/,
  SPANISH_CIF_REGEX: /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/, // E.164 format
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
