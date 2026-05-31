import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'

export function createWinstonLogger() {
  const { combine, timestamp, json, colorize, printf } = winston.format

  const consoleFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ level, message, timestamp, context }) => {
      const ctx = context ? ` [${context}]` : ''
      return `${timestamp} ${level}:${ctx} ${message}`
    }),
  )

  const jsonFormat = combine(timestamp(), json())

  const isProduction = process.env['NODE_ENV'] === 'production'

  return WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: isProduction ? jsonFormat : consoleFormat,
        level: process.env['LOG_LEVEL'] ?? 'info',
      }),
    ],
  })
}
