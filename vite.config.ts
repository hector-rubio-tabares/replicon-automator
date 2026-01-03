import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REPLICON_', 'VITE_'])
  return {
  plugins: [react()],
  define: {
    'process.env.REPLICON_LOGIN_URL': JSON.stringify(env.REPLICON_LOGIN_URL),
    'process.env.REPLICON_TIMEOUT': JSON.stringify(env.REPLICON_TIMEOUT),
    'process.env.REPLICON_HEADLESS': JSON.stringify(env.REPLICON_HEADLESS),
    'process.env.REPLICON_AUTOSAVE': JSON.stringify(env.REPLICON_AUTOSAVE),
  },
  base: './',
  root: 'src/renderer',
  publicDir: '../../assets',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // 1MB is acceptable for Electron apps (local loading)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            if (id.includes('date-holidays')) {
              return 'vendor-holidays';
            }
            if (id.includes('date-fns')) {
              return 'vendor-dates';
            }
            if (id.includes('papaparse')) {
              return 'vendor-csv';
            }
            if (id.includes('zod')) {
              return 'vendor-validation';
            }
            // Keep other node_modules separate
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@common': path.resolve(__dirname, './src/common'),
      '@shared': path.resolve(__dirname, './src/common'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  }
})
