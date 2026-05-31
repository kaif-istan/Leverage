import { Injectable, Inject, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { discoveredCompaniesQueue } from '../../../database/schema'
import { YcDiscoveryService } from './yc-discovery.service'
import { WellfoundDiscoveryService } from './wellfound-discovery.service'
import { eq, and, lte, or, isNull } from 'drizzle-orm'

@Injectable()
export class CompanyDiscoveryOrchestrator {
  private readonly logger = new Logger(CompanyDiscoveryOrchestrator.name)

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly ycService: YcDiscoveryService,
    private readonly wellfoundService: WellfoundDiscoveryService,
    @InjectQueue('probe-queue') private readonly probeQueue: Queue,
  ) {}

  /**
   * Run startup enqueuing check
   */
  async onApplicationBootstrap() {
    this.logger.log('Platform Discovery Orchestrator bootstrapped. Checking pending queue...')
    await this.dispatchPendingProbes()
  }

  /**
   * Scrapes YC Company Directory monthly.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async runYcDiscovery() {
    this.logger.log('Starting scheduled monthly YC discovery run...')
    const added = await this.ycService.scrapeYCDirectory(200)
    this.logger.log(`YC Discovery finished. Added ${added} new startups to queue.`)
    await this.dispatchPendingProbes()
  }

  /**
   * Scrapes Wellfound curated startups weekly.
   */
  @Cron(CronExpression.EVERY_WEEKEND)
  async runWellfoundDiscovery() {
    this.logger.log('Starting scheduled weekly Wellfound discovery run...')
    const added = await this.wellfoundService.scrapeWellfoundDirectory()
    this.logger.log(`Wellfound Discovery finished. Added ${added} new startups to queue.`)
    await this.dispatchPendingProbes()
  }

  /**
   * Dispatches pending queue items to BullMQ for verification.
   * Runs every 10 minutes.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async dispatchPendingProbes() {
    this.logger.log('Scanning queue for pending company probes to dispatch...')

    try {
      const pendingItems = await this.db
        .select()
        .from(discoveredCompaniesQueue)
        .where(
          and(
            eq(discoveredCompaniesQueue.status, 'pending'),
            or(
              isNull(discoveredCompaniesQueue.nextProbeAt),
              lte(discoveredCompaniesQueue.nextProbeAt, new Date()),
            ),
          ),
        )
        .limit(100)

      if (pendingItems.length === 0) {
        this.logger.log('No pending company probes found.')
        return
      }

      this.logger.log(`Dispatching ${pendingItems.length} companies to BullMQ probe-queue...`)

      for (const item of pendingItems) {
        await this.probeQueue.add(
          'probe-company',
          { queueId: item.id },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
            removeOnComplete: true,
          },
        )
      }

      this.logger.log('Verification dispatch completed successfully.')
    } catch (err: any) {
      this.logger.error(`Dispatching probes failed: ${err.message}`, err.stack)
    }
  }
}
