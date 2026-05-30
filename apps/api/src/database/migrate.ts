import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

async function runMigrations() {
  const url = process.env['DATABASE_URL']
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  console.log('🗄️  Running database migrations...')

  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  })

  console.log('✅ Migrations complete')
  await client.end()
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
