import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService, type HealthReport } from './health.service';

describe('HealthController (unit)', () => {
  it('returns the report produced by HealthService', async () => {
    const fixedReport: HealthReport = {
      status: 'ok',
      uptimeSeconds: 42,
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const mockService = { getReport: () => fixedReport };

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
    expect(controller.getHealth()).toEqual(fixedReport);
  });
});

describe('HealthService (unit)', () => {
  it('builds an ok report from the provided clock', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    const service = moduleRef.get(HealthService);
    const report = service.getReport(new Date('2026-08-22T12:00:00.000Z'));

    expect(report.status).toBe('ok');
    expect(report.timestamp).toBe('2026-08-22T12:00:00.000Z');
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
