/**
 * Location: /Users/sergireina/GitHub/Expense-management/backend/src/routes/health.routes.ts
 *
 * Purpose: Health check endpoints for monitoring
 *
 * Dependencies: Express, database
 * Used by: Load balancers, monitoring services
 *
 * Key responsibilities:
 * - Provide basic health check endpoint
 * - Report database connectivity status
 * - Return API version and uptime
 *
 * Integration notes: Public endpoints, no authentication required
 */

import { Router, Request, Response } from 'express'
import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

const router = Router()

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  }

  res.status(200).json(healthStatus)
})

/**
 * Detailed health check including database
 * GET /api/health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const startTime = Date.now()
    await db.execute(sql`SELECT 1`)
    const dbLatency = Date.now() - startTime

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
      },
    }

    res.status(200).json(healthStatus)
  } catch (error) {
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    }

    res.status(503).json(errorStatus)
  }
})

export default router
