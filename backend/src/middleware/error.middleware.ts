/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/middleware/error.middleware.ts
 *
 * Purpose: Global error handling middleware
 *
 * Dependencies: logger service, types
 * Used by: Express app (registered last)
 *
 * Key responsibilities:
 * - Catch all errors thrown by routes and middleware
 * - Format error responses consistently
 * - Log errors appropriately
 * - Hide sensitive error details in production
 *
 * Integration notes: Should be the last middleware registered in Express app
 */

import { Request, Response, NextFunction } from 'express'
import { AppError, ApiResponse } from '../types/index.js'
import { logError } from '../services/logger.service.js'
import { isDevelopment } from '../config/env.js'

/**
 * Global error handler middleware
 * Catches all errors and formats response
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError('Error occurred', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: (req as any).user?.userId,
  })

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: isDevelopment ? err.details : undefined,
      },
    }

    res.status(err.statusCode).json(response)
    return
  }

  // Handle generic errors
  const statusCode = 500
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      statusCode,
      details: isDevelopment ? { stack: err.stack } : undefined,
    },
  }

  res.status(statusCode).json(response)
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new AppError(
    404,
    'NOT_FOUND',
    `Route ${req.method} ${req.url} not found`
  )
  next(error)
}

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
