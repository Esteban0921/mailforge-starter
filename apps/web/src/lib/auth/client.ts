import { createAuthStore, type AuthStore, type StorageLike } from './store';

/** Browser singleton; unit tests never import this file. */
let instance: AuthStore | null = null;

export function getAuthStore(): AuthStore {
  if (instance === null) {
    const storage: StorageLike = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
      removeItem: (key) => globalThis.localStorage.removeItem(key),
    };
    instance = createAuthStore(storage);
  }
  return instance;
}
