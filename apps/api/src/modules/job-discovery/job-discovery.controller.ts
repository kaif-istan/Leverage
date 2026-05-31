import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../database/database.module'
import { jobs, companies } from '../../database/schema'
import { ScraperOrchestrator } from './services/scraper-orchestrator.service'
import { eq, desc, and, or, sql } from 'drizzle-orm'

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobDiscoveryController {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly scraperOrchestrator: ScraperOrchestrator,
  ) {}

  @Get()
  async listJobs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('locationType') locationType?: 'remote' | 'hybrid' | 'onsite',
    @Query('seniority') seniority?: string,
  ) {
    const offset = (page - 1) * limit
    const conditions: any[] = []

    if (locationType) {
      conditions.push(eq(jobs.locationType, locationType))
    }

    if (seniority) {
      conditions.push(eq(jobs.seniorityLevel, seniority as any))
    }

    if (search) {
      conditions.push(
        or(
          sql`lower(${jobs.title}) LIKE ${'%' + search.toLowerCase() + '%'}`,
          sql`lower(${jobs.descriptionText}) LIKE ${'%' + search.toLowerCase() + '%'}`,
        ),
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const results = await this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        locationType: jobs.locationType,
        seniority: jobs.seniorityLevel,
        skills: jobs.requiredSkills,
        techStack: jobs.technologies,
        postedAt: jobs.postedAt,
        createdAt: jobs.createdAt,
        company: {
          id: companies.id,
          name: companies.name,
          atsPlatform: companies.atsPlatform,
        },
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(whereClause)
      .orderBy(desc(jobs.postedAt))
      .limit(limit)
      .offset(offset)

    const [totalCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(whereClause)

    return {
      jobs: results,
      total: totalCount?.count || 0,
      page,
      limit,
    }
  }

  @Get(':id')
  async getJobDetail(@Param('id') id: string) {
    const [result] = await this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        url: jobs.url,
        location: jobs.location,
        locationType: jobs.locationType,
        seniority: jobs.seniorityLevel,
        descriptionHtml: jobs.descriptionRaw,
        descriptionText: jobs.descriptionText,
        skills: jobs.requiredSkills,
        techStack: jobs.technologies,
        postedAt: jobs.postedAt,
        createdAt: jobs.createdAt,
        company: {
          id: companies.id,
          name: companies.name,
          atsPlatform: companies.atsPlatform,
        },
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.id, id))
      .limit(1)

    return result || null
  }

  @Post('scrape/:companyId')
  @HttpCode(HttpStatus.OK)
  async scrapeCompany(@Param('companyId') companyId: string) {
    await this.scraperOrchestrator.scrapeCompanyJobs(companyId)
    return {
      success: true,
      message: 'Scrape triggered successfully for target company.',
    }
  }
}
