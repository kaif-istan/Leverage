import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { companies } from './schema'

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

async function runSeed() {
  const url = process.env['DATABASE_URL']
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  console.log('🌱 Seeding database...')

  // Load companies.json
  const companiesPath = path.resolve(__dirname, '../../../../seeds/companies.json')
  if (fs.existsSync(companiesPath)) {
    const rawData = fs.readFileSync(companiesPath, 'utf8')
    const companiesData = JSON.parse(rawData)

    console.log(`Inserting ${companiesData.length} companies...`)

    for (const company of companiesData) {
      await db
        .insert(companies)
        .values({
          name: company.name,
          slug: company.slug,
          atsPlatform: company.atsPlatform || 'unknown',
          atsSlug: company.slug, // Seed atsSlug too!
          discoverySource: 'manual_seed',
        })
        .onConflictDoNothing()
    }
    console.log('✅ Companies seeded successfully')
  } else {
    console.warn(`⚠️ Seed file not found at: ${companiesPath}`)
  }

  console.log('✅ Seeding complete')
  await client.end()
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
