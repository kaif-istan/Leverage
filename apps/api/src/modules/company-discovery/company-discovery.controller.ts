import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../database/database.module'
import { companies, discoveredCompaniesQueue } from '../../database/schema'
import { PlatformProbeService } from './services/platform-probe.service'
import { CompanyDiscoveryOrchestrator } from './services/company-discovery.orchestrator'
import { eq, desc, sql } from 'drizzle-orm'
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator'

class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsOptional()
  websiteUrl?: string
}

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompanyDiscoveryController {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly probeService: PlatformProbeService,
    private readonly orchestrator: CompanyDiscoveryOrchestrator,
  ) {}

  @Get()
  async getMonitoredCompanies() {
    const list = await this.db.select().from(companies).orderBy(desc(companies.createdAt))
    return list
  }

  @Get('stats')
  async getStats() {
    const [compCount] = await this.db.select({ count: sql<number>`count(*)` }).from(companies)

    const [queueStats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        probing: sql<number>`count(*) filter (where status = 'probing')`,
        confirmed: sql<number>`count(*) filter (where status = 'confirmed')`,
        failed: sql<number>`count(*) filter (where status = 'failed')`,
      })
      .from(discoveredCompaniesQueue)

    return {
      monitoredCount: compCount?.count || 0,
      queue: {
        total: queueStats?.total || 0,
        pending: queueStats?.pending || 0,
        probing: queueStats?.probing || 0,
        confirmed: queueStats?.confirmed || 0,
        failed: queueStats?.failed || 0,
      },
    }
  }

  @Post('probe')
  @HttpCode(HttpStatus.OK)
  async probeCompany(@Body() dto: CreateCompanyDto) {
    const result = await this.probeService.probe(dto.name, dto.websiteUrl)
    if (!result) {
      return {
        success: false,
        message: 'Could not identify Lever, Greenhouse, or Ashby endpoints for this company.',
      }
    }

    // Insert or update
    const [record] = await this.db
      .insert(companies)
      .values({
        name: dto.name,
        slug: result.slug,
        atsPlatform: result.platform,
        atsSlug: result.slug,
        atsVerifiedAt: new Date(),
        discoverySource: 'manual_seed',
        isMonitored: true,
        monitoringEnabledAt: new Date(),
        probeStatus: 'confirmed',
        probeLastAttemptedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: {
          atsPlatform: result.platform,
          atsSlug: result.slug,
          atsVerifiedAt: new Date(),
          isMonitored: true,
          monitoringEnabledAt: new Date(),
          probeStatus: 'confirmed',
          probeLastAttemptedAt: new Date(),
        },
      })
      .returning()

    return {
      success: true,
      data: record,
    }
  }

  @Post('trigger-yc')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerYcDiscovery() {
    this.orchestrator.runYcDiscovery()
    return { message: 'YC discovery scan queued in the background.' }
  }

  @Post('trigger-wellfound')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerWellfoundDiscovery() {
    this.orchestrator.runWellfoundDiscovery()
    return { message: 'Wellfound discovery scan queued in the background.' }
  }
}
