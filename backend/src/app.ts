/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/app.ts
 *
 * Purpose: Express application configuration and setup
 *
 * Dependencies: Express, middleware, routes
 * Used by: Main server entry point (index.ts)
 *
 * Key responsibilities:
 * - Configure Express middleware (security, parsing, logging)
 * - Register API routes
 * - Configure error handling
 * - Apply rate limiting and CORS
 *
 * Integration notes: Exports configured Express app for use in server startup
 */

import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { requestLogger, performanceMonitor } from './middleware/logging.middleware.js'
import { sanitizeInput } from './middleware/validation.middleware.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

// Import routes
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import expensesRoutes from './routes/expenses.routes.js'
import profilesRoutes from './routes/profiles.routes.js'
import adminRoutes from './routes/admin.routes.js'
import settingsRoutes from './routes/settings.routes.js'

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express()

  // ========================================
  // Security Middleware
  // ========================================

  // Helmet - Set secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  )

  // CORS - Configure allowed origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true)

        const allowedOrigins = [
          env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:3000',
        ]

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Rate limiting - Prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  })

  // Apply rate limiting to API routes
  app.use('/api', limiter)

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
  })

  // ========================================
  // Parsing Middleware
  // ========================================

  // JSON body parser with size limit
  app.use(express.json({ limit: '10mb' }))

  // URL-encoded form data parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // ========================================
  // Custom Middleware
  // ========================================

  // Request logging
  app.use(requestLogger)

  // Performance monitoring
  app.use(performanceMonitor(1000)) // Warn if request takes > 1 second

  // Input sanitization
  app.use(sanitizeInput)

  // ========================================
  // API Routes
  // ========================================

  // Health check routes (no rate limiting)
  app.use('/api/health', healthRoutes)

  // Authentication routes (with strict rate limiting)
  app.use('/api/auth/login', authLimiter)
  app.use('/api/auth', authRoutes)

  // Expense routes
  app.use('/api/expenses', expensesRoutes)

  // Profile routes
  app.use('/api/profiles', profilesRoutes)

  // Admin routes
  app.use('/api/admin', adminRoutes)

  // Settings routes
  app.use('/api/settings', settingsRoutes)

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Expense Reimbursement API',
      version: '1.0.0',
      status: 'running',
      environment: env.NODE_ENV,
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        expenses: '/api/expenses',
        profiles: '/api/profiles',
        admin: '/api/admin',
      },
    })
  })

  // ========================================
  // Error Handling
  // ========================================

  // 404 handler - must be after all routes
  app.use(notFoundHandler)

  // Global error handler - must be last
  app.use(errorHandler)

  return app
}
