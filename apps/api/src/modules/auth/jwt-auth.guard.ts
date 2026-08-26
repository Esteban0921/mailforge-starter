import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

/** Augmented by JwtAuthGuard; read via @CurrentUserId(). */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function invalidSession(): UnauthorizedException {
  return new UnauthorizedException({
    error: 'invalid_credentials',
    message: 'Sesión inválida o caducada.',
  });
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw invalidSession();
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      throw invalidSession();
    }
    // A refresh token must never authenticate a request on its own — only
    // /auth/refresh accepts one, and only to mint a fresh access token.
    if (payload.type !== 'access') {
      throw invalidSession();
    }

    request.userId = payload.sub;
    return true;
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}
