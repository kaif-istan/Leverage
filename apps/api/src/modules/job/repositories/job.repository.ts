import { Injectable, Inject } from '@nestjs/common'
import { eq, and, or, ilike, sql, desc, asc, count } from 'drizzle-orm'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import {
  jobs,
  companies,
  jobMatches,
  companyIntelligence,
  candidateProfiles,
  userPreferences,
} from '../../../database/schema'
import { JobSummary, JobDetail, LocationType, SeniorityLevel } from '@job-hunter/shared'

export interface FindJobsOptions {
  page: number
  limit: number
  search?: string | undefined
  locationType?: string | undefined
  seniority?: string | undefined
  sort?: string | undefined
  profileId: string
}

@Injectable()
export class JobRepository {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  /**
   * Finds a candidate's profile by userId.
   */
  async findProfileByUserId(userId: string) {
    const [profile] = await this.db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1)
    return profile || null
  }

  /**
   * Finds user preferences by userId.
   */
  async findPreferencesByUserId(userId: string) {
    const [prefs] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
    return prefs || null
  }

  /**
   * Updates or seeds user preferences.
   */
  async updatePreferences(
    userId: string,
    data: {
      opportunityWeights: any
      salaryMin: number
      remotePreference: any
    },
  ) {
    await this.db
      .insert(userPreferences)
      .values({
        userId,
        opportunityWeights: data.opportunityWeights,
        salaryMin: data.salaryMin,
        remotePreference: data.remotePreference,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          opportunityWeights: data.opportunityWeights,
          salaryMin: data.salaryMin,
          remotePreference: data.remotePreference,
          updatedAt: new Date(),
        },
      })
  }

  /**
   * Finds paginated, filtered, and sorted jobs for a candidate profile.
   */
  async findJobs(options: FindJobsOptions): Promise<{ data: any[]; total: number }> {
    const { page, limit, search, locationType, seniority, sort, profileId } = options
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = [eq(jobs.isActive, true), eq(jobs.isDuplicate, false)]

    if (locationType) {
      conditions.push(eq(jobs.locationType, locationType as any))
    }

    if (seniority) {
      conditions.push(eq(jobs.seniorityLevel, seniority as any))
    }

    if (search) {
      conditions.push(
        or(
          ilike(jobs.title, `%${search}%`),
          ilike(jobs.location, `%${search}%`),
          sql`${jobs.requiredSkills}::text ILIKE ${`%${search}%`}`,
          sql`${jobs.technologies}::text ILIKE ${`%${search}%`}`,
        ) as any,
      )
    }

    const whereClause = and(...conditions)

    // Subquery or count check
    const [countResult] = await this.db.select({ value: count() }).from(jobs).where(whereClause)

    const total = countResult?.value || 0

    // Build query with joins
    const baseQuery = this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        locationType: jobs.locationType,
        seniorityLevel: jobs.seniorityLevel,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        postedAt: jobs.postedAt,
        scrapedAt: jobs.scrapedAt,
        isActive: jobs.isActive,
        applyUrl: jobs.applyUrl,
        requiredSkills: jobs.requiredSkills,
        technologies: jobs.technologies,
        // Match details
        matchScore: jobMatches.overallScore,
        opportunityScore: jobMatches.opportunityScore,
        opportunityRank: jobMatches.opportunityRank,
        // Company
        company: {
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          domain: companies.domain,
          hqLocation: companies.hqLocation,
          atsPlatform: companies.atsPlatform,
        },
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(jobMatches, and(eq(jobs.id, jobMatches.jobId), eq(jobMatches.profileId, profileId)))
      .where(whereClause)

    // Sorting
    let orderByClause = desc(jobMatches.opportunityScore) // default

    if (sort === 'overallScore') {
      orderByClause = desc(jobMatches.overallScore)
    } else if (sort === 'postedAt') {
      orderByClause = desc(jobs.postedAt)
    } else if (sort === 'salary') {
      orderByClause = desc(jobs.salaryMax)
    } else if (sort === 'opportunityRank') {
      orderByClause = asc(jobMatches.opportunityRank)
    }

    const data = await baseQuery
      .orderBy(orderByClause, desc(jobs.postedAt))
      .limit(limit)
      .offset(offset)

    return {
      data,
      total,
    }
  }

  /**
   * Fetches full job detail along with company intelligence and match metrics.
   */
  async findJobDetail(id: string, profileId: string): Promise<any | null> {
    const [result] = await this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        descriptionText: jobs.descriptionText,
        descriptionStructured: jobs.descriptionStructured,
        location: jobs.location,
        locationType: jobs.locationType,
        employmentType: jobs.employmentType,
        seniorityLevel: jobs.seniorityLevel,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        requiredSkills: jobs.requiredSkills,
        preferredSkills: jobs.preferredSkills,
        technologies: jobs.technologies,
        yearsExperienceRequired: jobs.yearsExperienceRequired,
        applyUrl: jobs.applyUrl,
        postedAt: jobs.postedAt,
        scrapedAt: jobs.scrapedAt,
        isActive: jobs.isActive,
        // Match metrics
        matchDetail: {
          id: jobMatches.id,
          overallScore: jobMatches.overallScore,
          semanticScore: jobMatches.semanticScore,
          keywordScore: jobMatches.keywordScore,
          seniorityScore: jobMatches.seniorityScore,
          locationScore: jobMatches.locationScore,
          freshnessScore: jobMatches.freshnessScore,
          opportunityScore: jobMatches.opportunityScore,
          opportunityRank: jobMatches.opportunityRank,
          salarySignal: jobMatches.salarySignal,
          companyQualitySignal: jobMatches.companyQualitySignal,
          hiringVelocitySignal: jobMatches.hiringVelocitySignal,
          remoteSignal: jobMatches.remoteSignal,
          freshnessSignal: jobMatches.freshnessSignal,
          matchedSkills: jobMatches.matchedSkills,
          missingRequiredSkills: jobMatches.missingRequiredSkills,
          missingPreferredSkills: jobMatches.missingPreferredSkills,
          matchReasons: jobMatches.matchReasons,
          opportunityBoostReasons: jobMatches.opportunityBoostReasons,
          salaryEstimateMin: jobMatches.salaryEstimateMin,
          salaryEstimateMax: jobMatches.salaryEstimateMax,
        },
        // Company
        company: {
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          domain: companies.domain,
          hqLocation: companies.hqLocation,
          atsPlatform: companies.atsPlatform,
        },
        // Company Intelligence
        companyIntelligence: {
          employeeCount: companyIntelligence.employeeCount,
          employeeCountRange: companyIntelligence.employeeCountRange,
          fundingStage: companyIntelligence.fundingStage,
          totalFundingUsd: companyIntelligence.totalFundingUsd,
          glassdoorRating: companyIntelligence.glassdoorRating,
          hiringVelocity: companyIntelligence.hiringVelocity,
          jobsPosted30d: companyIntelligence.jobsPosted30d,
          techStack: companyIntelligence.techStack,
          enrichmentQualityScore: companyIntelligence.enrichmentQualityScore,
        },
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(jobMatches, and(eq(jobs.id, jobMatches.jobId), eq(jobMatches.profileId, profileId)))
      .leftJoin(companyIntelligence, eq(companies.id, companyIntelligence.companyId))
      .where(eq(jobs.id, id))
      .limit(1)

    return result || null
  }

  /**
   * Fetches basic job record by ID.
   */
  async findJobById(jobId: string) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1)
    return job || null
  }

  /**
   * Gets all active jobs to populate rankings.
   */
  async findActiveJobIds(): Promise<string[]> {
    const results = await this.db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.isActive, true), eq(jobs.isDuplicate, false)))
    return results.map((r) => r.id)
  }
}
