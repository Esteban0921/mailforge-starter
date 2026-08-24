import { defineConfig } from 'vitest/config';

/**
 * Unit tests only. The Playwright specs under e2e/ belong to their own
 * runner (`pnpm e2e`) and must not be collected here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
