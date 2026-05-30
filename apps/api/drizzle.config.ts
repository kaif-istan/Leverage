import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default {
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://jobhunter:jobhunter@localhost:5432/jobhunter',
  },
  verbose: true,
  strict: true,
} satisfies Config
