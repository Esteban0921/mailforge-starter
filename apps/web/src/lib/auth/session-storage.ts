import type { AuthSession } from '@mailforge/shared';

/**
 * Session persistence, shared by the mock store and the real HTTP store —
 * where the session data came from is orthogonal to how it's cached locally.
 */
export const SESSION_KEY = 'mailforge.session';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Fired on `window` whenever the session is written or cleared. The native
 * `storage` event only reaches OTHER tabs, never the one that made the
 * change — components in this tab (e.g. the sidebar's user name) need this
 * to notice a profile update made by a sibling component.
 */
export const SESSION_CHANGE_EVENT = 'mailforge:session-change';

function notifySessionChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

export function createSessionPersistence(storage: StorageLike): {
  persistSession(session: AuthSession | null): void;
  readSession(): AuthSession | null;
} {
  return {
    persistSession(session) {
      if (session === null) {
        storage.removeItem(SESSION_KEY);
      } else {
        storage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      notifySessionChange();
    },
    readSession() {
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as AuthSession;
      } catch {
        return null;
      }
    },
  };
}
