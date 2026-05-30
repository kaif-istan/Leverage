import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

export interface CrawledJob {
  externalId: string
  title: string
  url: string
  location: string
  descriptionHtml: string
  descriptionText: string
  postedAt: Date
  rawPayload: any
}

@Injectable()
export class GreenhouseAdapter {
  private readonly logger = new Logger(GreenhouseAdapter.name)

  /**
   * Fetches all active jobs for a given Greenhouse slug.
   */
  async fetchJobs(slug: string): Promise<CrawledJob[]> {
    this.logger.log(`Fetching jobs from Greenhouse for slug: ${slug}`)
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`

    try {
      const response = await axios.get(url, { timeout: 10000 })
      const jobs = response.data.jobs || []

      this.logger.log(`Successfully fetched ${jobs.length} Greenhouse jobs for ${slug}`)

      return jobs.map((job: any) => {
        // Strip HTML tags helper for fallback
        const cleanText = (job.content || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        return {
          externalId: String(job.id),
          title: job.title || 'Untitled Role',
          url: `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
          location: job.location?.name || 'Onsite / Remote',
          descriptionHtml: job.content || '',
          descriptionText: cleanText,
          postedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
          rawPayload: job,
        }
      })
    } catch (err: any) {
      this.logger.error(`Failed to fetch Greenhouse jobs for ${slug}: ${err.message}`)
      return []
    }
  }
}
