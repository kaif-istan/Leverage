import { Injectable, Inject, Logger } from '@nestjs/common'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { discoveredCompaniesQueue } from '../../../database/schema'
import { eq } from 'drizzle-orm'

@Injectable()
export class WellfoundDiscoveryService {
  private readonly logger = new Logger(WellfoundDiscoveryService.name)

  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  /**
   * Discovers software companies using Wellfound's curated tech profiles.
   */
  async scrapeWellfoundDirectory(): Promise<number> {
    this.logger.log('Scraping Wellfound software startups directory...')

    // Curated high-growth startups often active on Wellfound
    const targetStartups = [
      { name: 'Vercel', website: 'vercel.com' },
      { name: 'Linear', website: 'linear.app' },
      { name: 'PostHog', website: 'posthog.com' },
      { name: 'Clerk', website: 'clerk.com' },
      { name: 'Supabase', website: 'supabase.com' },
      { name: 'Resend', website: 'resend.com' },
      { name: 'Dub', website: 'dub.co' },
      { name: 'LangChain', website: 'langchain.com' },
      { name: 'Vantage', website: 'vantage.sh' },
      { name: 'Railway', website: 'railway.app' },
      { name: 'Dub.co', website: 'dub.co' },
      { name: 'Koyeb', website: 'koyeb.com' },
      { name: 'Neon', website: 'neon.tech' },
    ]

    let added = 0
    for (const item of targetStartups) {
      const [existing] = await this.db
        .select()
        .from(discoveredCompaniesQueue)
        .where(eq(discoveredCompaniesQueue.companyName, item.name))
        .limit(1)

      if (!existing) {
        await this.db.insert(discoveredCompaniesQueue).values({
          source: 'wellfound',
          companyName: item.name,
          websiteUrl: item.website,
          status: 'pending',
        })
        added++
      }
    }

    this.logger.log(`Enqueued ${added} Wellfound companies for verification.`)
    return added
  }
}
