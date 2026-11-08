import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import { contentSecurityPolicy } from './electron/security'

const aliases = {
  '@renderer': fileURLToPath(new URL('./src/renderer/app', import.meta.url)),
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
  '@main': fileURLToPath(new URL('./electron', import.meta.url)),
}

export default defineConfig(({ command }) => ({
  base: './',
  resolve: { alias: aliases },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, hmr: { host: '127.0.0.1' } },
  plugins: [
    {
      name: 'netagro-content-security-policy',
      transformIndexHtml(html) {
        return html.replace(/(<meta http-equiv="Content-Security-Policy" content=")[^"]*("\s*\/?>)/,
          `$1${contentSecurityPolicy(command === 'serve')}$2`)
      },
    },
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        onstart({ startup }) { return startup(['.']) },
        vite: { resolve: { alias: aliases }, build: { emptyOutDir: command === 'build' } },
      },
      preload: {
        input: fileURLToPath(new URL('./electron/preload.ts', import.meta.url)),
        onstart({ startup }) { return startup(['.']) },
        vite: {
          resolve: { alias: aliases },
          build: {
            rollupOptions: {
              // Sandbox requires one CommonJS bundle with only Electron external.
              external: ['electron'],
              output: { format: 'cjs', entryFileNames: 'preload.cjs', inlineDynamicImports: true },
            },
          },
        },
      },
    }),
  ],
}))
