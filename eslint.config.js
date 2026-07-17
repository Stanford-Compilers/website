// Flat ESLint config (ESLint 9). Intentionally lean: it lints Astro components
// and TypeScript for obvious problems without a heavy rule set that would fight
// the design-focused source. Type correctness is enforced separately by
// `astro check` / `tsc`.
import eslintPluginAstro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
      'coverage/**',
      'lighthouse/**',
    ],
  },
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      // Type-aware checks are handled by `astro check`; keep ESLint focused on logic bugs.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  {
    // Node-run scripts and tooling may use console freely.
    files: ['scripts/**/*.ts', 'tests/**/*.ts', '*.config.*'],
    rules: {
      'no-console': 'off',
    },
  },
];
