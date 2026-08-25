// @ts-check
import prettierConfig from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Global exclusions: applied no matter which workspace invokes eslint.
    // packages/database is excluded: its only meaningful check is `prisma validate`,
    // which requires a live DATABASE_URL (deferred to Phase 1).
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
      'packages/database/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // jsx-a11y only makes sense where JSX actually lives (apps/web).
    files: ['apps/web/**/*.tsx'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  prettierConfig,
);
