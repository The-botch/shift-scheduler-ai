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
  // Railwayの環境名を取得（全体で共通使用）
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME

  // 環境判定: Railwayの環境変数でPRD/DEV/LOCALを判定
  const getEnvironment = () => {
    // Railwayの環境変数がない場合はLOCAL
    if (!railwayEnv) {
      return 'LOCAL'
    }

    // Railwayの環境名で判定
    if (railwayEnv === 'production') {
      return 'PRD'
    } else {
      return 'DEV'
    }
  }

  // DB環境判定: 実際のDATABASE_URLの接続先で判定
  const getDbEnvironment = () => {
    const dbUrl = process.env.DATABASE_URL || ''

    // ローカルDBの場合
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      return 'LOCAL'
    }

    // Railway本番DBの場合（実際の接続先で判定）
    // 本番DBのホスト名やデータベース名に基づいて判定
    if (dbUrl.includes('railway.app') || dbUrl.includes('railway')) {
      // DATABASE_URLからデータベース名またはホスト名を抽出して判定
      // 本番DBは通常 "postgresql://..." の形式
      // ここでは、RAILWAY_ENVIRONMENT_NAMEよりも実際のURLを優先

      // 明示的に本番DB用の識別子がある場合
      if (dbUrl.includes('-production-') || dbUrl.includes('production.')) {
        return 'PRD'
      }

      // RAILWAY_ENVIRONMENT_NAMEで判定（環境変数が設定されている場合）
      if (railwayEnv === 'production') {
        return 'PRD'
      } else if (railwayEnv) {
        return 'DEV'
      }

      // Railwayだが環境変数がない場合は、URLベースで推測
      // デフォルトでは本番DBとして扱う（安全側に倒す）
      return 'PRD'
    }

    // フォールバック: RAILWAY_ENVIRONMENT_NAMEで判定
    if (!railwayEnv) {
      return 'LOCAL'
    }

    if (railwayEnv === 'production') {
      return 'PRD'
    } else {
      return 'DEV'
    }
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
app.listen(PORT, '0.0.0.0', () => {
  const startupMsg = `🚀 Backend server running on port ${PORT}`
  const proxyMsg = `📡 OpenAI API Proxy enabled`

  console.log(startupMsg)
  console.log(proxyMsg)

  appendLog(startupMsg)
  appendLog(proxyMsg)
  appendLog('=====================================')
})
