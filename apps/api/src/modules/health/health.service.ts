import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthReport {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
  database: 'ok' | 'error';
}

/** Produces the health payload. Injectable so tests can mock the clock/DB. */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(now: Date = new Date()): Promise<HealthReport> {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: now.toISOString(),
      database: await this.checkDatabase(),
    };
  }

  /** Never throws: a down database degrades the report, not the endpoint. */
  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
