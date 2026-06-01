import { Injectable, Logger, Inject } from '@nestjs/common'
import { JobRepository } from '../repositories/job.repository'
import { JobMatchRepository } from '../repositories/job-match.repository'
import { ExplanationBuilder } from '../utils/explanation-builder'
import { eq } from 'drizzle-orm'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { userPreferences, companyIntelligence } from '../../../database/schema'
import { DEFAULT_OPPORTUNITY_WEIGHTS } from '@job-hunter/shared'

@Injectable()
export class OpportunityScoreService {
  private readonly logger = new Logger(OpportunityScoreService.name)

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly jobRepo: JobRepository,
    private readonly jobMatchRepo: JobMatchRepository,
  ) {}

  /**
   * Calculates the full personal Opportunity Score for a candidate's profile and a job.
   */
  async computeOpportunityScore(jobId: string, profile: any): Promise<any> {
    const job = await this.jobRepo.findJobById(jobId)
    if (!job) {
      this.logger.warn(`Job ${jobId} not found for Opportunity calculation.`)
      return null
    }

    // Load existing job_matches record
    const matchRecord = await this.jobMatchRepo.findMatch(jobId, profile.id)
    if (!matchRecord) {
      this.logger.warn(
        `No match record found yet for job ${jobId} and profile ${profile.id}. Calculate Match Score first.`,
      )
      return null
    }

    // Load company intelligence
    const [companyIntel] = await this.db
      .select()
      .from(companyIntelligence)
      .where(eq(companyIntelligence.companyId, job.companyId))
      .limit(1)

    // Load User Preferences
    const [preferences] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, profile.userId))
      .limit(1)

    const weights = (preferences?.opportunityWeights as any) || DEFAULT_OPPORTUNITY_WEIGHTS
    const salaryTarget = preferences?.salaryMin || profile.salaryMin || 100000

    // ─── SIGNAL 1: Match Score (30%) ──────────────────────────────────────────
    const matchSignal = matchRecord.overallScore

    // ─── SIGNAL 2: Salary Attractiveness (25%) ──────────────────────────────────
    let salarySignal = 0.5 // neutral fallback
    if (job.salaryMin || job.salaryMax) {
      const minSal = job.salaryMin || 0
      const maxSal = job.salaryMax || job.salaryMin || 0
      const midpoint = (minSal + maxSal) / 2

      const ratio = midpoint / salaryTarget
      // Scale from 0 to 1.5 target, capped at 1.0 similarity signal
      salarySignal = Math.min(ratio, 1.5) / 1.5
    }

    // ─── SIGNAL 3: Company Quality (20%) ────────────────────────────────────────
    let companyQualitySignal = 0.5 // neutral default
    if (companyIntel) {
      // Sub-signal A: Funding Stage (40%)
      const stage = companyIntel.fundingStage || 'unknown'
      const fundingScores: Record<string, number> = {
        bootstrapped: 0.3,
        pre_seed: 0.4,
        seed: 0.5,
        series_a: 0.65,
        series_b: 0.75,
        series_c: 0.85,
        series_d_plus: 0.9,
        public: 0.85,
        acquired: 0.8,
        unknown: 0.5,
      }
      const fundingScore = fundingScores[stage.toLowerCase()] ?? 0.5

      // Sub-signal B: Glassdoor Rating (30%)
      let glassdoorScore = 0.5
      if (companyIntel.glassdoorRating) {
        // Normalize 2.0★ - 5.0★ to [0, 1]
        glassdoorScore = Math.min(
          1.0,
          Math.max(0.0, (companyIntel.glassdoorRating - 2.0) / (5.0 - 2.0)),
        )
      }

      // Sub-signal C: Employee Count Score (30%)
      let sizeScore = 0.5
      if (companyIntel.employeeCount) {
        const countVal = companyIntel.employeeCount
        if (countVal <= 10)
          sizeScore = 0.4 // high risk seed
        else if (countVal <= 50) sizeScore = 0.55
        else if (countVal <= 200) sizeScore = 0.7
        else if (countVal <= 500) sizeScore = 0.8
        else if (countVal <= 1000) sizeScore = 0.85
        else sizeScore = 0.75 // big corporate
      }

      companyQualitySignal = fundingScore * 0.4 + glassdoorScore * 0.3 + sizeScore * 0.3
    }

    // ─── SIGNAL 4: Hiring Velocity (10%) ───────────────────────────────────────
    let hiringVelocitySignal = 0.5 // neutral default
    if (companyIntel) {
      const velocity = companyIntel.hiringVelocity || 'unknown'
      const velocityScores: Record<string, number> = {
        growing: 1.0,
        stable: 0.6,
        shrinking: 0.2,
        unknown: 0.5,
      }
      hiringVelocitySignal = velocityScores[velocity.toLowerCase()] ?? 0.5
    }

    // ─── SIGNAL 5: Remote Preference Match (8%) ─────────────────────────────────
    const jobLocType = job.locationType || 'unknown'
    const userPrefLoc = preferences?.remotePreference || profile.remotePreference || 'any'

    let remoteSignal = 0.5
    const jType = jobLocType.toLowerCase()
    const uPref = userPrefLoc.toLowerCase()

    if (uPref === 'any') {
      remoteSignal = 0.7 // neutral high
    } else if (uPref === 'remote') {
      if (jType === 'remote') remoteSignal = 1.0
      else if (jType === 'hybrid') remoteSignal = 0.6
      else remoteSignal = 0.1 // soft-penalty remote mismatch onsite
    } else if (uPref === 'hybrid') {
      if (jType === 'hybrid') remoteSignal = 1.0
      else if (jType === 'remote') remoteSignal = 0.8
      else remoteSignal = 0.3
    } else if (uPref === 'onsite') {
      if (jType === 'onsite') remoteSignal = 1.0
      else if (jType === 'hybrid') remoteSignal = 0.7
      else remoteSignal = 0.5
    }

    // ─── SIGNAL 6: Freshness (7%) ──────────────────────────────────────────────
    const freshnessSignal = matchRecord.freshnessScore // Re-use freshness calculation

    // ─── COMPUTE OPPORTUNITY SCORE FORMULA ────────────────────────────────────
    const wMatch = weights.matchWeight ?? 0.3
    const wSalary = weights.salaryWeight ?? 0.25
    const wQuality = weights.companyQualityWeight ?? 0.2
    const wVelocity = weights.hiringVelocityWeight ?? 0.1
    const wRemote = weights.remoteWeight ?? 0.08
    const wFresh = weights.freshnessWeight ?? 0.07

    const computedScoreFloat =
      matchSignal * wMatch +
      salarySignal * wSalary +
      companyQualitySignal * wQuality +
      hiringVelocitySignal * wVelocity +
      remoteSignal * wRemote +
      freshnessSignal * wFresh

    const opportunityScore = Math.round(computedScoreFloat * 100)

    // Build template reasons
    const opportunityBoostReasons = ExplanationBuilder.buildOpportunityExplanation({
      salarySignal,
      companyQualitySignal,
      hiringVelocitySignal,
      remoteSignal,
      freshnessSignal,
      job,
      companyIntel,
      preferences: {
        salaryMin: salaryTarget,
        remotePreference: userPrefLoc,
      },
    })

    return {
      opportunityScore: Math.min(100, Math.max(0, opportunityScore)),
      salarySignal,
      companyQualitySignal,
      hiringVelocitySignal,
      remoteSignal,
      freshnessSignal,
      opportunityBoostReasons,
      weightsSnapshot: weights,
    }
  }
}
