import { beforeEach, describe, expect, it } from 'vitest';
import { SESSION_KEY, USERS_KEY, createAuthStore, type StorageLike } from './store';

/** In-memory StorageLike so specs run in plain node, no browser needed. */
function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

describe('createAuthStore (mock)', () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it('registers a user and starts a session', async () => {
    const store = createAuthStore(storage);
    const result = await store.register({
      name: 'Ana Pérez',
      email: 'Ana@Example.COM',
      password: 'contraseña-segura',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.email).toBe('ana@example.com');
      expect(result.value.user.name).toBe('Ana Pérez');
      expect(JSON.stringify(result.value)).not.toContain('contraseña-segura');
    }
    expect(store.getSession()?.user.email).toBe('ana@example.com');
  });

  it('rejects duplicate emails regardless of case', async () => {
    const store = createAuthStore(storage);
    await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-segura' });

    const second = await store.register({
      name: 'Otra Ana',
      email: '  ANA@example.com ',
      password: 'contraseña-segura',
    });

    expect(second).toEqual({ ok: false, error: 'email_already_registered' });
  });

  it('rejects weak passwords and empty names', async () => {
    const store = createAuthStore(storage);
    expect(
      await store.register({ name: 'Ana', email: 'ana@example.com', password: 'corta' }),
    ).toEqual({ ok: false, error: 'invalid_input' });
    expect(
      await store.register({
        name: '   ',
        email: 'ana@example.com',
        password: 'contraseña-segura',
      }),
    ).toEqual({ ok: false, error: 'invalid_input' });
  });

  it('logs in with the right password, normalizing the email', async () => {
    const store = createAuthStore(storage);
    await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-segura' });

    storage.removeItem(SESSION_KEY);
    expect(store.getSession()).toBeNull();

    const result = await store.login({ email: '  ANA@example.com', password: 'contraseña-segura' });
    expect(result.ok).toBe(true);
    expect(store.getSession()?.user.name).toBe('Ana');
  });

  it('rejects wrong passwords without leaking which field failed', async () => {
    const store = createAuthStore(storage);
    await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-segura' });

    const result = await store.login({ email: 'ana@example.com', password: 'otra-contraseña' });
    expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
  });

  it('logout clears the session but keeps the registered users', async () => {
    const store = createAuthStore(storage);
    await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-segura' });

    await store.logout();
    expect(store.getSession()).toBeNull();
    expect(storage.getItem(USERS_KEY)).not.toBeNull();

    const result = await store.login({ email: 'ana@example.com', password: 'contraseña-segura' });
    expect(result.ok).toBe(true);
  });

  it('tolerates corrupted storage without crashing', async () => {
    storage.setItem(USERS_KEY, '{not-json');
    storage.setItem(SESSION_KEY, '{not-json');
    const store = createAuthStore(storage);

    expect(store.getSession()).toBeNull();
    const result = await store.login({ email: 'ana@example.com', password: 'x' });
    expect(result.ok).toBe(false);
  });
});
