import { Controller, Get } from '@nestjs/common'
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    // Basic liveness check. Later we can add database, redis, and ollama checks if needed.
    return this.health.check([])
  }
}
