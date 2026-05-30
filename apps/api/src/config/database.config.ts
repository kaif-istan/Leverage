import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  url: process.env['DATABASE_URL'] ?? 'postgresql://jobhunter:jobhunter@localhost:5432/jobhunter',
  host: process.env['DATABASE_HOST'] ?? 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
  name: process.env['DATABASE_NAME'] ?? 'jobhunter',
  user: process.env['DATABASE_USER'] ?? 'jobhunter',
  password: process.env['DATABASE_PASSWORD'] ?? 'jobhunter',
  maxConnections: parseInt(process.env['DATABASE_MAX_CONNECTIONS'] ?? '10', 10),
}))
