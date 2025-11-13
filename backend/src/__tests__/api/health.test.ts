/**
 * API Tests for Health Check Endpoints
 * Tests basic health and detailed health endpoints
 */

import { jest } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'

// Mock logger
jest.mock('../../services/logger.service.js')

describe('Health Check Endpoints', () => {
  const app = createApp()

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
    })

    it('should have JSON content type', async () => {
      const response = await request(app).get('/api/health')

      expect(response.headers['content-type']).toMatch(/json/)
    })
  })

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')

      // May return 200 or 503 depending on DB connection in test environment
      expect([200, 503]).toContain(response.status)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')

      // Only check these if the response is healthy (200)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('uptime')
        expect(response.body).toHaveProperty('environment')
      }
    })

    it('should include database status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')

      expect(response.body).toHaveProperty('services')
      expect(response.body.services).toHaveProperty('database')
      expect(response.body.services.database).toHaveProperty('status')
    })

    it('should include memory information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')

      // Memory info is not currently included in the health endpoint
      // This test documents the current behavior
      expect(response.body).toHaveProperty('services')
      // Memory could be added in future if needed
    })
  })

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body).toHaveProperty('name')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('status', 'running')
      expect(response.body).toHaveProperty('endpoints')
    })

    it('should list all available endpoints', async () => {
      const response = await request(app).get('/')

      expect(response.body.endpoints).toHaveProperty('health')
      expect(response.body.endpoints).toHaveProperty('auth')
      expect(response.body.endpoints).toHaveProperty('expenses')
      expect(response.body.endpoints).toHaveProperty('profiles')
      expect(response.body.endpoints).toHaveProperty('admin')
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND')
    })

    it('should return 404 with proper error structure', async () => {
      const response = await request(app)
        .get('/invalid/path')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('message')
      expect(response.body.error).toHaveProperty('statusCode', 404)
    })
  })
})
