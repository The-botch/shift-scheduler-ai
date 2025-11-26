import express from 'express'
import cors from 'cors'
import openaiRoutes from './routes/openai.js'
import csvRoutes from './routes/csv.js'
import masterRoutes from './routes/master.js'
import shiftsRoutes from './routes/shifts.js'
import analyticsRoutes from './routes/analytics.js'
import tenantsRoutes from './routes/tenants.js'
import vectorStoreRoutes from './routes/vector-store.js'
import holidaysRoutes from './routes/holidays.js'
import liffRoutes from './routes/liff.js'
import { appendLog } from './utils/logger.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Health check endpoint
app.get('/api/health', (req, res) => {
  // 環境変数を取得
  const appEnv = process.env.APP_ENV // local/stg/prd
  const dbEnv = process.env.DB_ENV // stg/prd
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME

  // BE環境判定: APP_ENVを優先、なければRAILWAY_ENVIRONMENT_NAMEで判定
  const getEnvironment = () => {
    // APP_ENVが明示的に設定されている場合はそれを使用
    if (appEnv) {
      return appEnv.toUpperCase()
    }

    // Railwayの環境変数で判定
    if (!railwayEnv) {
      return 'LOCAL'
    }

    if (railwayEnv === 'production') {
      return 'PRD'
    } else {
      return 'STG'
    }
  }

  // DB環境判定: DB_ENVを優先、なければURLで判定
  const getDbEnvironment = () => {
    // DB_ENVが明示的に設定されている場合はそれを使用
    if (dbEnv) {
      return dbEnv.toUpperCase()
    }

    const dbUrl = process.env.DATABASE_URL || ''

    // ローカルDBの場合（DBはSTG/PRDのみだが念のため）
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      return 'LOCAL'
    }

    // Railway DBの場合
    if (dbUrl.includes('railway.app') || dbUrl.includes('railway') || dbUrl.includes('rlwy.net')) {
      // 明示的に本番DB用の識別子がある場合
      if (dbUrl.includes('-production-') || dbUrl.includes('production.')) {
        return 'PRD'
      }

      // RAILWAY_ENVIRONMENT_NAMEで判定
      if (railwayEnv === 'production') {
        return 'PRD'
      } else if (railwayEnv) {
        return 'STG'
      }

      // デフォルトはSTG（PRDよりSTGの方が安全）
      return 'STG'
    }

    // その他の場合
    return 'UNKNOWN'
  }

  res.json({
    success: true,
    backend: {
      environment: getEnvironment(),
      hostname: req.hostname,
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    database: {
      environment: getDbEnvironment(),
      connected: true, // TODO: 実際のDB接続チェック
      host: process.env.PGHOST || 'unknown'
    }
  })
})

// Routes
app.use('/api/openai', openaiRoutes)
app.use('/api', csvRoutes)
app.use('/api/master', masterRoutes)
app.use('/api/shifts', shiftsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/tenants', tenantsRoutes)
app.use('/api/vector-store', vectorStoreRoutes)
app.use('/api/holidays', holidaysRoutes)
app.use('/api/liff', liffRoutes)

// Server startup
function startServer() {
  try {
    // サーバー起動
    app.listen(PORT, '0.0.0.0', () => {
      const startupMsg = `🚀 Backend server running on port ${PORT}`
      const proxyMsg = `📡 OpenAI API Proxy enabled`

      console.log(startupMsg)
      console.log(proxyMsg)

      appendLog(startupMsg)
      appendLog(proxyMsg)
      appendLog('=====================================')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
