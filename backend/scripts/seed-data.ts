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
