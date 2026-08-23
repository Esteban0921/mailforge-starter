import { Injectable } from '@nestjs/common';

export interface HealthReport {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

/** Produces the health payload. Injectable so tests can mock the clock. */
@Injectable()
export class HealthService {
  getReport(now: Date = new Date()): HealthReport {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: now.toISOString(),
    };
  }
}
