import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': fileURLToPath(new URL('./src/renderer/app', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@main': fileURLToPath(new URL('./electron', import.meta.url)),
    },
  },
  test: {
    include: ['src/shared/**/*.test.ts', 'src/renderer/app/**/*.test.{ts,tsx}', 'electron/**/*.test.ts', 'scripts/data/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
  },
})
