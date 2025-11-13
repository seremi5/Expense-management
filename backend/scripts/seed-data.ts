#!/usr/bin/env tsx
/**
 * Script to seed initial categories and events
 * Usage: tsx scripts/seed-data.ts
 */

import { db } from '../src/db/index.js'
import { categories, events } from '../src/db/schema.js'

const initialCategories = [
  { key: 'transport', label: 'Transport' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'meals', label: 'Meals & Entertainment' },
  { key: 'office-supplies', label: 'Office Supplies' },
  { key: 'software', label: 'Software & Subscriptions' },
  { key: 'training', label: 'Training & Development' },
  { key: 'marketing', label: 'Marketing & Advertising' },
  { key: 'equipment', label: 'Equipment & Hardware' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'other', label: 'Other' },
]

const initialEvents = [
  { key: 'web-summit-2024', label: 'Web Summit 2024' },
  { key: 'aws-reinvent-2024', label: 'AWS re:Invent 2024' },
  { key: 'google-io-2024', label: 'Google I/O 2024' },
  { key: 'microsoft-build-2024', label: 'Microsoft Build 2024' },
  { key: 'general-operations', label: 'General Operations' },
  { key: 'q1-2024', label: 'Q1 2024 Operations' },
  { key: 'q2-2024', label: 'Q2 2024 Operations' },
  { key: 'q3-2024', label: 'Q3 2024 Operations' },
  { key: 'q4-2024', label: 'Q4 2024 Operations' },
]

async function seedData() {
  try {
    console.log('🌱 Starting database seed...')

    // Check if data already exists
    const existingCategories = await db.select().from(categories)
    const existingEvents = await db.select().from(events)

    if (existingCategories.length > 0 || existingEvents.length > 0) {
      console.log('⚠️  Data already exists. Skipping seed.')
      console.log(`   Categories: ${existingCategories.length}`)
      console.log(`   Events: ${existingEvents.length}`)
      process.exit(0)
    }

    // Seed categories
    console.log(`📦 Seeding ${initialCategories.length} categories...`)
    await db.insert(categories).values(
      initialCategories.map((cat) => ({
        key: cat.key,
        label: cat.label,
        isActive: 'true',
      }))
    )
    console.log('✅ Categories seeded successfully')

    // Seed events
    console.log(`📅 Seeding ${initialEvents.length} events...`)
    await db.insert(events).values(
      initialEvents.map((evt) => ({
        key: evt.key,
        label: evt.label,
        isActive: 'true',
      }))
    )
    console.log('✅ Events seeded successfully')

    console.log('🎉 Database seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seedData()
