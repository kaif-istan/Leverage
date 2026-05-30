import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  jwtSecret: process.env['JWT_SECRET'] ?? 'change-me-in-production-min-64-chars',
  jwtExpiry: process.env['JWT_EXPIRY'] ?? '24h',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] ?? 'refresh-change-me-in-production',
  jwtRefreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '30d',
}))
