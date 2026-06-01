import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { JobRepository } from '../repositories/job.repository'
import { JobMatchRepository } from '../repositories/job-match.repository'
import { MatchingService } from './matching.service'
import { OpportunityScoreService } from './opportunity-score.service'

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name)

  constructor(
    private readonly jobRepo: JobRepository,
    private readonly jobMatchRepo: JobMatchRepository,
    private readonly matchingService: MatchingService,
    private readonly opportunityScoreService: OpportunityScoreService,
  ) {}

  /**
   * Retrieves user preferences.
   */
  async getPreferencesForUser(userId: string) {
    return this.jobRepo.findPreferencesByUserId(userId)
  }

  /**
   * Saves user preferences and triggers rank recomputation.
   */
  async savePreferencesForUser(
    userId: string,
    data: {
      opportunityWeights: any
      salaryMin: number
      remotePreference: any
    },
  ) {
    await this.jobRepo.updatePreferences(userId, data)
    await this.recomputeAllGlobalRanks(userId)
    return { success: true }
  }

  /**
   * Retrieves paginated, sorted, and matched jobs for a given candidate userId.
   */
  async getJobsForUser(
    userId: string,
    filters: {
      page: number
      search?: string | undefined
      locationType?: string | undefined
      seniority?: string | undefined
      sort?: string | undefined
      limit?: number | undefined
    },
  ) {
    const profile = await this.jobRepo.findProfileByUserId(userId)
    if (!profile) {
      return { jobs: [], total: 0 }
    }

    const limit = filters.limit || 15
    const result = await this.jobRepo.findJobs({
      page: filters.page,
      limit,
      search: filters.search,
      locationType: filters.locationType,
      seniority: filters.seniority,
      sort: filters.sort,
      profileId: profile.id,
    })

    return {
      jobs: result.data,
      total: result.total,
    }
  }

  /**
   * Retrieves full details, metrics, gaps, and explanations for a single job opening.
   */
  async getJobDetailForUser(userId: string, jobId: string) {
    const profile = await this.jobRepo.findProfileByUserId(userId)
    if (!profile) {
      throw new NotFoundException('Candidate profile not found. Please upload a resume first.')
    }

    // Auto-compute score on retrieval if not already present
    const existing = await this.jobMatchRepo.findMatch(jobId, profile.id)
    if (!existing) {
      await this.calculateAndSaveScores(jobId, profile)
    }

    const detail = await this.jobRepo.findJobDetail(jobId, profile.id)
    if (!detail) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`)
    }

    return detail
  }

  /**
   * Manually triggers matching and opportunity calculations for a specific job opening.
   */
  async recalculateJobMatch(userId: string, jobId: string) {
    const profile = await this.jobRepo.findProfileByUserId(userId)
    if (!profile) {
      throw new NotFoundException('Candidate profile not found.')
    }

    const matchData = await this.calculateAndSaveScores(jobId, profile)

    // Refresh global ranks
    await this.jobMatchRepo.recomputeGlobalRanks(profile.id)

    return matchData
  }

  /**
   * Recalculates and scores ALL active jobs globally.
   * Useful when weights, target salaries, or remote preferences change.
   */
  async recomputeAllGlobalRanks(userId: string): Promise<{ processedCount: number }> {
    const profile = await this.jobRepo.findProfileByUserId(userId)
    if (!profile) {
      return { processedCount: 0 }
    }

    this.logger.log('Beginning global score & rank recomputation...')
    const activeIds = await this.jobRepo.findActiveJobIds()
    let processedCount = 0

    for (const jobId of activeIds) {
      try {
        await this.calculateAndSaveScores(jobId, profile)
        processedCount++
      } catch (err: any) {
        this.logger.error(`Error scoring job ${jobId} in global refresh: ${err.message}`)
      }
    }

    // Compute single window function rank transaction
    await this.jobMatchRepo.recomputeGlobalRanks(profile.id)
    this.logger.log(`Finished global recomputation. Processed ${processedCount} jobs.`)

    return { processedCount }
  }

  /**
   * Core helper to run both matching and opportunity calculations, saving results.
   */
  private async calculateAndSaveScores(jobId: string, profile: any) {
    // 1. Run core matching
    const matchData = await this.matchingService.computeMatchScore(jobId, profile)
    if (!matchData) return null

    // Insert intermediate matchRecord so opportunity score calculator can fetch it
    await this.jobMatchRepo.upsertMatch({
      jobId,
      profileId: profile.id,
      overallScore: matchData.overallScore,
      semanticScore: matchData.semanticScore,
      keywordScore: matchData.keywordScore,
      seniorityScore: matchData.seniorityScore,
      locationScore: matchData.locationScore,
      freshnessScore: matchData.freshnessScore,
      matchedSkills: matchData.matchedSkills,
      missingRequiredSkills: matchData.missingRequiredSkills,
      missingPreferredSkills: matchData.missingPreferredSkills,
      matchReasons: matchData.matchReasons,
      opportunityScore: 0,
      salarySignal: 0.5,
      companyQualitySignal: 0.5,
      hiringVelocitySignal: 0.5,
      remoteSignal: 0.5,
      freshnessSignal: 0.5,
    })

    // 2. Run opportunity scorer
    const oppData = await this.opportunityScoreService.computeOpportunityScore(jobId, profile)
    if (!oppData) return matchData

    const combinedPayload = {
      jobId,
      profileId: profile.id,
      overallScore: matchData.overallScore,
      semanticScore: matchData.semanticScore,
      keywordScore: matchData.keywordScore,
      seniorityScore: matchData.seniorityScore,
      locationScore: matchData.locationScore,
      freshnessScore: matchData.freshnessScore,
      matchedSkills: matchData.matchedSkills,
      missingRequiredSkills: matchData.missingRequiredSkills,
      missingPreferredSkills: matchData.missingPreferredSkills,
      matchReasons: matchData.matchReasons,
      // Opportunity Signals
      opportunityScore: oppData.opportunityScore,
      salarySignal: oppData.salarySignal,
      companyQualitySignal: oppData.companyQualitySignal,
      hiringVelocitySignal: oppData.hiringVelocitySignal,
      remoteSignal: oppData.remoteSignal,
      freshnessSignal: oppData.freshnessSignal,
      weightsSnapshot: oppData.weightsSnapshot,
      opportunityBoostReasons: oppData.opportunityBoostReasons,
      opportunityComputedAt: new Date(),
    }

    // Save consolidated matching results
    await this.jobMatchRepo.upsertMatch(combinedPayload)
    return combinedPayload
  }
}
