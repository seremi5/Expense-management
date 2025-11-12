/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/validators/profile.validator.ts
 *
 * Purpose: Zod validation schemas for profile endpoints
 *
 * Dependencies: zod
 * Used by: Profile routes, validation middleware
 *
 * Key responsibilities:
 * - Validate profile update requests
 * - Ensure email format
 * - Validate password changes
 *
 * Integration notes: Used for user profile management endpoints
 */

import { z } from 'zod'

/**
 * Update profile validation
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    email: z.string().email('Invalid email format').optional(),
  }),
})

/**
 * Update profile role (admin only)
 */
export const updateProfileRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid profile ID format'),
  }),
  body: z.object({
    role: z.enum(['admin', 'viewer']),
  }),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body']
export type UpdateProfileRoleInput = z.infer<typeof updateProfileRoleSchema>['body']
