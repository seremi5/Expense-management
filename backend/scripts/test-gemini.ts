#!/usr/bin/env tsx
/**
 * Test Gemini API connection
 * Usage: GEMINI_API_KEY=your_key tsx scripts/test-gemini.ts
 */

import fetch from 'node-fetch'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables')
  process.exit(1)
}

console.log('🔍 Testing Gemini API connection...')
console.log(`   API Key: ${GEMINI_API_KEY.substring(0, 10)}...`)
console.log(`   Model: ${GEMINI_MODEL}`)

async function testGemini() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Say hello in one word',
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ API request failed:', response.status, response.statusText)
      console.error('   Error details:', JSON.stringify(error, null, 2))
      process.exit(1)
    }

    const data = await response.json()
    console.log('✅ Gemini API is working!')
    console.log('   Response:', JSON.stringify(data, null, 2))
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testGemini()
