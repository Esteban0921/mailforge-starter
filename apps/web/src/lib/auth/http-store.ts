import {
  err,
  ok,
  type AuthError,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
  type Result,
  type SessionUser,
} from '@mailforge/shared';
import { apiRequest } from '../api-client';
import { createSessionPersistence, type StorageLike } from './session-storage';
import type { AuthStore } from './store';

/**
 * Real HTTP-backed AuthStore (TASK-0020) — implements the exact interface
 * store.ts's mock does, so nothing above this layer (forms, pages) changes.
 * client.ts picks between the two at runtime; E2E deliberately keeps using
 * the mock (see client.ts's docstring) so `pnpm e2e` and CI never need
 * Docker/Postgres — that invariant predates this file and this file must
 * not break it.
 */

const KNOWN_ERRORS: ReadonlySet<AuthError> = new Set([
  'invalid_credentials',
  'email_already_registered',
  'weak_password',
  'invalid_input',
]);

function toAuthError(body: unknown): AuthError {
  const candidate = (body as { error?: string } | undefined)?.error;
  return candidate && KNOWN_ERRORS.has(candidate as AuthError)
    ? (candidate as AuthError)
    : 'invalid_input';
}

export function createHttpAuthStore(storage: StorageLike): AuthStore {
  const { persistSession, readSession } = createSessionPersistence(storage);

  async function refreshWith(refreshToken: string): Promise<AuthSession | null> {
    const res = await apiRequest<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    return res.status === 200 ? res.body : null;
  }

  /**
   * Attaches the current access token; on a 401 (likely just expired — it
   * only lives 15 minutes) tries one silent refresh-and-retry before giving
   * up. Not exported/generalized beyond auth's own two protected endpoints:
   * the next module that needs an authenticated call (TASK-0021's org
   * switcher) is the right place to lift this into a shared helper.
   */
  async function authedRequest<T>(
    path: string,
    options: { method: 'PATCH'; body?: unknown },
  ): Promise<Result<T, AuthError>> {
    const session = readSession();
    if (session === null) {
      return err('invalid_credentials');
    }

    let res = await apiRequest<T>(path, { ...options, accessToken: session.accessToken });
    if (res.status === 401) {
      const refreshed = await refreshWith(session.refreshToken);
      if (refreshed === null) {
        persistSession(null);
        return err('invalid_credentials');
      }
      persistSession(refreshed);
      res = await apiRequest<T>(path, { ...options, accessToken: refreshed.accessToken });
    }

    if (res.status >= 200 && res.status < 300) {
      return ok(res.body);
    }
    return err(toAuthError(res.body));
  }

  /** The profile/password endpoints only return the updated user — the
   * tokens they were called with are still valid, so the session is patched
   * locally instead of asking the API to reissue a pair for a name change. */
  function persistMergedUser(user: SessionUser): Result<AuthSession, AuthError> {
    const session = readSession();
    if (session === null) {
      return err('invalid_credentials');
    }
    const merged: AuthSession = { ...session, user };
    persistSession(merged);
    return ok(merged);
  }

  return {
    async register(input: RegisterInput) {
      const res = await apiRequest<AuthSession>('/auth/register', { method: 'POST', body: input });
      if (res.status === 201) {
        persistSession(res.body);
        return ok(res.body);
      }
      return err(toAuthError(res.body));
    },

    async login(input: LoginInput) {
      const res = await apiRequest<AuthSession>('/auth/login', { method: 'POST', body: input });
      if (res.status === 200) {
        persistSession(res.body);
        return ok(res.body);
      }
      return err(toAuthError(res.body));
    },

    async logout() {
      // Stateless tokens (TASK-0062 tracks server-side revocation as future
      // work): nothing to invalidate server-side, so logout is local-only,
      // same as the mock.
      persistSession(null);
    },

    getSession: readSession,

    async updateProfile(name) {
      const outcome = await authedRequest<SessionUser>('/auth/me', {
        method: 'PATCH',
        body: { name },
      });
      return outcome.ok ? persistMergedUser(outcome.value) : err(outcome.error);
    },

    async updatePassword(currentPassword, newPassword) {
      const outcome = await authedRequest<SessionUser>('/auth/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
      });
      return outcome.ok ? persistMergedUser(outcome.value) : err(outcome.error);
    },
  };
}
