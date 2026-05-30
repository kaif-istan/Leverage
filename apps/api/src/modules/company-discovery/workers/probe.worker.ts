import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { discoveredCompaniesQueue, companies } from '../../../database/schema'
import { PlatformProbeService } from '../services/platform-probe.service'
import { eq } from 'drizzle-orm'

@Processor('probe-queue')
export class ProbeWorker extends WorkerHost {
  private readonly logger = new Logger(ProbeWorker.name)

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly probeService: PlatformProbeService
  ) {
    super()
  }

  async process(job: Job<{ queueId: string }>): Promise<any> {
    const { queueId } = job.data
    this.logger.log(`Processing probe job ${job.id} for queueId: ${queueId}`)

    const [item] = await this.db
      .select()
      .from(discoveredCompaniesQueue)
      .where(eq(discoveredCompaniesQueue.id, queueId))
      .limit(1)

    if (!item || item.status !== 'pending') {
      this.logger.warn(`Discovered company queue item not found or not pending: ${queueId}`)
      return
    }

    // Update status to probing
    await this.db
      .update(discoveredCompaniesQueue)
      .set({ status: 'probing', updatedAt: new Date() })
      .where(eq(discoveredCompaniesQueue.id, queueId))

    try {
      const result = await this.probeService.probe(item.companyName, item.websiteUrl || undefined)

      if (result) {
        this.logger.log(`🎉 Found platform for ${item.companyName}: ${result.platform} (${result.slug})`)

        // Update queue to confirmed
        await this.db
          .update(discoveredCompaniesQueue)
          .set({
            status: 'confirmed',
            probeAttempts: item.probeAttempts + 1,
            lastProbeAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(discoveredCompaniesQueue.id, queueId))

        // Create or update companies record
        await this.db
          .insert(companies)
          .values({
            name: item.companyName,
            slug: result.slug,
            atsPlatform: result.platform,
            atsSlug: result.slug,
            atsVerifiedAt: new Date(),
            discoverySource: item.source as any,
            isMonitored: true, // Auto-enable monitoring on verification success
            monitoringEnabledAt: new Date(),
            probeStatus: 'confirmed',
            probeLastAttemptedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: companies.atsSlug,
            set: {
              atsPlatform: result.platform,
              atsVerifiedAt: new Date(),
              isMonitored: true,
              monitoringEnabledAt: new Date(),
              probeStatus: 'confirmed',
              probeLastAttemptedAt: new Date(),
            }
          })
      } else {
        this.logger.log(`❌ No platform identified for ${item.companyName}`)
        
        const attempts = item.probeAttempts + 1
        const maxAttempts = 3
        const status = attempts >= maxAttempts ? 'failed' : 'pending'

        await this.db
          .update(discoveredCompaniesQueue)
          .set({
            status,
            probeAttempts: attempts,
            lastProbeAt: new Date(),
            nextProbeAt: status === 'pending' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null, // 7 days fallback
            updatedAt: new Date(),
          })
          .where(eq(discoveredCompaniesQueue.id, queueId))
      }
    } catch (err: any) {
      this.logger.error(`Error probing company ${item.companyName}: ${err.message}`, err.stack)
      await this.db
        .update(discoveredCompaniesQueue)
        .set({
          status: 'pending',
          errorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(discoveredCompaniesQueue.id, queueId))
    }
  }
}
