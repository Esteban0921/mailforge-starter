import { createAuthStore, type AuthStore, type StorageLike } from './store';
import { createHttpAuthStore } from './http-store';

/**
 * E2E-only escape hatch: Playwright injects this key (via addInitScript, see
 * e2e/fixtures.ts) before the app's own scripts run. Real users never set
 * it, so real usage always gets the HTTP store.
 *
 * Why this exists: `next start` (what E2E and CI run) serves a build that
 * was already compiled by `pnpm build` — NEXT_PUBLIC_* vars are inlined at
 * that build, not read fresh at serve time, so a Playwright webServer env
 * var could never toggle this per-run. A runtime localStorage check, read
 * by plain client-side JS, sidesteps that entirely: the same build always
 * defaults to the real store, and E2E flips it back to the mock per test
 * before any page code executes — no Docker/Postgres needed for `pnpm e2e`.
 */
const E2E_FORCE_MOCK_KEY = 'mailforge.e2e-force-mock';

/** Browser singleton; unit tests never import this file. */
let instance: AuthStore | null = null;

export function getAuthStore(): AuthStore {
  if (instance === null) {
    const storage: StorageLike = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
      removeItem: (key) => globalThis.localStorage.removeItem(key),
    };
    instance =
      globalThis.localStorage.getItem(E2E_FORCE_MOCK_KEY) === '1'
        ? createAuthStore(storage)
        : createHttpAuthStore(storage);
  }
  return instance;
}
