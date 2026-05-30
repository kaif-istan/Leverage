import { Injectable, Inject, OnApplicationBootstrap, Logger } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'
import { eq } from 'drizzle-orm'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { discoveredCompaniesQueue, companies } from '../../../database/schema'

@Injectable()
export class SeedLoaderService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedLoaderService.name)

  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  async onApplicationBootstrap() {
    await this.seedInitialCompanies()
  }

  async seedInitialCompanies() {
    try {
      const seedPath = path.resolve(__dirname, '../../../../../../seeds/companies.json')
      const data = await fs.readFile(seedPath, 'utf8')
      const seeds: Array<{ name: string; slug: string; atsPlatform: string }> = JSON.parse(data)

      this.logger.log(`Seeding ${seeds.length} initial companies from seeds/companies.json...`)

      for (const item of seeds) {
        // First upsert directly into companies since they are pre-verified manual seeds
        const [existingCompany] = await this.db
          .select()
          .from(companies)
          .where(eq(companies.atsSlug, item.slug))
          .limit(1)

        if (!existingCompany) {
          await this.db
            .insert(companies)
            .values({
              name: item.name,
              slug: item.slug,
              atsPlatform: item.atsPlatform as any,
              atsSlug: item.slug,
              atsVerifiedAt: new Date(),
              isMonitored: true,
              monitoringEnabledAt: new Date(),
              discoverySource: 'manual_seed', // align with discoverySourceEnum
              probeStatus: 'confirmed',
              probeLastAttemptedAt: new Date(),
            })
            .onConflictDoNothing()

          this.logger.log(`Seeded confirmed company: ${item.name} (${item.atsPlatform})`)
        }

        // Also ensure it is logged in the queue as confirmed for history tracking
        const [existingQueue] = await this.db
          .select()
          .from(discoveredCompaniesQueue)
          .where(eq(discoveredCompaniesQueue.companyName, item.name))
          .limit(1)

        if (!existingQueue) {
          await this.db.insert(discoveredCompaniesQueue).values({
            source: 'manual_seed',
            companyName: item.name,
            status: 'confirmed',
            probeAttempts: 1,
            lastProbeAt: new Date(),
          })
        }
      }

      this.logger.log('Seeds seeding process finished successfully.')
    } catch (err: any) {
      this.logger.error(`Failed to load seeds: ${err.message}`, err.stack)
    }
  }
}
