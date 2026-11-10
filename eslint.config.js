import js from '@eslint/js';
import globals from 'globals';

export default [
  // Lo que generan las herramientas no se revisa: documentación, web publicable e informes
  { ignores: ['docs/', 'dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      // Tres reglas añadidas para el Sprint 1 (Requisito 9):
      camelcase: 'error',
      curly: 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
