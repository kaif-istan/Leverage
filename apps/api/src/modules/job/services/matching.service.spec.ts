import { Test, TestingModule } from '@nestjs/testing'
import { MatchingService } from './matching.service'
import { JobMatchRepository } from '../repositories/job-match.repository'
import { JobRepository } from '../repositories/job.repository'

describe('MatchingService', () => {
  let service: MatchingService
  let mockJobMatchRepo: any
  let mockJobRepo: any

  beforeEach(async () => {
    mockJobMatchRepo = {
      calculateSemanticScore: jest.fn().mockResolvedValue(0.85),
    }

    mockJobRepo = {
      findJobById: jest.fn().mockResolvedValue({
        id: 'job-123',
        title: 'Senior Software Engineer',
        companyId: 'company-abc',
        requiredSkills: ['React', 'Node.js', 'TypeScript'],
        preferredSkills: ['PostgreSQL'],
        technologies: ['React', 'TypeScript'],
        seniorityLevel: 'senior',
        locationType: 'remote',
        postedAt: new Date(),
        embedding: Array(768).fill(0.1),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: JobMatchRepository, useValue: mockJobMatchRepo },
        { provide: JobRepository, useValue: mockJobRepo },
      ],
    }).compile()

    service = module.get<MatchingService>(MatchingService)
  })

  it('should calculate complete hybrid match score correctly', async () => {
    const profile = {
      id: 'profile-xyz',
      skills: [{ name: 'React' }, { name: 'Node.js' }],
      technologies: ['TypeScript', 'GraphQL'],
      targetRoles: ['Senior Engineer'],
      totalYoe: 6,
      remotePreference: 'remote',
      embedding: Array(768).fill(0.1),
    }

    const result = await service.computeMatchScore('job-123', profile)

    expect(result).toBeDefined()
    expect(result.overallScore).toBeGreaterThan(0.5)
    expect(result.semanticScore).toBe(0.85)
    // React, Node.js, TypeScript are matched -> 3 out of 3 required (100% required)
    // PostgreSQL is not matched -> 0 out of 1 preferred (0% preferred)
    // React, TypeScript are matched -> 2 out of 2 tech (100% tech)
    // Keyword score = (1.0 * 0.7) + (0 * 0.15) + (1.0 * 0.15) = 0.85
    expect(result.keywordScore).toBeCloseTo(0.85, 2)
    // Seniority matches Senior target -> 100% (1.0)
    expect(result.seniorityScore).toBe(1.0)
    // Location matches Remote -> 100% (1.0)
    expect(result.locationScore).toBe(1.0)
    // Freshly posted -> 100% (1.0)
    expect(result.freshnessScore).toBe(1.0)
    expect(result.matchedSkills).toContain('React')
  })
})
