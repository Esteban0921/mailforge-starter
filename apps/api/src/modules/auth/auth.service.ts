import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  normalizeEmail,
  validatePassword,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
} from '@mailforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { readJwtExpiresIn } from '../../env';
import { generateOrganizationSlug } from '../organizations/organization-slug';
import type { JwtPayload } from './jwt-payload';

/** Short-lived on purpose: a leaked access token stops mattering fast. The
 * refresh token (readJwtExpiresIn, default 7d) is what carries the session. */
const ACCESS_TOKEN_TTL = '15m';
const BCRYPT_ROUNDS = 10;

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);
    const name = input.name.trim();
    if (!email.ok || name.length === 0) {
      throw invalidInput();
    }
    if (!validatePassword(input.password)) {
      throw new BadRequestException({
        error: 'weak_password',
        message: 'La contraseña es demasiado corta.',
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email: email.value } });
    if (existing) {
      throw emailAlreadyRegistered();
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    // A brand-new user needs somewhere to put data (RULE-005: nothing lives
    // outside an organization) — register() provisions a personal one and
    // makes the new user its owner, atomically with the User row itself.
    const user = await this.prisma
      .$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: { email: email.value, name, passwordHash },
        });
        const organization = await tx.organization.create({
          data: { name: defaultOrganizationName(name), slug: generateOrganizationSlug(name) },
        });
        await tx.organizationMember.create({
          data: { organizationId: organization.id, userId: createdUser.id, role: 'owner' },
        });
        return createdUser;
      })
      .catch((error: unknown) => {
        // Only the email collision is a real user-facing outcome; a slug
        // collision (astronomically unlikely: 36^6 random suffix) is a bug
        // to surface as a 500, not something to mislabel as "email taken".
        if (isUniqueConstraintViolationOn(error, 'email')) {
          throw emailAlreadyRegistered();
        }
        throw error;
      });

    return this.buildSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);
    if (!email.ok || input.password.length === 0) {
      throw invalidInput();
    }

    const user = await this.prisma.user.findUnique({ where: { email: email.value } });
    const matches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !matches) {
      throw invalidCredentials('Email o contraseña incorrectos.');
    }

    return this.buildSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = this.verifyToken(refreshToken, 'refresh');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw invalidCredentials('Sesión inválida.');
    }

    return this.buildSession(user);
  }

  private verifyToken(token: string, expectedType: JwtPayload['type']): JwtPayload {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      throw invalidCredentials('Sesión inválida o caducada.');
    }
    // A stolen access token must not double as a refresh token, and vice versa.
    if (payload.type !== expectedType) {
      throw invalidCredentials('Sesión inválida.');
    }
    return payload;
  }

  private buildSession(user: UserRecord): AuthSession {
    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.jwt.sign({ sub: user.id, type: 'access' } satisfies JwtPayload, {
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      refreshToken: this.jwt.sign({ sub: user.id, type: 'refresh' } satisfies JwtPayload, {
        // Runtime string, validated by env.ts; jsonwebtoken's stricter
        // literal-union type can't express "any value read from process.env".
        expiresIn: readJwtExpiresIn() as JwtSignOptions['expiresIn'],
      }),
    };
  }
}

function invalidInput(): BadRequestException {
  return new BadRequestException({
    error: 'invalid_input',
    message: 'Revisa los datos del formulario.',
  });
}

function emailAlreadyRegistered(): ConflictException {
  return new ConflictException({
    error: 'email_already_registered',
    message: 'Ya existe una cuenta con ese email.',
  });
}

function invalidCredentials(message: string): UnauthorizedException {
  return new UnauthorizedException({ error: 'invalid_credentials', message });
}

/** Prisma's unique-constraint violation code on a specific field; defends the
 * register() TOCTOU gap between the findUnique pre-check and create() under
 * concurrent requests. */
function isUniqueConstraintViolationOn(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'P2002') {
    return false;
  }
  const meta = 'meta' in error ? error.meta : undefined;
  const target = meta && typeof meta === 'object' && 'target' in meta ? meta.target : undefined;
  return Array.isArray(target) && target.includes(field);
}

function defaultOrganizationName(userName: string): string {
  return `Organización de ${userName}`;
}
