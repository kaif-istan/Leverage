import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { CrawledJob } from './greenhouse.adapter'

@Injectable()
export class AshbyAdapter {
  private readonly logger = new Logger(AshbyAdapter.name)

  /**
   * Fetches all active jobs for a given Ashby slug.
   */
  async fetchJobs(slug: string): Promise<CrawledJob[]> {
    this.logger.log(`Fetching jobs from Ashby for slug: ${slug}`)
    const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`

    try {
      const response = await axios.get(url, { timeout: 10000 })
      const jobs = response.data.jobs || []

      this.logger.log(`Successfully fetched ${jobs.length} Ashby jobs for ${slug}`)

      return jobs.map((job: any) => {
        const cleanText = (job.descriptionHtml || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        return {
          externalId: String(job.id),
          title: job.title || 'Untitled Role',
          url: job.jobUrl || `https://jobs.ashbyhq.com/${slug}/${job.id}`,
          location: job.location || 'Onsite / Remote',
          descriptionHtml: job.descriptionHtml || '',
          descriptionText: cleanText,
          postedAt: job.publishedAt ? new Date(job.publishedAt) : new Date(),
          rawPayload: job,
        }
      })
    } catch (err: any) {
      this.logger.error(`Failed to fetch Ashby jobs for ${slug}: ${err.message}`)
      return []
    }
  }
}
