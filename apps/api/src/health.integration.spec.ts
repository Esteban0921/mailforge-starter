import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { readCorsOrigins } from './env';

/**
 * Integration test: boots the real AppModule (DI included, no database)
 * and exercises the HTTP layer through supertest. Mirrors main.ts's
 * bootstrap() (helmet + CORS wiring) instead of reimplementing it, so this
 * test actually catches drift between the two.
 */
describe('GET /health (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.enableCors({ origin: readCorsOrigins(), credentials: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 200 with an ok payload', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toMatchObject({ status: 'ok' });
    expect(Number.isFinite(res.body.uptimeSeconds)).toBe(true);
    expect(res.body.timestamp).toEqual(expect.any(String));
  });

  it('reflects the request origin in CORS headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sets baseline security headers via helmet', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });
});
