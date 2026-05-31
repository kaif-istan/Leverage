import { Injectable, Inject, Logger } from '@nestjs/common'
import axios from 'axios'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { discoveredCompaniesQueue } from '../../../database/schema'
import { eq } from 'drizzle-orm'

@Injectable()
export class YcDiscoveryService {
  private readonly logger = new Logger(YcDiscoveryService.name)

  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  /**
   * Scrapes YC Company Directory using Algolia search index.
   * YCombinator's search directory runs on public Algolia index.
   */
  async scrapeYCDirectory(limit = 100): Promise<number> {
    this.logger.log(`Fetching active YC software startups from Algolia index...`)

    try {
      // YC Algolia Search Credentials
      const appId = 'OT9ZPU48NV'
      const apiKey = '669a847f8484501258a156ccfe788bc5'
      const indexName = 'Company'

      const url = `https://${appId}-dsn.algolia.net/1/indexes/${indexName}/query`

      const payload = {
        params: new URLSearchParams({
          hitsPerPage: String(limit),
          filters: 'status:"Active" AND (industry:"Software" OR industry:"Technology")',
          query: '',
        }).toString(),
      }

      const response = await axios.post(url, payload, {
        headers: {
          'X-Algolia-API-Key': apiKey,
          'X-Algolia-Application-Id': appId,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      const hits = response.data.hits || []
      this.logger.log(`Found ${hits.length} YC company results from Algolia search.`)

      let added = 0
      for (const company of hits) {
        const name = company.name
        const website = company.website || ''

        // Skip empty names
        if (!name) continue

        // Check if already in queue or database
        const [existing] = await this.db
          .select()
          .from(discoveredCompaniesQueue)
          .where(eq(discoveredCompaniesQueue.companyName, name))
          .limit(1)

        if (!existing) {
          await this.db.insert(discoveredCompaniesQueue).values({
            source: 'yc_directory',
            companyName: name,
            websiteUrl: website,
            status: 'pending',
            rawData: company,
          })
          added++
        }
      }

      this.logger.log(`Enqueued ${added} new discovered YC companies for platform verification.`)
      return added
    } catch (err: any) {
      this.logger.error(`Algolia YC scraping failed: ${err.message}`, err.stack)
      return 0
    }
  }
}
