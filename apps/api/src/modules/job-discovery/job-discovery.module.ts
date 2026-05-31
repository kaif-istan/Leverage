import { Module } from '@nestjs/common'
import { JobDiscoveryController } from './job-discovery.controller'
import { GreenhouseAdapter } from './adapters/greenhouse.adapter'
import { LeverAdapter } from './adapters/lever.adapter'
import { AshbyAdapter } from './adapters/ashby.adapter'
import { EmbeddingService } from './services/embedding.service'
import { IngestionService } from './services/ingestion.service'
import { ScraperOrchestrator } from './services/scraper-orchestrator.service'

@Module({
  controllers: [JobDiscoveryController],
  providers: [
    GreenhouseAdapter,
    LeverAdapter,
    AshbyAdapter,
    EmbeddingService,
    IngestionService,
    ScraperOrchestrator,
  ],
  exports: [EmbeddingService, IngestionService, ScraperOrchestrator],
})
export class JobDiscoveryModule {}
