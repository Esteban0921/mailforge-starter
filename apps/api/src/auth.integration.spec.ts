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
 * PrismaService swapped for the in-memory fake (see prisma.fake.ts) so this
 * runs with no Docker, same as health.integration.spec.ts. Mirrors main.ts's
 * ValidationPipe wiring instead of reimplementing it.
 */
describe('Auth flow (integration)', () => {
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

  it('registers a user and returns a working token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Ana Pérez', email: 'ana@example.com', password: 'contraseña-segura' })
      .expect(201);

    expect(res.body.user).toMatchObject({ email: 'ana@example.com', name: 'Ana Pérez' });
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('rejects a duplicate registration with 409 and a stable error code', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dup', email: 'dup@example.com', password: 'contraseña-segura' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dup 2', email: 'dup@example.com', password: 'contraseña-segura' })
      .expect(409);

    expect(res.body.error).toBe('email_already_registered');
  });

  it('rejects malformed input before it reaches the service (global ValidationPipe)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'contraseña-segura' })
      .expect(400);
  });

  it('rejects an unexpected extra field instead of silently dropping it', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'X',
        email: 'x@example.com',
        password: 'contraseña-segura',
        isAdmin: true,
      })
      .expect(400);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Luis', email: 'luis@example.com', password: 'contraseña-correcta' })
      .expect(201);

    const ok = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'luis@example.com', password: 'contraseña-correcta' })
      .expect(200);
    expect(ok.body.accessToken).toEqual(expect.any(String));

    const bad = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'luis@example.com', password: 'contraseña-incorrecta' })
      .expect(401);
    expect(bad.body.error).toBe('invalid_credentials');
  });

  it('refresh mints a new access token from a valid refresh token', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Rex', email: 'rex@example.com', password: 'contraseña-refresca' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerRes.body.refreshToken })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'rex@example.com' });
  });

  it('rejects an access token presented as a refresh token', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Sam', email: 'sam@example.com', password: 'contraseña-tipo' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerRes.body.accessToken })
      .expect(401);

    expect(res.body.error).toBe('invalid_credentials');
  });

  it('rejects /auth/me with no token, and updates the name with one', async () => {
    await request(app.getHttpServer()).patch('/auth/me').send({ name: 'Nadie' }).expect(401);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Mia', email: 'mia@example.com', password: 'contraseña-perfil' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch('/auth/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: 'Mia Actualizada' })
      .expect(200);

    expect(res.body).toMatchObject({ email: 'mia@example.com', name: 'Mia Actualizada' });
  });

  it('changes the password via /auth/me/password, and the old one stops working', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Nico', email: 'nico@example.com', password: 'contraseña-vieja' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/auth/me/password')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ currentPassword: 'contraseña-vieja', newPassword: 'contraseña-nueva' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nico@example.com', password: 'contraseña-vieja' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nico@example.com', password: 'contraseña-nueva' })
      .expect(200);
  });
});
