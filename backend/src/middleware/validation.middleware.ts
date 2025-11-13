/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/middleware/validation.middleware.ts
 *
 * Purpose: Request validation middleware using Zod schemas
 *
 * Dependencies: zod, types
 * Used by: All API routes
 *
 * Key responsibilities:
 * - Validate request body, params, and query against Zod schemas
 * - Return 400 errors with detailed validation messages
 * - Sanitize and transform input data
 *
 * Integration notes: Generic middleware that works with any Zod schema
 */

import { Request, Response, NextFunction } from 'express'
import { ZodObject, ZodError } from 'zod'
import { AppError } from '../types/index.js'

/**
 * Generic validation middleware factory
 * Validates request against provided Zod schema
 */
export function validate(schema: ZodObject<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and transform request data
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors with more detail
        const errors = (error.issues || []).map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as any).received : undefined,
        }))

        console.error('Validation errors:', JSON.stringify(errors, null, 2))

        next(
          new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', {
            errors,
          })
        )
      } else {
        console.error('Non-Zod validation error:', error)
        next(error)
      }
    }
  }
}

/**
 * Sanitize input by removing potentially dangerous characters
 * This is a basic implementation - adjust based on security requirements
 */
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim()
      }
    })
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body)
  }

  next()
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: Record<string, any>): void {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim()
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key])
    }
  })
}
