import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { DRIZZLE_TOKEN } from '../../database/database.module'
import * as bcrypt from 'bcryptjs'

jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

const mockDrizzle = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => []),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  onConflictDoNothing: jest.fn().mockReturnThis(),
  returning: jest
    .fn()
    .mockResolvedValue([{ id: 'mock-user-uuid', email: 'test@user.com', name: 'Test User' }]),
}

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token-string'),
}

const mockConfigService = {
  get: jest.fn((key: string, fallback?: any) => fallback),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DRIZZLE_TOKEN, useValue: mockDrizzle },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('validateUser', () => {
    it('should return null if user email does not exist in DB', async () => {
      mockDrizzle.limit.mockResolvedValueOnce([]) // No user returned

      const result = await service.validateUser('unknown@user.com', 'password123')
      expect(result).toBeNull()
    })

    it('should return null if password compare fails', async () => {
      mockDrizzle.limit.mockResolvedValueOnce([
        { id: 'user-id', email: 'test@user.com', passwordHash: 'hashed-pwd' },
      ])
      mockedBcrypt.compare.mockImplementationOnce(() => Promise.resolve(false)) // pwd mismatch

      const result = await service.validateUser('test@user.com', 'wrongpassword')
      expect(result).toBeNull()
    })

    it('should return user record if password matches successfully', async () => {
      const userRecord = {
        id: 'user-id',
        email: 'test@user.com',
        passwordHash: 'hashed-pwd',
        name: 'Test User',
      }
      mockDrizzle.limit.mockResolvedValueOnce([userRecord])
      mockedBcrypt.compare.mockImplementationOnce(() => Promise.resolve(true)) // correct pwd

      const result = await service.validateUser('test@user.com', 'correctpassword')
      expect(result).not.toBeNull()
      expect(result?.id).toBe(userRecord.id)
    })
  })

  describe('login', () => {
    it('should sign jwt payload and return clean LoginResponse object', async () => {
      const result = await service.login('user-id', 'test@user.com', 'Test User')

      expect(result.accessToken).toBe('mock-jwt-token-string')
      expect(result.user.id).toBe('user-id')
      expect(result.user.email).toBe('test@user.com')
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'test@user.com',
      })
    })
  })
})
