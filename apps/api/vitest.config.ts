import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * NestJS relies on legacy experimental decorators AND the runtime type
 * metadata (`design:paramtypes`) they emit. The default vitest/esbuild
 * transform drops that metadata, which breaks constructor-based DI.
 * SWC restores it: `decorators` parses them, `legacyDecorator` selects the
 * legacy transform Nest expects, `decoratorMetadata` emits the metadata.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // AuthModule reads JWT_SECRET from process.env at import time (module
    // decorator evaluation), so it must be set before that import runs —
    // test.env is applied before test files load, unlike an in-file assignment.
    env: { JWT_SECRET: 'vitest-only-secret-never-use-elsewhere' },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
