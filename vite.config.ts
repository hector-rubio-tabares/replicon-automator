import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REPLICON_', 'VITE_'])
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REPLICON_LOGIN_URL': JSON.stringify(env.REPLICON_LOGIN_URL),
      'process.env.REPLICON_TIMEOUT': JSON.stringify(env.REPLICON_TIMEOUT),
      'process.env.REPLICON_HEADLESS': JSON.stringify(env.REPLICON_HEADLESS),
      'process.env.REPLICON_AUTOSAVE': JSON.stringify(env.REPLICON_AUTOSAVE),
      // Eliminar __DEV__ de React en producción
      __DEV__: !isProduction,
    },
    base: './',
    root: 'src/renderer',
    publicDir: '../../assets',
    build: {
      outDir: '../../dist/renderer',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      sourcemap: false, // No source maps en producción
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
          passes: 2, // Múltiples pasadas para mejor minificación
        },
        format: {
          comments: false,
        },
        mangle: {
          safari10: true, // Compatibilidad Safari
        },
      },
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
