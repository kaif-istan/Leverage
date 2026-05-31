import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { AtsPlatform } from '@job-hunter/shared'

@Injectable()
export class PlatformProbeService {
  private readonly logger = new Logger(PlatformProbeService.name)

  /**
   * Generates possible slug candidates for a company name.
   */
  generateSlugCandidates(name: string): string[] {
    const clean = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .trim()

    const withHyphens = clean.replace(/\s+/g, '-')
    const withNoSpaces = clean.replace(/\s+/g, '')

    const candidates = new Set<string>()
    candidates.add(withHyphens)
    candidates.add(withNoSpaces)

    // Common strip-off suffixes
    const suffixes = [
      '-inc',
      'inc',
      '-ltd',
      'ltd',
      '-co',
      'co',
      '-corp',
      'corp',
      '-software',
      'software',
      '-tech',
      'tech',
    ]
    for (const s of suffixes) {
      if (withHyphens.endsWith(s)) {
        candidates.add(withHyphens.slice(0, -s.length).replace(/-$/, ''))
      }
      if (withNoSpaces.endsWith(s)) {
        candidates.add(withNoSpaces.slice(0, -s.length))
      }
    }

    return Array.from(candidates).filter((c) => c.length > 1)
  }

  /**
   * Probes Greenhouse, Lever, and Ashby to verify if a slug exists.
   * Uses fast parallel HEAD requests.
   */
  async probe(
    name: string,
    websiteUrl?: string,
  ): Promise<{ platform: AtsPlatform; slug: string } | null> {
    const candidates = this.generateSlugCandidates(name)
    this.logger.log(`Probing slug candidates for ${name}: ${candidates.join(', ')}`)

    for (const slug of candidates) {
      const result = await this.probeSlug(slug)
      if (result) {
        return result
      }
    }

    // Career page crawl fallback if website is provided
    if (websiteUrl) {
      const fallback = await this.crawlCareerPage(websiteUrl)
      if (fallback) return fallback
    }

    return null
  }

  private async probeSlug(slug: string): Promise<{ platform: AtsPlatform; slug: string } | null> {
    try {
      // Greenhouse
      const ghRes = await axios.head(`https://boards.greenhouse.io/${slug}`, {
        validateStatus: (status: number) => status === 200,
        timeout: 4000,
      })
      if (ghRes.status === 200) {
        return { platform: 'greenhouse', slug }
      }
    } catch {}

    try {
      // Lever
      const leverRes = await axios.head(`https://jobs.lever.co/${slug}`, {
        validateStatus: (status: number) => status === 200,
        timeout: 4000,
      })
      if (leverRes.status === 200) {
        return { platform: 'lever', slug }
      }
    } catch {}

    try {
      // Ashby
      const ashbyRes = await axios.head(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
        validateStatus: (status: number) => status === 200,
        timeout: 4000,
      })
      if (ashbyRes.status === 200) {
        return { platform: 'ashby', slug }
      }
    } catch {}

    return null
  }

  private async crawlCareerPage(
    url: string,
  ): Promise<{ platform: AtsPlatform; slug: string } | null> {
    try {
      const targetUrl = url.startsWith('http') ? url : `https://${url}`
      const response = await axios.get(targetUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const html = response.data

      if (typeof html !== 'string') return null

      // Look for greenhouse links
      const ghMatch = html.match(/boards\.greenhouse\.io\/([a-zA-Z0-9_-]+)/)
      if (ghMatch && ghMatch[1]) {
        return { platform: 'greenhouse', slug: ghMatch[1] }
      }

      // Look for lever links
      const leverMatch = html.match(/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/)
      if (leverMatch && leverMatch[1]) {
        return { platform: 'lever', slug: leverMatch[1] }
      }

      // Look for ashby links
      const ashbyMatch = html.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/)
      if (ashbyMatch && ashbyMatch[1]) {
        return { platform: 'ashby', slug: ashbyMatch[1] }
      }
    } catch {}
    return null
  }
}
