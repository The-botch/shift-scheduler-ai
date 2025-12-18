import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
  // Vercelの環境変数をViteに渡す
  define: {
    'import.meta.env.VITE_PASSWORD_PROTECTION_ENABLED': JSON.stringify(
      env.VITE_PASSWORD_PROTECTION_ENABLED
    ),
    'import.meta.env.VITE_PASSWORD_PROTECTION_CREDENTIALS': JSON.stringify(
      env.VITE_PASSWORD_PROTECTION_CREDENTIALS
    ),
    'import.meta.env.VITE_PASSWORD_PROTECTION_SESSION_DURATION': JSON.stringify(
      env.VITE_PASSWORD_PROTECTION_SESSION_DURATION
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'log-env-vars',
      config() {
        console.log('[DEBUG] VITE_PASSWORD_PROTECTION_ENABLED:', env.VITE_PASSWORD_PROTECTION_ENABLED)
        console.log('[DEBUG] VITE_PASSWORD_PROTECTION_CREDENTIALS:', env.VITE_PASSWORD_PROTECTION_CREDENTIALS ? '***SET***' : 'NOT SET')
        console.log('[DEBUG] SESSION_DURATION:', env.VITE_PASSWORD_PROTECTION_SESSION_DURATION)
      }
    }
  ],
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
