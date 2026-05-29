import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const fileEnv = loadEnv(mode, __dirname, '')
  const backendUrl =
      process.env.WEBAPP_BACKEND_URL ?? fileEnv.WEBAPP_BACKEND_URL ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, '../backend/src/main/resources/static'),
      emptyOutDir: true,
    },
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
