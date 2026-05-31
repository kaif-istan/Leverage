import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as path from 'path'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { BullModule } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'
import { CompanyDiscoveryModule } from './modules/company-discovery/company-discovery.module'
import { JobDiscoveryModule } from './modules/job-discovery/job-discovery.module'
import appConfig from './config/app.config'
import databaseConfig from './config/database.config'
import redisConfig from './config/redis.config'
import openaiConfig from './config/openai.config'
import ollamaConfig from './config/ollama.config'

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, openaiConfig, ollamaConfig],
      envFilePath: [
        path.resolve(__dirname, '../../../.env.local'),
        path.resolve(__dirname, '../../../.env'),
        '.env.local',
        '.env',
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Prometheus metrics
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),

    // Telemetry & Queues
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password', 'redispassword'),
        },
      }),
    }),

    // Core modules
    DatabaseModule,
    AuthModule,
    HealthModule,
    CompanyDiscoveryModule,
    JobDiscoveryModule,
  ],
})
export class AppModule {}
