import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests only. The Playwright specs under e2e/ belong to their own
 * runner (`pnpm e2e`) and must not be collected here.
 *
 * happy-dom covers both plain logic specs (store.spec.ts) and component
 * specs (*.spec.tsx) under one environment, so no per-file directive is
 * needed to mix the two.
 */
export default defineConfig({
  // tsconfig.json sets jsx:"preserve" for Next's own SWC transform; Vitest
  // runs through esbuild instead and needs to be told explicitly.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    // Next resolves the "@/*" alias from tsconfig.json paths on its own;
    // Vite/Vitest need it declared here too.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
