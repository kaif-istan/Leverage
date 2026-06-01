import { Injectable, Logger } from '@nestjs/common'
import { JobMatchRepository } from '../repositories/job-match.repository'
import { JobRepository } from '../repositories/job.repository'
import { LocationType, SeniorityLevel } from '@job-hunter/shared'

// Seniority ranking mapping for distance calculations
const SENIORITY_RANKS: Record<string, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  director: 5,
  unknown: -1,
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name)

  constructor(
    private readonly jobMatchRepo: JobMatchRepository,
    private readonly jobRepo: JobRepository,
  ) {}

  /**
   * Evaluates the hybrid matching metrics for a candidate profile against a job.
   */
  async computeMatchScore(jobId: string, profile: any): Promise<any> {
    const job = await this.jobRepo.findJobById(jobId)
    if (!job) {
      this.logger.warn(`Cannot match. Job ${jobId} not found.`)
      return null
    }

    // 1. Semantic Match (60% weight)
    let semanticScore = 0.5
    if (profile.embedding && job.embedding) {
      semanticScore = await this.jobMatchRepo.calculateSemanticScore(job.id, profile.embedding)
    }

    // 2. Keyword Match (40% weight)
    const { keywordScore, matchedSkills, missingRequiredSkills, missingPreferredSkills } =
      this.calculateKeywordMatch(job, profile)

    // Composite Match Score
    const overallScore = semanticScore * 0.6 + keywordScore * 0.4

    // 3. Seniority Score (0-1)
    const seniorityScore = this.calculateSeniorityScore(
      job.seniorityLevel,
      profile.targetRoles,
      profile.totalYoe,
    )

    // 4. Location Score (0-1)
    const locationScore = this.calculateLocationScore(
      job.locationType,
      profile.remotePreference || 'any',
    )

    // 5. Freshness Score (0-1)
    const freshnessScore = this.calculateFreshnessScore(job.postedAt || job.scrapedAt)

    // Match Reasons Template list
    const matchReasons = [
      {
        factor: 'Semantic Match',
        score: Math.round(semanticScore * 100),
        description:
          semanticScore >= 0.85
            ? 'Exceptional career trajectory & description semantic alignment.'
            : semanticScore >= 0.7
              ? 'Strong functional equivalence to your profile qualifications.'
              : 'Moderate alignment to your professional background.',
      },
      {
        factor: 'Keyword Match',
        score: Math.round(keywordScore * 100),
        description: `Matched ${matchedSkills.length} technical skills / technologies.`,
      },
      {
        factor: 'Seniority Check',
        score: Math.round(seniorityScore * 100),
        description:
          seniorityScore >= 0.9
            ? 'Matches your target seniority specifications.'
            : 'Slight seniority rank variance relative to your profile.',
      },
    ]

    return {
      overallScore,
      semanticScore,
      keywordScore,
      seniorityScore,
      locationScore,
      freshnessScore,
      matchedSkills,
      missingRequiredSkills,
      missingPreferredSkills,
      matchReasons,
    }
  }

  /**
   * Performs set intersection between candidate skills and job skill requirements.
   */
  private calculateKeywordMatch(job: any, profile: any) {
    const candidateSkills: string[] = (profile.skills || []).map((s: any) =>
      typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase(),
    )
    const candidateTech: string[] = (profile.technologies || []).map((t: string) => t.toLowerCase())

    // Combine into lowercase set
    const candidateSet = new Set([...candidateSkills, ...candidateTech])

    const jobRequired = (job.requiredSkills || []).map((s: string) => s.toLowerCase())
    const jobPreferred = (job.preferredSkills || []).map((s: string) => s.toLowerCase())
    const jobTech = (job.technologies || []).map((t: string) => t.toLowerCase())

    const matchedRequired = (job.requiredSkills || []).filter((s: string) =>
      candidateSet.has(s.toLowerCase()),
    )
    const matchedPreferred = (job.preferredSkills || []).filter((s: string) =>
      candidateSet.has(s.toLowerCase()),
    )
    const matchedTech = (job.technologies || []).filter((t: string) =>
      candidateSet.has(t.toLowerCase()),
    )

    const missingRequired = (job.requiredSkills || []).filter(
      (s: string) => !candidateSet.has(s.toLowerCase()),
    )
    const missingPreferred = (job.preferredSkills || []).filter(
      (s: string) => !candidateSet.has(s.toLowerCase()),
    )

    const requiredScore = jobRequired.length > 0 ? matchedRequired.length / jobRequired.length : 1.0
    const preferredScore =
      jobPreferred.length > 0 ? matchedPreferred.length / jobPreferred.length : 1.0
    const techScore = jobTech.length > 0 ? matchedTech.length / jobTech.length : 1.0

    // Weighted keyword calculation (70% required skills, 15% preferred skills, 15% tech stack overlap)
    const keywordScore = requiredScore * 0.7 + preferredScore * 0.15 + techScore * 0.15

    return {
      keywordScore: Math.min(1.0, Math.max(0.0, keywordScore)),
      matchedSkills: Array.from(new Set([...matchedRequired, ...matchedPreferred, ...matchedTech])),
      missingRequiredSkills: missingRequired,
      missingPreferredSkills: missingPreferred,
    }
  }

  /**
   * Calculates seniority fit score.
   */
  private calculateSeniorityScore(
    jobLevel: string | null | undefined,
    targetRoles: string[] | null | undefined,
    yoe: number | null | undefined,
  ): number {
    const levelKey = (jobLevel || '').toLowerCase()
    const jobRank =
      SENIORITY_RANKS[levelKey] !== undefined
        ? SENIORITY_RANKS[levelKey]!
        : SENIORITY_RANKS.unknown!
    const years = yoe || 0

    // Fallback: estimate candidate rank based on years of experience
    let candidateRank = SENIORITY_RANKS.mid!
    if (years < 2) candidateRank = SENIORITY_RANKS.junior!
    else if (years >= 8) candidateRank = SENIORITY_RANKS.staff!
    else if (years >= 5) candidateRank = SENIORITY_RANKS.senior!

    // Also look at target roles to see if candidate targets senior
    const roles = targetRoles || []
    const lowercaseRoles = roles.map((r) => r.toLowerCase())
    if (lowercaseRoles.some((r) => r.includes('lead') || r.includes('manager'))) {
      candidateRank = Math.max(candidateRank, SENIORITY_RANKS.staff!)
    }

    if (jobRank === -1 || candidateRank === -1) {
      return 0.5 // neutral
    }

    const diff = Math.abs(jobRank - candidateRank)
    // 0.3 penalty per level difference, capped at 0.9 max penalty
    return Math.max(0.1, 1.0 - diff * 0.3)
  }

  /**
   * Calculates location fit score.
   */
  private calculateLocationScore(jobLocType: string, pref: string): number {
    const jobType = jobLocType.toLowerCase()
    const preference = pref.toLowerCase()

    if (preference === 'any') return 1.0

    if (preference === 'remote') {
      if (jobType === 'remote') return 1.0
      if (jobType === 'hybrid') return 0.5
      return 0.0 // onsite gets 0
    }

    if (preference === 'hybrid') {
      if (jobType === 'hybrid') return 1.0
      if (jobType === 'remote') return 0.7
      return 0.3
    }

    if (preference === 'onsite') {
      if (jobType === 'onsite') return 1.0
      if (jobType === 'hybrid') return 0.6
      return 0.2
    }

    return 0.5
  }

  /**
   * Calculates freshness score.
   */
  private calculateFreshnessScore(datePosted: Date | null): number {
    if (!datePosted) return 0.5

    const diffMs = Date.now() - new Date(datePosted).getTime()
    const hours = diffMs / (1000 * 60 * 60)

    if (hours <= 24) return 1.0
    if (hours <= 72) return 0.8
    if (hours <= 168) return 0.6 // 7 days
    if (hours <= 336) return 0.4 // 14 days
    return 0.2
  }
}
