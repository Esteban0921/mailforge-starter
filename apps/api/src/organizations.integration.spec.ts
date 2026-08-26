import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { createFakePrismaService } from './prisma/prisma.fake';

/**
 * Integration test: boots the real AppModule through the HTTP layer, with
 * PrismaService swapped for the in-memory fake, same as auth.integration.spec.ts.
 */
describe('Organizations flow (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createFakePrismaService())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndGetToken(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana Pérez', email, password: 'contraseña-segura' })
      .expect(201);
    return res.body.accessToken as string;
  }

  it('rejects requests with no access token', async () => {
    await request(app.getHttpServer()).get('/organizations').expect(401);
  });

  it('register provisions a personal organization the user owns', async () => {
    const token = await registerAndGetToken('ana@example.com');

    const res = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ role: 'owner' });
    expect(res.body[0].organization.name).toContain('Ana Pérez');
  });

  it('creates a second organization and lists both', async () => {
    const token = await registerAndGetToken('luis@example.com');

    await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clientes VIP' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.map((m: { organization: { name: string } }) => m.organization.name)).toContain(
      'Clientes VIP',
    );
  });

  it('lets a member fetch org detail and members, but not a non-member', async () => {
    const ownerToken = await registerAndGetToken('owner@example.com');
    const outsiderToken = await registerAndGetToken('outsider@example.com');

    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Solo del owner' })
      .expect(201);
    const orgId = created.body.organization.id;

    const detail = await request(app.getHttpServer())
      .get(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(detail.body.role).toBe('owner');

    const members = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(members.body).toHaveLength(1);
    expect(members.body[0]).toMatchObject({ email: 'owner@example.com', role: 'owner' });

    // Not a member: 404, not 403 — existence of the org isn't confirmed either.
    await request(app.getHttpServer())
      .get(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
  });

  it('lets the owner rename the organization', async () => {
    const token = await registerAndGetToken('rename@example.com');
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre viejo' })
      .expect(201);
    const orgId = created.body.organization.id;

    const updated = await request(app.getHttpServer())
      .patch(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre nuevo' })
      .expect(200);

    expect(updated.body.name).toBe('Nombre nuevo');
  });

  it('rejects a garbage bearer token', async () => {
    await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });
});
