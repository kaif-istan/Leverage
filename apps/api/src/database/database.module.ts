import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DRIZZLE_TOKEN = 'DRIZZLE_DB'

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url')!
        const client = postgres(url, {
          max: config.get<number>('database.maxConnections', 10),
          idle_timeout: 20,
          connect_timeout: 30,
        })
        return drizzle(client, { schema, logger: config.get('app.nodeEnv') === 'development' })
      },
    },
  ],
  exports: [DRIZZLE_TOKEN],
})
export class DatabaseModule {}
