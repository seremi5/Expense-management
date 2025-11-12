/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/validators/auth.validator.ts
 *
 * Purpose: Zod validation schemas for authentication endpoints
 *
 * Dependencies: zod
 * Used by: Auth routes, validation middleware
 *
 * Key responsibilities:
 * - Validate login request data
 * - Validate registration request data
 * - Ensure password strength requirements
 * - Validate email format
 *
 * Integration notes: Schemas are used by validation middleware before processing requests
 */

import { z } from 'zod'

/**
 * Password validation schema
 * Requirements:
 * - At least 8 characters
 * - Contains uppercase, lowercase, and number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Email validation schema
 */
const emailSchema = z.string().email('Invalid email format').toLowerCase()

/**
 * Login request validation
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
})

/**
 * Registration request validation
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  }),
})

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
})

export type LoginInput = z.infer<typeof loginSchema>['body']
export type RegisterInput = z.infer<typeof registerSchema>['body']
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']
