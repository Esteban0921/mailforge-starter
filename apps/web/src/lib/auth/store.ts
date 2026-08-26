import {
  normalizeEmail,
  validatePassword,
  type AuthError,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
  type SessionUser,
} from '@mailforge/shared';
import { err, ok, type Result } from '@mailforge/shared';
import { createSessionPersistence, type StorageLike } from './session-storage';

/**
 * MOCK auth store (Fase 1 interim).
 *
 * Implements the shared auth contract over plain storage — kept around as
 * the store the E2E suite runs against, so CI never needs Docker/Postgres
 * (see http-store.ts's docstring for how a real browser picks between the
 * two). When testing this file directly, use it exactly as before.
 *
 * The stored "secret" is deliberate obfuscation, NOT cryptography: this
 * mock must never hold anything beyond throwaway local dev data.
 */
export const USERS_KEY = 'mailforge.users';

export type { StorageLike };

interface StoredUser extends SessionUser {
  /** Mock-only obfuscated secret; see module docstring. */
  secret: string;
}

/** Minimal async delay so loading states behave like real network calls. */
const MOCK_LATENCY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockSecret(password: string): string {
  return `mock:${password.length}:${[...password].reverse().join('')}`;
}

function readJson<T>(storage: StorageLike, key: string): T[] {
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function makeId(): string {
  return `usr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export interface AuthStore {
  register(input: RegisterInput): Promise<Result<AuthSession, AuthError>>;
  login(input: LoginInput): Promise<Result<AuthSession, AuthError>>;
  logout(): Promise<void>;
  getSession(): AuthSession | null;
  /** Updates the signed-in user's display name. */
  updateProfile(name: string): Promise<Result<AuthSession, AuthError>>;
  /** Changes the signed-in user's password, re-checking the current one first. */
  updatePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<Result<AuthSession, AuthError>>;
}

export function createAuthStore(storage: StorageLike): AuthStore {
  const { persistSession, readSession } = createSessionPersistence(storage);

  return {
    async register(input) {
      const email = normalizeEmail(input.email);
      if (!email.ok || input.name.trim().length === 0) {
        return err('invalid_input');
      }
      if (!validatePassword(input.password)) {
        return err('weak_password');
      }

      await sleep(MOCK_LATENCY_MS);

      const users = readJson<StoredUser>(storage, USERS_KEY);
      if (users.some((u) => u.email === email.value)) {
        return err('email_already_registered');
      }

      const user: StoredUser = {
        id: makeId(),
        email: email.value,
        name: input.name.trim(),
        secret: mockSecret(input.password),
      };
      storage.setItem(USERS_KEY, JSON.stringify([...users, user]));

      const session = toSession(user);
      persistSession(session);
      return ok(session);
    },

    async login(input) {
      const email = normalizeEmail(input.email);
      if (!email.ok || input.password.length === 0) {
        return err('invalid_input');
      }

      await sleep(MOCK_LATENCY_MS);

      const users = readJson<StoredUser>(storage, USERS_KEY);
      const user = users.find((u) => u.email === email.value);
      if (!user || user.secret !== mockSecret(input.password)) {
        return err('invalid_credentials');
      }

      const session = toSession(user);
      persistSession(session);
      return ok(session);
    },

    async logout() {
      await sleep(MOCK_LATENCY_MS);
      persistSession(null);
    },

    async updateProfile(name) {
      const session = readSession();
      const trimmed = name.trim();
      if (session === null || trimmed.length === 0) {
        return err('invalid_input');
      }

      await sleep(MOCK_LATENCY_MS);

      const users = readJson<StoredUser>(storage, USERS_KEY);
      const index = users.findIndex((u) => u.id === session.user.id);
      if (index === -1) {
        return err('invalid_input');
      }

      const updated: StoredUser = { ...users[index], name: trimmed };
      users[index] = updated;
      storage.setItem(USERS_KEY, JSON.stringify(users));

      const newSession = toSession(updated);
      persistSession(newSession);
      return ok(newSession);
    },

    async updatePassword(currentPassword, newPassword) {
      const session = readSession();
      if (session === null) {
        return err('invalid_input');
      }

      await sleep(MOCK_LATENCY_MS);

      const users = readJson<StoredUser>(storage, USERS_KEY);
      const index = users.findIndex((u) => u.id === session.user.id);
      if (index === -1) {
        return err('invalid_input');
      }
      if (users[index].secret !== mockSecret(currentPassword)) {
        return err('invalid_credentials');
      }
      if (!validatePassword(newPassword)) {
        return err('weak_password');
      }

      const updated: StoredUser = { ...users[index], secret: mockSecret(newPassword) };
      users[index] = updated;
      storage.setItem(USERS_KEY, JSON.stringify(users));

      const newSession = toSession(updated);
      persistSession(newSession);
      return ok(newSession);
    },

    getSession: readSession,
  };
}

function toSession(user: StoredUser): AuthSession {
  const { secret: _secret, ...publicUser } = user;
  return {
    user: publicUser satisfies SessionUser,
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
  };
}
