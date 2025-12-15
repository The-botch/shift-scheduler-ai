import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import basicAuthPlugin from './vite-plugin-basic-auth.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Make Basic Auth env vars available to the plugin
  process.env.BASIC_AUTH_ENABLED = env.BASIC_AUTH_ENABLED
  process.env.BASIC_AUTH_CREDENTIALS = env.BASIC_AUTH_CREDENTIALS
  process.env.BASIC_AUTH_SESSION_DURATION = env.BASIC_AUTH_SESSION_DURATION

  return {
    plugins: [react(), tailwindcss(), basicAuthPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        ignored: ['**/public/data/generated/**']
      }
    },
    // Vercel用の設定（ルートドメインでホスト）
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', 'framer-motion'],
          }
        }
      }
    }
  }
})
