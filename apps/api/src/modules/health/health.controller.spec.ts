import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService, type HealthReport } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController (unit)', () => {
  it('returns the report produced by HealthService', async () => {
    const fixedReport: HealthReport = {
      status: 'ok',
      uptimeSeconds: 42,
      timestamp: '2026-01-01T00:00:00.000Z',
      database: 'ok',
    };
    const mockService = { getReport: async () => fixedReport };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    })
      .useMocker((token) => {
        if (token === HealthService) {
          return mockService;
        }
        return {};
      })
      .compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.getHealth()).resolves.toEqual(fixedReport);
  });
});

describe('HealthService (unit)', () => {
  async function buildService(prisma: Partial<PrismaService>): Promise<HealthService> {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return moduleRef.get(HealthService);
  }

  it('builds an ok report from the provided clock when the database answers', async () => {
    const service = await buildService({ $queryRaw: async () => [{ '?column?': 1 }] });

    const report = await service.getReport(new Date('2026-08-22T12:00:00.000Z'));

    expect(report.status).toBe('ok');
    expect(report.timestamp).toBe('2026-08-22T12:00:00.000Z');
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(report.database).toBe('ok');
  });

  it('reports database: error instead of throwing when the query fails', async () => {
    const service = await buildService({
      $queryRaw: async () => {
        throw new Error('connection refused');
      },
    });

    const report = await service.getReport();

    expect(report.status).toBe('ok');
    expect(report.database).toBe('error');
  });
});
