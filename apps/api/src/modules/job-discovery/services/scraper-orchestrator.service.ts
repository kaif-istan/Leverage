import { Injectable, Inject, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { companies, jobs, jobSources, scrapeLogs } from '../../../database/schema'
import { eq, and } from 'drizzle-orm'
import { GreenhouseAdapter } from '../adapters/greenhouse.adapter'
import { LeverAdapter } from '../adapters/lever.adapter'
import { AshbyAdapter } from '../adapters/ashby.adapter'
import { IngestionService } from './ingestion.service'

@Injectable()
export class ScraperOrchestrator {
  private readonly logger = new Logger(ScraperOrchestrator.name)

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly greenhouse: GreenhouseAdapter,
    private readonly lever: LeverAdapter,
    private readonly ashby: AshbyAdapter,
    private readonly ingestion: IngestionService
  ) {}

  /**
   * Automatically crawls all monitored companies.
   * Runs twice daily (every 12 hours) in production, but triggers on-demand as well.
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async runAllScrapers() {
    this.logger.log('Starting scheduled job scrape cycles across monitored companies...')

    const monitored = await this.db
      .select()
      .from(companies)
      .where(eq(companies.isMonitored, true))

    this.logger.log(`Found ${monitored.length} companies to scrape.`)

    for (const company of monitored) {
      if (!company.atsPlatform || company.atsPlatform === 'unknown') continue
      await this.scrapeCompanyJobs(company.id)
    }

    this.logger.log('Scraper ingestion round completed.')
  }

  /**
   * Scrapes jobs for a single company.
   */
  async scrapeCompanyJobs(companyId: string) {
    const [company] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1)

    if (!company || !company.atsSlug) {
      this.logger.warn(`Could not scrape company ${companyId}: Not found or missing ATS slug.`)
      return
    }

    this.logger.log(`Starting scrape for ${company.name} (${company.atsPlatform}) using slug: ${company.atsSlug}`)

    // Create or find default jobSource for the ATS platform
    let [source] = await this.db
      .select()
      .from(jobSources)
      .where(eq(jobSources.adapterType, company.atsPlatform as any))
      .limit(1)

    if (!source) {
      const [newSource] = await this.db
        .insert(jobSources)
        .values({
          name: `${company.atsPlatform} API Source`,
          displayName: `${company.atsPlatform} Engine`,
          baseUrl: company.atsPlatform === 'greenhouse'
            ? 'https://boards-api.greenhouse.io/v1'
            : company.atsPlatform === 'lever'
            ? 'https://api.lever.co/v0'
            : 'https://api.ashbyhq.com/v1',
          adapterType: company.atsPlatform as any,
          isEnabled: true,
        })
        .returning()
      source = newSource
    }

    if (!source) {
      this.logger.error(`Unable to find or create job source for ${company.atsPlatform}`)
      return
    }

    const logId = await this.logScrapeStart(company.id, source.id)

    try {
      let crawledJobs: any[] = []

      if (company.atsPlatform === 'greenhouse') {
        crawledJobs = await this.greenhouse.fetchJobs(company.atsSlug)
      } else if (company.atsPlatform === 'lever') {
        crawledJobs = await this.lever.fetchJobs(company.atsSlug)
      } else if (company.atsPlatform === 'ashby') {
        crawledJobs = await this.ashby.fetchJobs(company.atsSlug)
      }

      this.logger.log(`Processing ${crawledJobs.length} crawled roles for ${company.name}`)

      let successCount = 0
      for (const job of crawledJobs) {
        await this.ingestion.ingestJob(job, company.id, source.id)
        successCount++
      }

      await this.logScrapeSuccess(logId, crawledJobs.length, successCount)
    } catch (err: any) {
      this.logger.error(`Failed crawling company ${company.name}: ${err.message}`, err.stack)
      await this.logScrapeFailure(logId, err.message)
    }
  }

  private async logScrapeStart(companyId: string, sourceId: string): Promise<string> {
    const [log] = await this.db
      .insert(scrapeLogs)
      .values({
        companyId,
        sourceId,
        status: 'running',
        startedAt: new Date(),
      })
      .returning()
    if (!log) throw new Error('Failed to create scrape log')
    return log.id
  }

  private async logScrapeSuccess(logId: string, found: number, ingested: number) {
    await this.db
      .update(scrapeLogs)
      .set({
        status: 'success',
        completedAt: new Date(),
        jobsFound: found,
        jobsNew: ingested,
      })
      .where(eq(scrapeLogs.id, logId))
  }

  private async logScrapeFailure(logId: string, error: string) {
    await this.db
      .update(scrapeLogs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error,
      })
      .where(eq(scrapeLogs.id, logId))
  }
}
