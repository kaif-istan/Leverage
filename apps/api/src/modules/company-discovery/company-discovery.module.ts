import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { CompanyDiscoveryController } from './company-discovery.controller'
import { PlatformProbeService } from './services/platform-probe.service'
import { SeedLoaderService } from './services/seed-loader.service'
import { YcDiscoveryService } from './services/yc-discovery.service'
import { WellfoundDiscoveryService } from './services/wellfound-discovery.service'
import { CompanyDiscoveryOrchestrator } from './services/company-discovery.orchestrator'
import { ProbeWorker } from './workers/probe.worker'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'probe-queue',
    }),
  ],
  controllers: [CompanyDiscoveryController],
  providers: [
    PlatformProbeService,
    SeedLoaderService,
    YcDiscoveryService,
    WellfoundDiscoveryService,
    CompanyDiscoveryOrchestrator,
    ProbeWorker,
  ],
  exports: [
    PlatformProbeService,
    SeedLoaderService,
    CompanyDiscoveryOrchestrator,
  ],
})
export class CompanyDiscoveryModule {}
