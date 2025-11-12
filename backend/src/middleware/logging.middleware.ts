/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/middleware/logging.middleware.ts
 *
 * Purpose: HTTP request/response logging middleware
 *
 * Dependencies: logger service
 * Used by: Express app (registered early)
 *
 * Key responsibilities:
 * - Log all incoming HTTP requests
 * - Log response status and duration
 * - Generate correlation IDs for request tracing
 *
 * Integration notes: Should be one of the first middleware registered
 */

import { Request, Response, NextFunction } from 'express'
import { logRequest, logResponse } from '../services/logger.service.js'
import { randomUUID } from 'crypto'

/**
 * Request logging middleware
 * Logs HTTP method, URL, and duration
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = randomUUID()
  const startTime = Date.now()

  // Attach correlation ID to request
  ;(req as any).correlationId = correlationId

  // Log incoming request
  logRequest(req.method, req.url, {
    correlationId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.userId,
  })

  // Intercept response finish event to log response
  const originalSend = res.send
  res.send = function (data): Response {
    const duration = Date.now() - startTime

    logResponse(req.method, req.url, res.statusCode, duration, {
      correlationId,
      userId: (req as any).user?.userId,
    })

    return originalSend.call(this, data)
  }

  next()
}

/**
 * Performance monitoring middleware
 * Warns if request takes too long
 */
export function performanceMonitor(threshold: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - startTime

      if (duration > threshold) {
        logRequest(req.method, req.url, {
          slow: true,
          duration,
          threshold,
          correlationId: (req as any).correlationId,
        })
      }
    })

    next()
  }
}
