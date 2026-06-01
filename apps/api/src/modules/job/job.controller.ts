import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { JobService } from './services/job.service'

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  /**
   * GET /jobs/preferences
   * Retrieves current opportunity weights and target settings for the candidate.
   */
  @Get('preferences')
  async getPreferences(@Request() req: any) {
    const userId = req.user.id
    return this.jobService.getPreferencesForUser(userId)
  }

  /**
   * POST /jobs/preferences
   * Saves updated weights and targets, triggering dynamic ranking calculations.
   */
  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  async savePreferences(
    @Request() req: any,
    @Body() body: { opportunityWeights: any; salaryMin: number; remotePreference: any },
  ) {
    const userId = req.user.id
    return this.jobService.savePreferencesForUser(userId, body)
  }

  /**
   * GET /jobs
   * Retrieves paginated, sorted, and filtered jobs for the logged in user.
   */
  @Get()
  async getJobs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('locationType') locationType?: string,
    @Query('seniority') seniority?: string,
    @Query('sort') sort?: string,
  ) {
    const userId = req.user.id
    const parsedPage = parseInt(page || '1', 10)
    const parsedLimit = parseInt(limit || '15', 10)

    const result = await this.jobService.getJobsForUser(userId, {
      page: parsedPage,
      limit: parsedLimit,
      search,
      locationType,
      seniority,
      sort,
    })

    return result
  }

  /**
   * GET /jobs/:id
   * Retrieves full specifications and personal scores for a single job opening.
   */
  @Get(':id')
  async getJobDetail(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id
    return this.jobService.getJobDetailForUser(userId, id)
  }

  /**
   * POST /jobs/:id/match
   * Manually triggers matching and opportunity calculations for a specific job.
   */
  @Post(':id/match')
  @HttpCode(HttpStatus.OK)
  async matchJob(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id
    return this.jobService.recalculateJobMatch(userId, id)
  }

  /**
   * POST /jobs/recompute-ranks
   * Triggers a global recomputation of all active jobs for the logged in user.
   */
  @Post('recompute-ranks')
  @HttpCode(HttpStatus.OK)
  async recomputeRanks(@Request() req: any) {
    const userId = req.user.id
    return this.jobService.recomputeAllGlobalRanks(userId)
  }
}
