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
  // 環境判定
  const getEnvironment = () => {
    const hostname = req.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'LOCAL'
    } else if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
      return 'Railway'
    } else {
      return 'PRODUCTION'
    }
  }

  // DB環境判定
  const getDbEnvironment = () => {
    const dbUrl = process.env.DATABASE_URL || ''
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      return 'LOCAL'
    } else if (dbUrl.includes('railway')) {
      return 'Railway'
    } else {
      return 'UNKNOWN'
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
