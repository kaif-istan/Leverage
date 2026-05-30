import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { createWinstonLogger } from './common/logger/winston.logger'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const logger = createWinstonLogger()

  const app = await NestFactory.create(AppModule, {
    logger,
  })

  const config = app.get(ConfigService)
  const port = config.get<number>('PORT', 3001)
  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000')

  // Security
  app.use(helmet())
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Global pipes & filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  // API prefix
  app.setGlobalPrefix('api/v1')

  await app.listen(port)
  logger.log(`🚀 API running on http://localhost:${port}/api/v1`, 'Bootstrap')
  logger.log(`🏥 Health: http://localhost:${port}/api/v1/health`, 'Bootstrap')
}

bootstrap()
