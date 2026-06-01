import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { JobController } from './job.controller'
import { JobService } from './services/job.service'
import { MatchingService } from './services/matching.service'
import { OpportunityScoreService } from './services/opportunity-score.service'
import { JobRepository } from './repositories/job.repository'
import { JobMatchRepository } from './repositories/job-match.repository'

@Module({
  imports: [DatabaseModule],
  controllers: [JobController],
  providers: [
    JobService,
    MatchingService,
    OpportunityScoreService,
    JobRepository,
    JobMatchRepository,
  ],
  exports: [
    JobService,
    MatchingService,
    OpportunityScoreService,
    JobRepository,
    JobMatchRepository,
  ],
})
export class JobModule {}
