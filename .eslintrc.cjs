module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  // Preserve the unfinished local prototype; it is not part of the application.
  ignorePatterns: ['dist', 'dist-electron', 'release', 'out', 'design', 'data', '.local-backup', '.eslintrc.cjs', 'src/renderer/src'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
  },
  overrides: [{
    files: ['src/renderer/app/**/*.{ts,tsx}', 'src/App.tsx', 'src/main.tsx'],
    excludedFiles: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: ['node:*', 'electron', '@main/*', 'leaflet', 'react-leaflet'],
      }],
      'no-restricted-globals': ['error', 'fetch', 'XMLHttpRequest', 'WebSocket'],
      'no-restricted-properties': ['error',
        { object: 'window', property: 'fetch' },
        { object: 'globalThis', property: 'fetch' },
        { object: 'navigator', property: 'sendBeacon' },
      ],
    },
  }],
}
