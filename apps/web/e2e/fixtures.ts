import { test as base } from '@playwright/test';

/**
 * Any spec that registers/logs in must import `test`/`expect` from here
 * instead of '@playwright/test' directly. It injects the flag
 * lib/auth/client.ts checks to fall back to the mock store — without it,
 * these tests would hit the real API and need Docker/Postgres running,
 * which CI doesn't have. See client.ts's docstring for the full mechanism.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mailforge.e2e-force-mock', '1');
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
