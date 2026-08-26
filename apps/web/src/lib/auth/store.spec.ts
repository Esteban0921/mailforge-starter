import { beforeEach, describe, expect, it } from 'vitest';
import { USERS_KEY, createAuthStore, type StorageLike } from './store';
import { SESSION_KEY } from './session-storage';

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

  it('rejects a weak password with its own error, not a generic one', async () => {
    const store = createAuthStore(storage);
    expect(
      await store.register({ name: 'Ana', email: 'ana@example.com', password: 'corta' }),
    ).toEqual({ ok: false, error: 'weak_password' });
  });

  it('rejects an empty name as invalid input', async () => {
    const store = createAuthStore(storage);
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

  describe('updateProfile', () => {
    it('renames the signed-in user and updates the session', async () => {
      const store = createAuthStore(storage);
      await store.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'contraseña-segura',
      });

      const result = await store.updateProfile('Ana Pérez Actualizada');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.user.name).toBe('Ana Pérez Actualizada');
      }
      expect(store.getSession()?.user.name).toBe('Ana Pérez Actualizada');
    });

    it('persists the new name across a fresh login', async () => {
      const store = createAuthStore(storage);
      await store.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'contraseña-segura',
      });
      await store.updateProfile('Ana Actualizada');
      await store.logout();

      const result = await store.login({ email: 'ana@example.com', password: 'contraseña-segura' });
      expect(result.ok && result.value.user.name).toBe('Ana Actualizada');
    });

    it('rejects a blank name as invalid input', async () => {
      const store = createAuthStore(storage);
      await store.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'contraseña-segura',
      });

      expect(await store.updateProfile('   ')).toEqual({ ok: false, error: 'invalid_input' });
    });

    it('rejects the call when nobody is signed in', async () => {
      const store = createAuthStore(storage);
      expect(await store.updateProfile('Ana')).toEqual({ ok: false, error: 'invalid_input' });
    });
  });

  describe('updatePassword', () => {
    it('changes the password when the current one matches', async () => {
      const store = createAuthStore(storage);
      await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-vieja' });

      const result = await store.updatePassword('contraseña-vieja', 'contraseña-nueva');
      expect(result.ok).toBe(true);

      await store.logout();
      expect(await store.login({ email: 'ana@example.com', password: 'contraseña-vieja' })).toEqual(
        { ok: false, error: 'invalid_credentials' },
      );
      expect(
        (await store.login({ email: 'ana@example.com', password: 'contraseña-nueva' })).ok,
      ).toBe(true);
    });

    it('rejects the wrong current password without leaking anything', async () => {
      const store = createAuthStore(storage);
      await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-vieja' });

      const result = await store.updatePassword('adivinar', 'contraseña-nueva');
      expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
    });

    it('rejects a new password that is too weak', async () => {
      const store = createAuthStore(storage);
      await store.register({ name: 'Ana', email: 'ana@example.com', password: 'contraseña-vieja' });

      const result = await store.updatePassword('contraseña-vieja', 'corta');
      expect(result).toEqual({ ok: false, error: 'weak_password' });
    });
  });
});
