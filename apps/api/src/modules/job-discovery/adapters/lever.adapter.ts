import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { CrawledJob } from './greenhouse.adapter'

@Injectable()
export class LeverAdapter {
  private readonly logger = new Logger(LeverAdapter.name)

  /**
   * Fetches all active jobs for a given Lever slug.
   */
  async fetchJobs(slug: string): Promise<CrawledJob[]> {
    this.logger.log(`Fetching jobs from Lever for slug: ${slug}`)
    const url = `https://api.lever.co/v0/postings/${slug}?mode=json`

    try {
      const response = await axios.get(url, { timeout: 10000 })
      const postings = Array.isArray(response.data) ? response.data : []

      this.logger.log(`Successfully fetched ${postings.length} Lever jobs for ${slug}`)

      return postings.map((post: any) => {
        // Lever structure: combines description, lists, and closing
        const htmlContent = [
          post.description || '',
          post.lists?.map((list: any) => `<h3>${list.text}</h3><ul>${list.content}</ul>`).join('') || '',
          post.additional || ''
        ].join('\n')

        const cleanText = htmlContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        return {
          externalId: String(post.id),
          title: post.text || 'Untitled Role',
          url: post.hostedUrl || `https://jobs.lever.co/${slug}/${post.id}`,
          location: post.categories?.location || 'Onsite / Remote',
          descriptionHtml: htmlContent,
          descriptionText: post.descriptionPlain || cleanText,
          postedAt: post.createdAt ? new Date(post.createdAt) : new Date(),
          rawPayload: post,
        }
      })
    } catch (err: any) {
      this.logger.error(`Failed to fetch Lever jobs for ${slug}: ${err.message}`)
      return []
    }
  }
}
