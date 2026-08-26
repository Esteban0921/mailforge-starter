import { getAuthStore } from './auth';
import { apiRequest } from './api-client';
import type { AuthSession } from '@mailforge/shared';

/**
 * Generic authenticated request: attaches the current access token, and on
 * a 401 (likely just expired — access tokens live 15 minutes) tries one
 * silent refresh-and-retry before giving up. Lifted out of
 * lib/auth/http-store.ts (which has its own private copy for auth's own two
 * protected endpoints) the first time a SECOND feature needed the same
 * behavior — see that file's docstring.
 *
 * Session mutation (refresh, or clearing on a dead session) goes through
 * getAuthStore() so the mock store in E2E behaves the same way: its
 * getSession()/logout() are called here exactly like the real store's.
 */
export type AuthedResult<T> = { ok: true; body: T } | { ok: false; status: number };

export async function authenticatedRequest<T = unknown>(
  path: string,
  options: { method: 'GET' | 'POST' | 'PATCH'; body?: unknown },
): Promise<AuthedResult<T>> {
  const store = getAuthStore();
  const session = store.getSession();
  if (session === null) {
    return { ok: false, status: 401 };
  }

  let res = await apiRequest<T>(path, { ...options, accessToken: session.accessToken });
  if (res.status === 401) {
    const refreshed = await tryRefresh(session.refreshToken);
    if (refreshed === null) {
      await store.logout();
      return { ok: false, status: 401 };
    }
    res = await apiRequest<T>(path, { ...options, accessToken: refreshed.accessToken });
  }

  if (res.status >= 200 && res.status < 300) {
    return { ok: true, body: res.body };
  }
  return { ok: false, status: res.status };
}

async function tryRefresh(refreshToken: string): Promise<AuthSession | null> {
  const res = await apiRequest<AuthSession>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
  return res.status === 200 ? res.body : null;
}
