#!/usr/bin/env tsx
/**
 * Test Gemini API configuration in production
 * This will help diagnose Railway environment variable issues
 */

import { env } from '../src/config/env.js'

console.log('🔍 Testing Gemini API Configuration')
console.log('=====================================')
console.log(`Environment: ${env.NODE_ENV}`)
console.log(`API URL: ${env.GEMINI_API_URL}`)
console.log(`API Key: ${env.GEMINI_API_KEY ? env.GEMINI_API_KEY.substring(0, 10) + '...' : 'MISSING'}`)
console.log(`Model: ${env.GEMINI_MODEL}`)
console.log('')

if (!env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set!')
  process.exit(1)
}

console.log('Testing Files API upload endpoint...')
const uploadUrl = `${env.GEMINI_API_URL}/upload/v1beta/files`
console.log(`Upload URL: ${uploadUrl}`)
console.log('')

// Test with a minimal request
async function testFilesAPI() {
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': '100',
        'X-Goog-Upload-Header-Content-Type': 'image/jpeg',
        'X-goog-api-key': env.GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: { display_name: 'test.jpg' }
      })
    })

    console.log(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Files API request failed')
      console.error('Response body:', errorText)
      process.exit(1)
    }

    console.log('✅ Files API is accessible!')
    const uploadUrlHeader = response.headers.get('x-goog-upload-url')
    if (uploadUrlHeader) {
      console.log('✅ Got upload URL:', uploadUrlHeader.substring(0, 50) + '...')
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    process.exit(1)
  }
}

testFilesAPI()
