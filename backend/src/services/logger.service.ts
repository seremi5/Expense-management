/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/services/logger.service.ts
 *
 * Purpose: Centralized logging service using Winston
 *
 * Dependencies: winston
 * Used by: All services, middleware, and routes
 *
 * Key responsibilities:
 * - Structured logging with different levels (error, warn, info, debug)
 * - Include correlation IDs for request tracing
 * - JSON format for machine readability
 * - Separate error logging
 *
 * Integration notes: Provides consistent logging format across the application
 */

import winston from 'winston'
import { env, isDevelopment } from '../config/env.js'

/**
 * Log levels:
 * - error: System errors, exceptions
 * - warn: Recoverable errors, deprecations
 * - info: Business events (submission, approval)
 * - debug: Detailed debugging information
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = ''
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2)
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`
  })
)

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // Console transport with colorization for development
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : logFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
})

/**
 * Helper functions for structured logging
 */

export function logInfo(message: string, meta: Record<string, any> = {}) {
  logger.info(message, meta)
}

export function logError(message: string, error?: Error, meta: Record<string, any> = {}) {
  logger.error(message, {
    ...meta,
    error: error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : undefined,
  })
}

export function logWarn(message: string, meta: Record<string, any> = {}) {
  logger.warn(message, meta)
}

export function logDebug(message: string, meta: Record<string, any> = {}) {
  logger.debug(message, meta)
}

/**
 * Log HTTP request
 */
export function logRequest(method: string, url: string, meta: Record<string, any> = {}) {
  logger.info(`${method} ${url}`, {
    type: 'request',
    method,
    url,
    ...meta,
  })
}

/**
 * Log HTTP response
 */
export function logResponse(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta: Record<string, any> = {}
) {
  logger.info(`${method} ${url} ${statusCode} ${duration}ms`, {
    type: 'response',
    method,
    url,
    statusCode,
    duration,
    ...meta,
  })
}

/**
 * Log business event
 */
export function logEvent(event: string, meta: Record<string, any> = {}) {
  logger.info(event, {
    type: 'event',
    event,
    ...meta,
  })
}
