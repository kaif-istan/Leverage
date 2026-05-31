import { Test, TestingModule } from '@nestjs/testing'
import { IngestionService } from './ingestion.service'
import { EmbeddingService } from './embedding.service'
import { DRIZZLE_TOKEN } from '../../../database/database.module'

const mockDrizzle = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => []),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue([{ id: 'mock-job-uuid' }]),
}

const mockEmbeddingService = {
  getEmbedding: jest.fn().mockResolvedValue(Array(768).fill(0.1)),
}

describe('IngestionService', () => {
  let service: IngestionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: DRIZZLE_TOKEN, useValue: mockDrizzle },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile()

    service = module.get<IngestionService>(IngestionService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('detectSeniority', () => {
    it('should identify staff/principal positions from role titles', () => {
      const staffTitle = service['detectSeniority']('Staff Software Architect')
      const principalTitle = service['detectSeniority']('Principal Platform Engineer')
      expect(staffTitle).toBe('staff')
      expect(principalTitle).toBe('staff')
    })

    it('should identify senior roles', () => {
      const seniorTitle = service['detectSeniority']('Senior Frontend Developer')
      const srTitle = service['detectSeniority']('Sr. Backend Engineer')
      expect(seniorTitle).toBe('senior')
      expect(srTitle).toBe('senior')
    })

    it('should identify junior positions', () => {
      const internTitle = service['detectSeniority']('Software Engineer Intern')
      const juniorTitle = service['detectSeniority']('Junior Developer')
      expect(internTitle).toBe('junior')
      expect(juniorTitle).toBe('junior')
    })
  })

  describe('detectLocationType', () => {
    it('should classify locations containing remote tags as remote', () => {
      const loc = service['detectLocationType']('Remote - US Only', 'Standard engineering post')
      expect(loc).toBe('remote')
    })

    it('should identify hybrid work schedules from descriptions', () => {
      const loc = service['detectLocationType'](
        'San Francisco, CA',
        'This role is hybrid, requiring 3 days a week in office',
      )
      expect(loc).toBe('hybrid')
    })
  })

  describe('extractTaxonomyMatches', () => {
    it('should successfully match skills in text against core taxonomy regexes', () => {
      const description =
        'We are looking for a Senior Developer experienced in TypeScript, React, PostgreSQL, and AWS.'
      const matches = service['extractTaxonomyMatches'](description)

      expect(matches.skills).toContain('Typescript')
      expect(matches.skills).toContain('React')
      expect(matches.skills).toContain('Postgresql')
      expect(matches.skills).toContain('Aws')
    })
  })
})
