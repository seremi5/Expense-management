import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

const EVENTS = [
  { key: 'peregrinatge_estiu_roma', label: "Peregrinatge d'estiu (Roma)" },
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

const CATEGORIES = [
  { key: 'menjar', label: 'Menjar per activitats o reunions' },
  { key: 'transport', label: 'Transport' },
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

async function createTables() {
  try {
    console.log('📋 Creating events and categories tables...\n')

    // Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        is_active TEXT NOT NULL DEFAULT 'true',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    console.log('✅ Events table created')

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        is_active TEXT NOT NULL DEFAULT 'true',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    console.log('✅ Categories table created\n')

    // Seed events
    console.log('📋 Seeding events...')
    for (const event of EVENTS) {
      await sql`
        INSERT INTO events (key, label, is_active)
        VALUES (${event.key}, ${event.label}, 'true')
        ON CONFLICT (key) DO NOTHING
      `
    }
    console.log(`✅ Seeded ${EVENTS.length} events\n`)

    // Seed categories
    console.log('📋 Seeding categories...')
    for (const category of CATEGORIES) {
      await sql`
        INSERT INTO categories (key, label, is_active)
        VALUES (${category.key}, ${category.label}, 'true')
        ON CONFLICT (key) DO NOTHING
      `
    }
    console.log(`✅ Seeded ${CATEGORIES.length} categories\n`)

    // Verify
    const eventsCount = await sql`SELECT COUNT(*) FROM events`
    const categoriesCount = await sql`SELECT COUNT(*) FROM categories`

    console.log(`📊 Total events: ${eventsCount[0].count}`)
    console.log(`📊 Total categories: ${categoriesCount[0].count}`)

    console.log('\n✅ All done!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sql.end()
  }
}

createTables()
