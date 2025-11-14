#!/usr/bin/env tsx
/**
 * Script to seed initial categories and events
 * Usage: tsx scripts/seed-data.ts
 */

import { db } from '../src/db/index.js'
import { categories, events } from '../src/db/schema.js'

const initialCategories = [
  { key: 'transport', label: 'Transport' },
  { key: 'menjar', label: 'Menjar per activitats o reunions' },
  { key: 'material_activitats', label: 'Material per activitats o reunions' },
  { key: 'dietes', label: 'Dietes' },
  { key: 'impresos_fotocopies', label: 'Impresos i fotocòpies' },
  { key: 'web_xarxes', label: 'Web/Xarxes socials' },
  { key: 'casa_convis', label: 'Casa de convis' },
  { key: 'formacio', label: 'Formació' },
  { key: 'cancellacions', label: 'Cancel·lacions' },
  { key: 'material_musica', label: 'Material música' },
  { key: 'reparacions', label: 'Reparacions' },
  { key: 'mobiliari', label: 'Mobiliari' },
]

const initialEvents = [
  { key: 'peregrinatge_estiu_roma', label: 'Peregrinatge d\'estiu (Roma)' },
  { key: 'bartimeu', label: 'Bartimeu' },
  { key: 'be_apostle', label: 'Be apostle' },
  { key: 'emunah', label: 'Emunah' },
  { key: 'escola_pregaria', label: 'Escola de pregària' },
  { key: 'exercicis_espirituals', label: 'Exercicis espirituals' },
  { key: 'har_tabor', label: 'Har Tabor' },
  { key: 'nicodemus', label: 'Nicodemus' },
  { key: 'trobada_adolescents', label: 'Trobada adolescents' },
  { key: 'equip_dele', label: 'Equip Dele' },
  { key: 'general', label: 'General' },
]

async function seedData() {
  try {
    console.log('🌱 Starting database seed...')

    // Check existing data
    const existingCategories = await db.select().from(categories)
    const existingEvents = await db.select().from(events)

    console.log(`   Found ${existingCategories.length} existing categories`)
    console.log(`   Found ${existingEvents.length} existing events`)

    // Get existing keys
    const existingCategoryKeys = new Set(existingCategories.map(c => c.key))
    const existingEventKeys = new Set(existingEvents.map(e => e.key))

    // Filter out items that already exist
    const categoriesToAdd = initialCategories.filter(cat => !existingCategoryKeys.has(cat.key))
    const eventsToAdd = initialEvents.filter(evt => !existingEventKeys.has(evt.key))

    // Seed categories
    if (categoriesToAdd.length > 0) {
      console.log(`📦 Seeding ${categoriesToAdd.length} new categories...`)
      await db.insert(categories).values(
        categoriesToAdd.map((cat) => ({
          key: cat.key,
          label: cat.label,
          isActive: 'true',
        }))
      )
      console.log('✅ Categories seeded successfully')
    } else {
      console.log('⏭️  All categories already exist')
    }

    // Seed events
    if (eventsToAdd.length > 0) {
      console.log(`📅 Seeding ${eventsToAdd.length} new events...`)
      await db.insert(events).values(
        eventsToAdd.map((evt) => ({
          key: evt.key,
          label: evt.label,
          isActive: 'true',
        }))
      )
      console.log('✅ Events seeded successfully')
    } else {
      console.log('⏭️  All events already exist')
    }

    console.log('🎉 Database seed completed!')
    console.log(`   Total categories: ${existingCategories.length + categoriesToAdd.length}`)
    console.log(`   Total events: ${existingEvents.length + eventsToAdd.length}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seedData()
