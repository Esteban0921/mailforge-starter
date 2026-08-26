import { Controller, Get } from '@nestjs/common';
import { API_ROUTES } from '@mailforge/shared';
import { HealthService, type HealthReport } from './health.service';

@Controller(API_ROUTES.health)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthReport> {
    return this.healthService.getReport();
  }
}
