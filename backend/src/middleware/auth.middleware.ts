/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/middleware/auth.middleware.ts
 *
 * Purpose: Authentication and authorization middleware
 *
 * Dependencies: auth service, types
 * Used by: Protected API routes
 *
 * Key responsibilities:
 * - Verify JWT tokens from Authorization header
 * - Attach user information to request object
 * - Enforce role-based access control
 * - Handle authentication errors
 *
 * Integration notes: Applied to routes requiring authentication or admin privileges
 */

import { Response, NextFunction } from 'express'
import { verifyToken, extractTokenFromHeader } from '../services/auth.service.js'
import { AppError } from '../types/index.js'
import type { AuthenticatedRequest } from '../types/index.js'

/**
 * Middleware to verify JWT token and attach user to request
 * Returns 401 if token is missing or invalid
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'No authentication token provided')
    }

    const payload = verifyToken(token)
    req.user = payload

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else if (error instanceof Error) {
      next(new AppError(401, 'INVALID_TOKEN', error.message))
    } else {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication failed'))
    }
  }
}

/**
 * Middleware to require admin role
 * Must be used after authenticate middleware
 * Returns 403 if user is not an admin
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'))
  }

  if (req.user.role !== 'admin') {
    return next(
      new AppError(403, 'FORBIDDEN', 'Admin privileges required for this operation')
    )
  }

  next()
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const payload = verifyToken(token)
      req.user = payload
    }

    next()
  } catch (error) {
    // Ignore authentication errors for optional auth
    next()
  }
}
