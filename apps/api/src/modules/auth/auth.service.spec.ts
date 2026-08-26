import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createFakePrismaService } from '../../prisma/prisma.fake';

describe('AuthService (unit)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'unit-test-secret' })],
      providers: [AuthService, { provide: PrismaService, useValue: createFakePrismaService() }],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a user and returns a working token pair', async () => {
      const session = await service.register({
        name: 'Ana Pérez',
        email: 'Ana@Example.com',
        password: 'contraseña-segura',
      });

      expect(session.user).toMatchObject({ email: 'ana@example.com', name: 'Ana Pérez' });
      expect(session.accessToken).toEqual(expect.any(String));
      expect(session.refreshToken).toEqual(expect.any(String));
    });

    it('rejects a password shorter than the shared policy', async () => {
      await expect(
        service.register({ name: 'Ana', email: 'ana@example.com', password: 'short' }),
      ).rejects.toMatchObject({ response: { error: 'weak_password' } });
    });

    it('rejects a duplicate email', async () => {
      await service.register({ name: 'Ana', email: 'dup@example.com', password: 'contraseña-1' });

      await expect(
        service.register({ name: 'Otra Ana', email: 'dup@example.com', password: 'contraseña-2' }),
      ).rejects.toMatchObject({ response: { error: 'email_already_registered' } });
    });
  });

  describe('login', () => {
    it('accepts the right password, case-insensitively on email', async () => {
      await service.register({
        name: 'Luis',
        email: 'luis@example.com',
        password: 'contraseña-correcta',
      });

      const session = await service.login({
        email: 'LUIS@example.com',
        password: 'contraseña-correcta',
      });
      expect(session.user.email).toBe('luis@example.com');
    });

    it('rejects a wrong password without leaking which field failed', async () => {
      await service.register({
        name: 'Luis',
        email: 'luis@example.com',
        password: 'contraseña-correcta',
      });

      await expect(
        service.login({ email: 'luis@example.com', password: 'contraseña-incorrecta' }),
      ).rejects.toMatchObject({ response: { error: 'invalid_credentials' } });
    });

    it('rejects an email that was never registered, same error as a wrong password', async () => {
      await expect(
        service.login({ email: 'nadie@example.com', password: 'lo-que-sea-1' }),
      ).rejects.toMatchObject({ response: { error: 'invalid_credentials' } });
    });
  });

  describe('refresh', () => {
    it('mints a new token pair from a valid refresh token', async () => {
      const original = await service.register({
        name: 'Rex',
        email: 'rex@example.com',
        password: 'contraseña-refresca',
      });

      const refreshed = await service.refresh(original.refreshToken);
      expect(refreshed.user.email).toBe('rex@example.com');
      expect(refreshed.accessToken).toEqual(expect.any(String));
    });

    it('rejects an access token presented as a refresh token', async () => {
      const session = await service.register({
        name: 'Sam',
        email: 'sam@example.com',
        password: 'contraseña-tipo',
      });

      await expect(service.refresh(session.accessToken)).rejects.toMatchObject({
        response: { error: 'invalid_credentials' },
      });
    });

    it('rejects a garbage token', async () => {
      await expect(service.refresh('not-a-jwt')).rejects.toMatchObject({
        response: { error: 'invalid_credentials' },
      });
    });

    it('rejects a well-formed but expired refresh token', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [JwtModule.register({ secret: 'unit-test-secret' })],
        providers: [AuthService, { provide: PrismaService, useValue: createFakePrismaService() }],
      }).compile();
      const jwt = moduleRef.get(JwtService);
      const expired = jwt.sign({ sub: 'usr_1', type: 'refresh' }, { expiresIn: '-1s' });

      await expect(moduleRef.get(AuthService).refresh(expired)).rejects.toMatchObject({
        response: { error: 'invalid_credentials' },
      });
    });
  });
});
