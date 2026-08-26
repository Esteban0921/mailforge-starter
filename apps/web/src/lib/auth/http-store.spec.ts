import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHttpAuthStore } from './http-store';
import { SESSION_KEY } from './session-storage';
import type { StorageLike } from './store';

/** In-memory StorageLike so specs run in plain node/happy-dom, no real browser storage. */
function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SESSION = {
  user: { id: 'usr_1', email: 'ana@example.com', name: 'Ana' },
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
};

describe('createHttpAuthStore', () => {
  let storage: StorageLike;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = memoryStorage();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('register persists the session returned by the API', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, SESSION));
    const store = createHttpAuthStore(storage);

    const result = await store.register({ name: 'Ana', email: 'ana@example.com', password: 'x' });

    expect(result).toEqual({ ok: true, value: SESSION });
    expect(store.getSession()).toEqual(SESSION);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'x',
    });
  });

  it('register surfaces the API error code and does not persist a session', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, { error: 'email_already_registered', message: 'Ya existe' }),
    );
    const store = createHttpAuthStore(storage);

    const result = await store.register({ name: 'Ana', email: 'ana@example.com', password: 'x' });

    expect(result).toEqual({ ok: false, error: 'email_already_registered' });
    expect(store.getSession()).toBeNull();
  });

  it('login persists the session on success and rejects on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, SESSION));
    const store = createHttpAuthStore(storage);
    expect(await store.login({ email: 'ana@example.com', password: 'x' })).toEqual({
      ok: true,
      value: SESSION,
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { error: 'invalid_credentials', message: 'nope' }),
    );
    expect(await store.login({ email: 'ana@example.com', password: 'wrong' })).toEqual({
      ok: false,
      error: 'invalid_credentials',
    });
  });

  it('logout clears the session without calling the API (stateless tokens)', async () => {
    storage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const store = createHttpAuthStore(storage);

    await store.logout();

    expect(store.getSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('updateProfile', () => {
    it('rejects immediately when nobody is signed in, without calling the API', async () => {
      const store = createHttpAuthStore(storage);
      expect(await store.updateProfile('Nuevo nombre')).toEqual({
        ok: false,
        error: 'invalid_credentials',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('merges the updated user into the existing session on success', async () => {
      storage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { id: 'usr_1', email: 'ana@example.com', name: 'Ana Nueva' }),
      );
      const store = createHttpAuthStore(storage);

      const result = await store.updateProfile('Ana Nueva');

      expect(result.ok).toBe(true);
      expect(store.getSession()).toMatchObject({
        user: { name: 'Ana Nueva' },
        accessToken: SESSION.accessToken,
        refreshToken: SESSION.refreshToken,
      });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBe(`Bearer ${SESSION.accessToken}`);
    });

    it('refreshes once and retries on a 401, then succeeds', async () => {
      storage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      const refreshedSession = { ...SESSION, accessToken: 'access-2', refreshToken: 'refresh-2' };
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { error: 'invalid_credentials' })) // stale access token
        .mockResolvedValueOnce(jsonResponse(200, refreshedSession)) // /auth/refresh
        .mockResolvedValueOnce(
          jsonResponse(200, { id: 'usr_1', email: 'ana@example.com', name: 'Ana Nueva' }),
        ); // retried with the fresh token
      const store = createHttpAuthStore(storage);

      const result = await store.updateProfile('Ana Nueva');

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
      const retryInit = fetchMock.mock.calls[2][1];
      expect(retryInit.headers.Authorization).toBe('Bearer access-2');
      expect(store.getSession()?.accessToken).toBe('access-2');
    });

    it('clears the session when the refresh itself also fails', async () => {
      storage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { error: 'invalid_credentials' }))
        .mockResolvedValueOnce(jsonResponse(401, { error: 'invalid_credentials' })); // refresh also dead
      const store = createHttpAuthStore(storage);

      const result = await store.updateProfile('Ana Nueva');

      expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
      expect(store.getSession()).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('surfaces weak_password from the API without touching the session', async () => {
      storage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      fetchMock.mockResolvedValueOnce(
        jsonResponse(400, { error: 'weak_password', message: 'corta' }),
      );
      const store = createHttpAuthStore(storage);

      const result = await store.updatePassword('actual', 'corta');

      expect(result).toEqual({ ok: false, error: 'weak_password' });
      expect(store.getSession()).toEqual(SESSION);
    });
  });
});
