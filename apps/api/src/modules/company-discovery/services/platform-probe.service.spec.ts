import { Test, TestingModule } from '@nestjs/testing'
import { PlatformProbeService } from './platform-probe.service'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('PlatformProbeService', () => {
  let service: PlatformProbeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformProbeService],
    }).compile()

    service = module.get<PlatformProbeService>(PlatformProbeService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('generateSlugCandidates', () => {
    it('should normalize and clean company name slug variations', () => {
      const candidates = service.generateSlugCandidates('Rippling, Inc.')
      expect(candidates).toContain('rippling')
      expect(candidates).toContain('rippling-inc')
      expect(candidates).toContain('ripplinginc')
    })

    it('should strip common business entity suffixes', () => {
      const candidates = service.generateSlugCandidates('Stripe Ltd.')
      expect(candidates).toContain('stripe')
    })
  })

  describe('probeSlug', () => {
    it('should confirm Greenhouse ATS platform if boards URL returns 200', async () => {
      mockedAxios.head.mockResolvedValueOnce({ status: 200 }) // Greenhouse HEAD succeeds
      
      const result = await service.probe('Stripe')
      expect(result).not.toBeNull()
      expect(result?.platform).toBe('greenhouse')
      expect(result?.slug).toBe('stripe')
      expect(mockedAxios.head).toHaveBeenCalledWith(
        'https://boards.greenhouse.io/stripe',
        expect.any(Object)
      )
    })

    it('should fallback to Lever if Greenhouse returns error and Lever returns 200', async () => {
      mockedAxios.head
        .mockRejectedValueOnce(new Error('Greenhouse 404')) // Greenhouse fails
        .mockResolvedValueOnce({ status: 200 }) // Lever succeeds

      const result = await service.probe('Ramp')
      expect(result).not.toBeNull()
      expect(result?.platform).toBe('lever')
      expect(result?.slug).toBe('ramp')
    })

    it('should return null if all ATS platforms return 404s', async () => {
      mockedAxios.head.mockRejectedValue(new Error('ATS Not Found'))

      const result = await service.probe('UnknownTech')
      expect(result).toBeNull()
    })
  })
})
