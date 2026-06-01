import { Test, TestingModule } from '@nestjs/testing'
import { OpportunityScoreService } from './opportunity-score.service'
import { JobRepository } from '../repositories/job.repository'
import { JobMatchRepository } from '../repositories/job-match.repository'
import { DRIZZLE_TOKEN } from '../../../database/database.module'

describe('OpportunityScoreService', () => {
  let service: OpportunityScoreService
  let mockJobRepo: any
  let mockJobMatchRepo: any
  let mockDb: any

  beforeEach(async () => {
    mockJobRepo = {
      findJobById: jest.fn().mockResolvedValue({
        id: 'job-123',
        companyId: 'company-abc',
        locationType: 'remote',
        salaryMin: 120000,
        salaryMax: 150000,
      }),
    }

    mockJobMatchRepo = {
      findMatch: jest.fn().mockResolvedValue({
        overallScore: 0.8,
        freshnessScore: 0.9,
      }),
    }

    mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                glassdoorRating: 4.5,
                fundingStage: 'series_b',
                employeeCount: 150,
                hiringVelocity: 'growing',
              },
            ]),
          }),
        }),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunityScoreService,
        { provide: DRIZZLE_TOKEN, useValue: mockDb },
        { provide: JobRepository, useValue: mockJobRepo },
        { provide: JobMatchRepository, useValue: mockJobMatchRepo },
      ],
    }).compile()

    service = module.get<OpportunityScoreService>(OpportunityScoreService)
  })

  it('should calculate complete weighted Opportunity Score correctly', async () => {
    const profile = {
      id: 'profile-xyz',
      userId: 'user-789',
      salaryMin: 100000,
      remotePreference: 'remote',
    }

    const result = await service.computeOpportunityScore('job-123', profile)

    expect(result).toBeDefined()
    expect(result.opportunityScore).toBeGreaterThan(0)
    expect(result.opportunityScore).toBeLessThanOrEqual(100)

    // Check signals
    expect(result.salarySignal).toBeGreaterThan(0.5) // midpoint 135k vs target 100k
    expect(result.companyQualitySignal).toBeGreaterThan(0.5) // Series B, 4.5 star, 150 employees
    expect(result.hiringVelocitySignal).toBe(1.0) // growing
    expect(result.remoteSignal).toBe(1.0) // Remote matches Remote
    expect(result.opportunityBoostReasons.length).toBeGreaterThan(0)
  })
})
