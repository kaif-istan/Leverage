import { Injectable, Inject, Logger } from '@nestjs/common'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { jobs, companies, jobSources } from '../../../database/schema'
import { eq, and } from 'drizzle-orm'
import { CrawledJob } from '../adapters/greenhouse.adapter'
import { EmbeddingService } from './embedding.service'

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name)

  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Processes a crawled job through Stage 1 pipeline:
   * Deduplication -> Normalization -> Taxonomy Extraction -> Vector Embedding -> DB Insert.
   */
  async ingestJob(crawled: CrawledJob, companyId: string, sourceId: string) {
    try {
      // 1. Deduplication Check
      const [existing] = await this.db
        .select()
        .from(jobs)
        .where(and(eq(jobs.companyId, companyId), eq(jobs.externalId, crawled.externalId)))
        .limit(1)

      if (existing) {
        // Job already exists, let's skip to avoid duplicates
        return
      }

      // 2. Skill & Tech Extraction Heuristics (Regex matching)
      const { skills, techStack } = this.extractTaxonomyMatches(crawled.descriptionText)

      // 3. Seniority Detection Heuristic
      const seniority = this.detectSeniority(crawled.title)

      // 4. Generate local vector embedding
      this.logger.log(`Generating embedding for role: ${crawled.title}`)
      const textToEmbed = `Title: ${crawled.title}\nLocation: ${crawled.location}\nDescription: ${crawled.descriptionText}`
      const embedding = await this.embeddingService.getEmbedding(textToEmbed)

      // 5. Detect Remote/Onsite/Hybrid
      const locationType = this.detectLocationType(crawled.location, crawled.descriptionText)

      // 6. DB Ingestion
      await this.db.insert(jobs).values({
        companyId,
        sourceId,
        externalId: crawled.externalId,
        title: crawled.title,
        url: crawled.url,
        applyUrl: crawled.url,
        urlHash: crawled.url,
        fingerprintHash: crawled.externalId,
        location: crawled.location,
        locationType,
        descriptionRaw: crawled.descriptionHtml,
        descriptionText: crawled.descriptionText,
        requiredSkills: skills,
        skillsExtractedMethod: 'hybrid',
        seniorityLevel: seniority as any,
        seniorityDetectedMethod: 'rule_based',
        technologies: techStack,
        embedding, // Store 768 float array
        postedAt: crawled.postedAt,
        ingestionStage: 'embedded',
      })

      this.logger.log(`Successfully ingested job: ${crawled.title} (${crawled.location})`)
    } catch (err: any) {
      this.logger.error(`Failed to ingest job ${crawled.title}: ${err.message}`, err.stack)
    }
  }

  private extractTaxonomyMatches(text: string): { skills: string[]; techStack: string[] } {
    const raw = text.toLowerCase()

    // Core taxonomies mapped to regex matches
    const skillsList = [
      'typescript',
      'javascript',
      'python',
      'go',
      'golang',
      'rust',
      'c++',
      'c#',
      'java',
      'ruby',
      'react',
      'next.js',
      'nextjs',
      'vue',
      'angular',
      'nestjs',
      'express',
      'django',
      'fastapi',
      'postgresql',
      'postgres',
      'redis',
      'mongodb',
      'mysql',
      'elasticsearch',
      'cassandra',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
      'terraform',
      'ci/cd',
      'github actions',
      'langchain',
      'llamaindex',
      'rag',
      'openai',
      'llm',
      'vector databases',
      'graphql',
      'grpc',
    ]

    const foundSkills = new Set<string>()
    for (const skill of skillsList) {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (regex.test(raw)) {
        foundSkills.add(skill === 'golang' ? 'Go' : skill.charAt(0).toUpperCase() + skill.slice(1))
      }
    }

    return {
      skills: Array.from(foundSkills),
      techStack: Array.from(foundSkills), // MVP overlaps skills and tech
    }
  }

  private detectSeniority(
    title: string,
  ): 'junior' | 'mid' | 'senior' | 'staff' | 'lead' | 'manager' | 'unknown' {
    const raw = title.toLowerCase()
    if (raw.includes('staff') || raw.includes('principal') || raw.includes('architect'))
      return 'staff'
    if (raw.includes('manager') || raw.includes('director') || raw.includes('head'))
      return 'manager'
    if (raw.includes('lead') || raw.includes('tech lead')) return 'lead'
    if (raw.includes('senior') || raw.includes('sr.') || raw.includes('sr ')) return 'senior'
    if (
      raw.includes('junior') ||
      raw.includes('jr.') ||
      raw.includes('associate') ||
      raw.includes('intern')
    )
      return 'junior'
    if (raw.includes('ii') || raw.includes('iii') || raw.includes('2') || raw.includes('3'))
      return 'mid'
    return 'senior' // Default to senior for software engineer listings to be safe
  }

  private detectLocationType(
    location: string,
    text: string,
  ): 'remote' | 'hybrid' | 'onsite' | 'unknown' {
    const rawLoc = location.toLowerCase()
    const rawText = text.toLowerCase()

    if (rawLoc.includes('remote') || rawLoc.includes('anywhere') || rawLoc.includes('virtual'))
      return 'remote'
    if (rawLoc.includes('hybrid') || rawLoc.includes('flexible')) return 'hybrid'
    if (rawLoc.includes('onsite') || rawLoc.includes('office')) return 'onsite'

    // Look inside descriptions if location name is generic (e.g. "San Francisco, CA")
    if (
      rawText.includes('hybrid role') ||
      rawText.includes('hybrid work') ||
      rawText.includes('days a week in office')
    )
      return 'hybrid'
    if (
      rawText.includes('100% remote') ||
      rawText.includes('fully remote') ||
      rawText.includes('work from home')
    )
      return 'remote'

    return 'onsite'
  }
}
