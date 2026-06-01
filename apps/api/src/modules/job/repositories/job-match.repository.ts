import { Injectable, Inject } from '@nestjs/common'
import { eq, and, sql } from 'drizzle-orm'
import { DRIZZLE_TOKEN, type DrizzleDB } from '../../../database/database.module'
import { jobMatches, jobs, candidateProfiles } from '../../../database/schema'

@Injectable()
export class JobMatchRepository {
  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  /**
   * Calculates the cosine similarity score between a job description embedding
   * and a candidate profile embedding using pgvector (1 - (embedding <=> target)).
   */
  async calculateSemanticScore(jobId: string, profileEmbedding: number[]): Promise<number> {
    const vectorParam = JSON.stringify(profileEmbedding)

    const [result] = await this.db
      .select({
        score: sql<number>`1 - (${jobs.embedding} <=> ${vectorParam}::vector)`,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1)

    // Fallback if no embedding exists
    return result?.score !== undefined && !isNaN(result.score) ? Math.max(0, result.score) : 0
  }

  /**
   * Finds an existing match record by job and profile IDs.
   */
  async findMatch(jobId: string, profileId: string) {
    const [match] = await this.db
      .select()
      .from(jobMatches)
      .where(and(eq(jobMatches.jobId, jobId), eq(jobMatches.profileId, profileId)))
      .limit(1)
    return match || null
  }

  /**
   * Upserts the job match record.
   */
  async upsertMatch(values: typeof jobMatches.$inferInsert) {
    const { jobId, profileId, ...fieldsToUpdate } = values

    await this.db
      .insert(jobMatches)
      .values(values)
      .onConflictDoUpdate({
        target: [jobMatches.jobId, jobMatches.profileId],
        set: fieldsToUpdate,
      })
  }

  /**
   * Recomputes the opportunity rank globally for a given profile ID.
   * Leverages a highly optimized window function (ROW_NUMBER) in a single query.
   */
  async recomputeGlobalRanks(profileId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Step 1: Recalculate rank based on row_number in a CTE
      // We partition by profile_id to keep user lists isolated
      await tx.execute(sql`
        WITH RankedMatches AS (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY profile_id 
            ORDER BY opportunity_score DESC
          ) as new_rank
          FROM ${jobMatches}
          WHERE profile_id = ${profileId}::uuid
        )
        UPDATE ${jobMatches}
        SET opportunity_rank = RankedMatches.new_rank
        FROM RankedMatches
        WHERE ${jobMatches}.id = RankedMatches.id AND ${jobMatches}.profile_id = ${profileId}::uuid
      `)
    })
  }

  /**
   * Retrieves all calculated matches for a profile.
   */
  async findAllMatchesForProfile(profileId: string) {
    return this.db.select().from(jobMatches).where(eq(jobMatches.profileId, profileId))
  }
}
