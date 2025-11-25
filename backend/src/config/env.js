import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 環境変数を読み込む
 *
 * 読み込み優先順位:
 * 1. .env.local (ローカル開発用、gitignore対象)
 * 2. .env.{NODE_ENV} (環境別設定)
 * 3. .env (デフォルト設定)
 *
 * NODE_ENV:
 * - development: ローカル開発環境（デフォルト）
 * - staging: ステージング環境
 * - production: 本番環境
 */

const NODE_ENV = process.env.NODE_ENV || 'development'
const ROOT_DIR = resolve(__dirname, '../..')

console.log(`🔧 Loading environment: ${NODE_ENV}`)

// .env.local を最優先で読み込み（ローカル開発用）
const localEnvPath = resolve(ROOT_DIR, '.env.local')
const localResult = dotenv.config({ path: localEnvPath })

if (localResult.parsed) {
  console.log('✅ Loaded .env.local')
} else {
  console.log('ℹ️  .env.local not found (OK for cloud environments)')

  // .env.local がない場合、環境別の .env ファイルを読み込み
  const envPath = resolve(ROOT_DIR, `.env.${NODE_ENV}`)
  const envResult = dotenv.config({ path: envPath })

  if (envResult.parsed) {
    console.log(`✅ Loaded .env.${NODE_ENV}`)
  } else {
    // 環境別 .env もない場合、デフォルトの .env を読み込み
    const defaultEnvPath = resolve(ROOT_DIR, '.env')
    const defaultResult = dotenv.config({ path: defaultEnvPath })

    if (defaultResult.parsed) {
      console.log('✅ Loaded .env')
    } else {
      console.warn('⚠️  No .env files found')
    }
  }
}

// 必須環境変数のチェック
const requiredEnvVars = [
  'DATABASE_URL',
  'PORT',
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '))
  console.error('💡 Please create .env.local file in backend/ directory')
  console.error('💡 You can copy from .env.local.example and fill in the values')
  process.exit(1)
}

console.log('✅ All required environment variables are set')
console.log(`📊 Environment: ${NODE_ENV}`)
console.log(`🗄️  Database: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`) // パスワードをマスク

export default {
  NODE_ENV,
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
}
