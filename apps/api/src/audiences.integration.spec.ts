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
 * PrismaService swapped for the in-memory fake, same as auth/organizations.
 */
describe('Audiences flow (integration)', () => {
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

  async function registerAndGetOrg(email: string): Promise<{ token: string; orgId: string }> {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana Pérez', email, password: 'contraseña-segura' })
      .expect(201);
    const token = registerRes.body.accessToken as string;

    const orgsRes = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return { token, orgId: orgsRes.body[0].organization.id as string };
  }

  it('rejects requests with no access token', async () => {
    await request(app.getHttpServer()).get('/organizations/whatever/audiences').expect(401);
  });

  it('creates an audience and lists it back with a zero subscriber count', async () => {
    const { token, orgId } = await registerAndGetOrg('crear@example.com');

    const created = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clientes VIP', description: 'Top 10% por gasto' })
      .expect(201);
    expect(created.body).toMatchObject({ name: 'Clientes VIP', subscriberCount: 0 });

    const list = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/audiences`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('404s an audience id that belongs to another organization', async () => {
    const owner = await registerAndGetOrg('owner-aud@example.com');
    const outsider = await registerAndGetOrg('outsider-aud@example.com');

    const created = await request(app.getHttpServer())
      .post(`/organizations/${owner.orgId}/audiences`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Solo del owner' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/organizations/${outsider.orgId}/audiences/${created.body.id}`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .expect(404);
  });

  it('adds a subscriber manually, rejects a duplicate, filters by status', async () => {
    const { token, orgId } = await registerAndGetOrg('subs@example.com');
    const audience = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clientes VIP' })
      .expect(201);
    const audienceId = audience.body.id as string;

    const added = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences/${audienceId}/subscribers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'luis@example.com', firstName: 'Luis' })
      .expect(201);
    expect(added.body).toMatchObject({ email: 'luis@example.com', status: 'subscribed' });

    await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences/${audienceId}/subscribers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'luis@example.com' })
      .expect(409);

    const subscribed = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/audiences/${audienceId}/subscribers?status=subscribed`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(subscribed.body).toHaveLength(1);

    const pending = await request(app.getHttpServer())
      .get(`/organizations/${orgId}/audiences/${audienceId}/subscribers?status=pending`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(pending.body).toHaveLength(0);
  });

  it('rejects an invalid status filter instead of passing it through to the query', async () => {
    const { token, orgId } = await registerAndGetOrg('badfilter@example.com');
    const audience = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/organizations/${orgId}/audiences/${audience.body.id}/subscribers?status=deleted`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('imports a CSV: valid rows land, invalid/duplicate rows are skipped and reported', async () => {
    const { token, orgId } = await registerAndGetOrg('csv@example.com');
    const audience = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clientes VIP' })
      .expect(201);
    const audienceId = audience.body.id as string;

    await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences/${audienceId}/subscribers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'ana@example.com' })
      .expect(201);

    const csv = [
      'email,firstName,lastName',
      'luis@example.com,Luis,Gómez',
      'no-es-email,X,Y',
      'ana@example.com,Ana,Duplicada',
    ].join('\n');

    const res = await request(app.getHttpServer())
      .post(`/organizations/${orgId}/audiences/${audienceId}/subscribers/import`)
      .set('Authorization', `Bearer ${token}`)
      .send({ csvText: csv })
      .expect(201);

    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toEqual([
      { line: 3, reason: 'invalid_email' },
      { line: 4, reason: 'duplicate_email' },
    ]);
  });
});
