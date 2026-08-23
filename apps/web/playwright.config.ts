import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the PRODUCTION build (`next start`), not the dev server,
 * so every PR exercises a real build. Dedicated port + explicit hostname:
 * 3100 avoids colliding with a locally running `pnpm dev`, and 127.0.0.1
 * sidesteps the Node >= 17 localhost -> ::1 resolution flake.
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next start --port ${PORT} --hostname 127.0.0.1`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
