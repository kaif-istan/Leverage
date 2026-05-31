import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../database/database.module'
import { users, userPreferences } from '../../database/schema'
import type { JwtPayload, LoginResponse } from '@job-hunter/shared'

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user || !user.passwordHash) return null

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return null

    return user
  }

  async login(userId: string, email: string, name: string): Promise<LoginResponse> {
    const payload: JwtPayload = { sub: userId, email }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: { id: userId, email, name },
    }
  }

  async findUserById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    return user ?? null
  }

  async createInitialUser(email: string, password: string, name: string) {
    const passwordHash = await bcrypt.hash(password, 12)

    const [user] = await this.db.insert(users).values({ email, passwordHash, name }).returning()

    if (!user) throw new UnauthorizedException('User creation failed')

    // Create default preferences
    await this.db.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing()

    return user
  }
}
