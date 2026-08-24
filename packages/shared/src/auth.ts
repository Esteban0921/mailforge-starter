/**
 * Auth contracts shared between the API (future NestJS auth module)
 * and the Web app. The frontend mock implements these shapes so the
 * swap to real endpoints is a transport change, not a refactor.
 */

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Public shape of an authenticated user (never includes passwordHash). */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSession {
  user: SessionUser;
  /** Opaque in the mock; a JWT pair once the real API lands (TASK-0018). */
  accessToken: string;
  refreshToken: string;
}

export type AuthError =
  'invalid_credentials' | 'email_already_registered' | 'weak_password' | 'invalid_input';

export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
